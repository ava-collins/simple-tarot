# US East (Ohio) Bedrock End-to-End Design

## Goal

Deploy the Simple Tarot dev environment in `us-east-2` and verify the real
mobile application flow from Cognito sign-up through a persisted, grounded
Bedrock tarot reading. No deployed application resource or model invocation
may depend on `us-east-1`.

## Established Findings

- AWS IAM Identity Center authentication and the assigned administrator
  permission set work correctly.
- The Amazon Bedrock playground succeeds in `us-east-2` and fails with a daily
  token throttling error in `us-east-1`.
- `amazon.titan-embed-text-v2:0` is active for on-demand inference in
  `us-east-2`.
- `anthropic.claude-sonnet-4-5-20250929-v1:0` is active in `us-east-2` through
  inference profiles.
- The current CDK and local API environment files select `us-east-1`.
- The deployed API definition currently forces `BEDROCK_RUNTIME_MODE=local`
  and does not receive Knowledge Base configuration or Bedrock permission.
- No application infrastructure has been deployed yet.

## Model Routing Decision

The Bedrock stack will create an application inference profile whose model
source is the `us-east-2` Claude Sonnet 4.5 foundation-model ARN. This profile
is single-region and prevents requests from being routed through `us-east-1`.

The existing global system-defined inference profile will not be used. A
global profile accepts requests from `us-east-2`, but it can route processing
to other commercial Regions and therefore does not prove that the known-good
Region is serving the request.

The existing Titan Text Embeddings V2 model remains the Knowledge Base
embedding model with 1,024 dimensions.

## Infrastructure Architecture

The explicit `SIMPLE_TAROT_AWS_REGION` value remains the source of truth for
the CDK stage. The dev configuration and its examples will select
`us-east-2`, and that value will continue to flow into Cognito, user data,
Bedrock, API Gateway, and Lambda resources.

The Bedrock RAG stack will continue to own:

- the versioned S3 corpus bucket;
- the OpenSearch Serverless vector collection and index;
- the Bedrock Knowledge Base and S3 data source; and
- the Knowledge Base service role and its embedding-model permission.

It will additionally own the single-region application inference profile and
expose the profile ARN as a stack property and CloudFormation output.

The stage will pass the Knowledge Base and inference-profile ARN directly into
the API stack through typed CDK properties. This creates an explicit
CloudFormation dependency and avoids copying identifiers into deployment
configuration by hand.

## API Runtime

The deployed Lambda will receive:

- `BEDROCK_RUNTIME_MODE=bedrock`;
- `BEDROCK_REGION=us-east-2`;
- `BEDROCK_KNOWLEDGE_BASE_ID` from the Knowledge Base resource; and
- `BEDROCK_INFERENCE_PROFILE_ARN` from the application inference profile.

The Lambda will retain `BedrockAgentRuntimeClient` and
`RetrieveAndGenerateCommand`. This is the correct API for retrieving Knowledge
Base context and returning generated text with citations. `Converse` and
`BedrockRuntimeClient` are not used because Converse alone would bypass the
Knowledge Base retrieval flow.

The Lambda role will receive `bedrock:RetrieveAndGenerate` with
`Resource: "*"`. AWS does not currently expose resource-level scoping for this
action. No broader Bedrock administrator permissions will be added.

The deployed environment will not fall back to local placeholder generation.
Missing configuration, ingestion failures, model access failures, and runtime
errors must remain visible so the end-to-end test cannot pass without Bedrock.

## Request and Data Flow

1. A user signs up and confirms the account through the mobile app's Cognito
   flow.
2. The user signs in and receives a Cognito token.
3. The app sends an authenticated reading request through API Gateway.
4. API Gateway validates the token and invokes the Lambda.
5. The Lambda builds the grounded reading prompt and calls
   `RetrieveAndGenerate` at the Bedrock Agent Runtime `us-east-2` endpoint.
6. The Knowledge Base retrieves ingested corpus chunks from the OpenSearch
   Serverless vector index.
7. The single-region application inference profile invokes Claude Sonnet 4.5
   in `us-east-2`.
8. The Lambda maps generated text and citations into the API response and
   persists the reading in DynamoDB for the authenticated user.
9. The app displays the reading and can retrieve it from reading history.

## Corpus Deployment

Infrastructure deployment creates an empty corpus bucket and Knowledge Base.
A meaningful end-to-end test therefore includes the existing corpus workflow:

1. Normalize `assets/ignore/corpus-source.json` into
   `apps/api/corpus/generated/tarot-corpus.jsonl`.
2. Upload the JSONL file beneath the deployed bucket's configured `corpus/`
   prefix.
3. Start an ingestion job for the deployed Knowledge Base and data source.
4. Wait for the ingestion job to reach `COMPLETE` before invoking the API.

An ingestion status other than `COMPLETE` blocks the application smoke test.

## Error Handling and Logging

The existing request-boundary logging remains in place. Logs may include the
Knowledge Base ID, model/profile ARN, request ID, retrieval count, prompt
length, citation count, and response length. Logs must not contain AWS
credentials, Cognito tokens, or the complete user prompt.

Bedrock throttling remains a retryable HTTP 429 response. Configuration,
authorization, model, Knowledge Base, and ingestion errors remain failures and
must not be replaced with local readings. The AWS SDK retry configuration
continues to use the configured bounded `maxAttempts` value.

## Deployment and Verification

Before AWS deployment:

1. Run API and infrastructure unit tests.
2. Run API and infrastructure TypeScript checks.
3. Synthesize the dev CDK stage.
4. Inspect active configuration and synthesized templates for `us-east-1`.
   Test-only malformed-token fixtures may retain fictional Region values only
   when they are unrelated to deployment behavior.
5. Confirm the synthesized Lambda uses Bedrock mode and receives the Knowledge
   Base ID, `us-east-2` Region, and application inference-profile ARN.
6. Confirm its IAM policy contains `bedrock:RetrieveAndGenerate` without
   unrelated Bedrock actions.

AWS deployment proceeds in `us-east-2` using the established IAM Identity
Center administrator profile. CDK bootstrap is performed first if the Region
does not already contain the standard bootstrap stack. The dev stage is then
deployed, followed by corpus upload and ingestion.

The deployed Cognito and API outputs are synced to the mobile app's ignored
local environment file. Verification uses the real app sign-up and sign-in
flow rather than a synthetic test user.

## Success Criteria

The work is complete when all of the following are true:

- all dev infrastructure is deployed in `us-east-2`;
- the application inference profile targets only the `us-east-2` Claude
  Sonnet 4.5 foundation model;
- corpus ingestion completes successfully;
- a user can sign up, confirm, and sign in through the mobile app;
- the authenticated app can request a reading successfully;
- response metadata identifies Bedrock generation rather than local mode;
- the reading includes grounded retrieval output and citations when relevant;
- the reading is persisted and returned in that user's history;
- CloudWatch logs show the `us-east-2` Knowledge Base and application
  inference-profile ARN without leaking prompt or authentication secrets; and
- active configuration, synthesized infrastructure, and runtime resources do
  not depend on `us-east-1`.

## Non-Goals

- Production deployment is not part of this change.
- Cross-Region or global model routing is not enabled.
- The API is not migrated from Knowledge Base `RetrieveAndGenerate` to
  Converse or raw `InvokeModel`.
- The OpenSearch Serverless networking model is not redesigned.
- Unrelated authentication, UI, or data-model behavior is not refactored.
