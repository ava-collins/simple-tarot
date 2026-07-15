# Simple Tarot Infrastructure

This workspace contains the AWS CDK v2 app for Simple Tarot infrastructure.

-   [App Structure](#app-structure)
-   [Current State](#current-state)
-   [Environment Selection](#environment-selection)
-   [Cognito Stack](#cognito-stack)
-   [Bedrock RAG Stack](#bedrock-rag-stack)
-   [User Data Stack](#user-data-stack)
-   [API Stack](#api-stack)
-   [Environment Configuration](#environment-configuration)
-   [API Contract](#api-contract)
-   [Expo Contract](#expo-contract)
-   [Commands](#commands)
-   [Validation](#validation)
-   [Rollback](#rollback)

## Current State

`dev` is the pre-production/test environment and `prod` is the production
definition. The dev deployment targets `us-east-2` and provisions the
full Cognito, user-data, Bedrock RAG, and API path with Bedrock generation enabled.

## App Structure

-   `bin/simple-tarot-infra.ts` is the CDK entrypoint.
-   `lib/config.ts` selects `dev` or `prod` explicitly and loads deployment
    configuration from `apps/infra/.env.<environment>`.
-   `lib/simple-tarot-stage.ts` composes Cognito, user data, Bedrock RAG, and API
    stacks into one environment boundary.
-   `lib/cognito-stack.ts` defines the Cognito user pool, public OAuth app
    client, hosted domain, and Expo-facing CloudFormation outputs.
-   `lib/bedrock-rag-stack.ts` defines the S3 corpus bucket, OpenSearch
    Serverless vector store, Bedrock Knowledge Base, S3 data source, application
    inference profile, and API handoff outputs for generated tarot readings.
-   `lib/user-data-stack.ts` defines the DynamoDB user-data table and S3 API log
    bucket used by authenticated reading persistence.
-   `lib/api-stack.ts` defines the API Gateway HTTP API, Lambda runtime, Cognito
    JWT authorizer, and Lambda permissions for DynamoDB, S3 API logs, and
    Bedrock `RetrieveAndGenerate`.
-   `test/cognito-stack.test.ts` contains CDK assertion tests for the stack
    contract.
-   `test/bedrock-rag-stack.test.ts` contains CDK assertion tests for the
    Bedrock RAG contract.
-   `test/user-data-stack.test.ts` contains CDK assertion tests for the DynamoDB
    user-data table and S3 API log bucket.
-   `test/api-stack.test.ts` contains CDK assertion tests for the HTTP API,
    Lambda runtime, Cognito authorizer, and runtime permissions.
-   `test/config.test.ts` covers fail-closed environment selection and config
    loading.
-   `test/simple-tarot-stage.test.ts` covers stage names, tags, and same-stage
    resource wiring.

## Environment Selection

`dev` is the pre-production/test environment. `prod` is production. The CDK
entrypoint creates only the environment selected with
`-c environment=dev|prod`; omitting the context fails closed.

The stage-qualified selectors are:

```text
SimpleTarotDev/SimpleTarotCognito-dev
SimpleTarotDev/SimpleTarotUserData-dev
SimpleTarotDev/SimpleTarotBedrockRag-dev
SimpleTarotDev/SimpleTarotApi-dev

SimpleTarotProd/SimpleTarotCognito-prod
SimpleTarotProd/SimpleTarotUserData-prod
SimpleTarotProd/SimpleTarotBedrockRag-prod
SimpleTarotProd/SimpleTarotApi-prod
```

The explicit CloudFormation stack names after the slash preserve the existing
dev deployment names. Dev and prod configuration and outputs must not be
copied across environment boundaries.

## Cognito Stack

The current CDK app synthesizes one Cognito stack for the configured Simple
Tarot environment. The stack name follows:

```text
SimpleTarotCognito-<environment>
```

The stack creates:

-   a Cognito user pool for email sign-in and self sign-up
-   a public app client for Expo/mobile OAuth authorization-code flow
-   a hosted Cognito domain
-   CloudFormation outputs that map to Expo `EXPO_PUBLIC_*` values

The app client does not create a client secret. Expo receives public
identifiers and URLs only.

`dev` uses destroy removal policy for iteration. `prod` uses retain removal
policy plus Cognito deletion protection. Create and review real `.env.prod`
values before evaluating or deploying production.

## Bedrock RAG Stack

The CDK app also synthesizes one Bedrock RAG stack for the configured Simple
Tarot environment. The stack name follows:

```text
SimpleTarotBedrockRag-<environment>
```

The stack creates:

-   an S3 bucket for normalized corpus documents
-   an OpenSearch Serverless `VECTORSEARCH` collection and vector index
-   OpenSearch Serverless encryption, network, and data access policies
-   a Bedrock Knowledge Base using the configured embedding model
-   an S3 data source scoped to the configured corpus prefix
-   a regional Bedrock application inference profile for the configured
    generation model
-   CloudFormation outputs consumed by `apps/api`

The first MVP pass uses public OpenSearch Serverless network access so Bedrock
can manage ingestion without introducing VPC routing. Tighten this after the
API deployment topology is known.

## User Data Stack

The CDK app synthesizes one user-data stack for the configured Simple Tarot
environment. The stack name follows:

```text
SimpleTarotUserData-<environment>
```

The stack creates:

-   a DynamoDB table with `pk` and `sk` string keys for user profile, successful
    reading, and failed reading-attempt items
-   an S3 bucket for structured API request/diagnostic logs under `api-logs/`
-   CloudFormation outputs for table name/ARN and log bucket name/ARN

Development environments use destroy removal policy and a 30-day API log
lifecycle. Production uses retain removal policy and point-in-time recovery for
the DynamoDB table.

## API Stack

The CDK app synthesizes one API stack for the configured Simple Tarot
environment. The stack name follows:

```text
SimpleTarotApi-<environment>
```

The stack creates:

-   a Node.js 22 Lambda for `apps/api`
-   an API Gateway HTTP API protected by the Cognito JWT authorizer
-   `ANY /{proxy+}` and `ANY /` routes to the Lambda integration
-   Lambda environment variables for Bedrock runtime mode, the `us-east-2`
    Knowledge Base and application inference profile, user-data table, and API
    log bucket
-   least-privilege grants for DynamoDB read/write and S3 API log writes
-   permission to call Bedrock Agent Runtime `RetrieveAndGenerate`
-   `ApiUrl`, `ApiFunctionName`, and `ApiFunctionArn` outputs

`ApiUrl` is the mobile app's `EXPO_PUBLIC_TAROT_API_URL`. The current API uses
API Gateway HTTP API, so this output does not include a REST API stage path such
as `/dev`.

The API stack deploys `BEDROCK_RUNTIME_MODE=bedrock` and receives the Knowledge
Base ID, `us-east-2` region, and application inference profile ARN directly
from the Bedrock stack. The Lambda role can call
`bedrock:RetrieveAndGenerate`; corpus upload and ingestion must complete before
generated readings can retrieve context.

## Environment Configuration

Deployment-specific values are intentionally kept out of committed source and
are loaded from the file matching the explicit CDK environment:

-   `apps/infra/.env.dev`
-   `apps/infra/.env.prod`

For an existing checkout, preserve the current dev values with a one-time
non-destructive copy:

```sh
cp apps/infra/.env apps/infra/.env.dev
```

Add or update `SIMPLE_TAROT_ENV=dev` in `.env.dev`, verify the copied values,
and only then remove the obsolete `.env` manually. Do not print or commit the
real file. Both real environment files are ignored by git.

For a new environment file, copy the matching template:

```sh
cp apps/infra/.env.dev.example apps/infra/.env.dev
cp apps/infra/.env.prod.example apps/infra/.env.prod
```

Fill in every required value before running a command for that environment.
The declared `SIMPLE_TAROT_ENV` must match the CDK context selection.

The example file lists required variable names only:

-   `SIMPLE_TAROT_ENV`
-   `SIMPLE_TAROT_AWS_REGION`
-   `SIMPLE_TAROT_MOBILE_CALLBACK_URL`
-   `SIMPLE_TAROT_MOBILE_LOGOUT_URL`
-   `SIMPLE_TAROT_WEB_CALLBACK_URL`
-   `SIMPLE_TAROT_WEB_LOGOUT_URL`
-   `SIMPLE_TAROT_COGNITO_DOMAIN_PREFIX`
-   `SIMPLE_TAROT_BEDROCK_CORPUS_PREFIX`
-   `SIMPLE_TAROT_BEDROCK_EMBEDDING_MODEL_ID`
-   `SIMPLE_TAROT_BEDROCK_EMBEDDING_DIMENSIONS`
-   `SIMPLE_TAROT_BEDROCK_GENERATION_MODEL_ID`

Do not commit real environment values.

The Bedrock values have safe defaults in both example files. Override
them only when changing model choices, embedding dimensions, or the S3 object
prefix used for corpus ingestion.

The stack grants OpenSearch Serverless index creation to the standard modern
CDK CloudFormation execution role:

```text
arn:aws:iam::<account-id>:role/cdk-hnb659fds-cfn-exec-role-<account-id>-<region>
```

## API Contract

The deployed API stack receives Cognito, user-data, log-bucket, Knowledge Base,
region, and application inference profile values through same-stage CDK
references. For direct local API runs in Bedrock mode, copy the matching
CloudFormation outputs into `apps/api/.env`. Never mix outputs between
environments.

Bedrock outputs:

-   `BedrockCorpusBucketName` -> `BEDROCK_CORPUS_BUCKET`
-   `BedrockKnowledgeBaseId` -> `BEDROCK_KNOWLEDGE_BASE_ID`
-   `BedrockDataSourceId` -> `BEDROCK_DATA_SOURCE_ID`
-   `BedrockRegion` -> `BEDROCK_REGION`
-   `BedrockInferenceProfileArn` -> `BEDROCK_INFERENCE_PROFILE_ARN`
-   `BedrockGenerationModelId` -> informational source-model identifier

User-data outputs:

-   `UserDataTableName` -> `USER_DATA_TABLE_NAME`
-   `ApiLogBucketName` -> `API_LOG_BUCKET_NAME`

Cognito outputs:

-   `CognitoIssuer` -> `COGNITO_ISSUER`
-   `CognitoUserPoolClientId` -> `COGNITO_CLIENT_ID`

## Expo Contract

The Expo-facing public output contract is documented in
[Cognito -> Expo Config Contract](../../docs/cognito_expo_config_contract.md).

After a dev deployment, sync only dev CDK outputs into:

-   `apps/tarot/.env.local` for local development
-   EAS environment variables for preview/testing builds

Sync prod outputs only into the production EAS environment.

Use `apps/tarot/.env.local.example` as the local template. The real
`.env.local` file is ignored by git.

The Expo RSC pilot still consumes the existing `ApiUrl` through Server
Functions rather than replacing the API Gateway/Lambda deployment. See
[RSC Readings and Avatars Pilot](../../docs/rsc-readings-and-avatars-pilot.md)
for the current boundary and release limitations.

## Commands

Run local tests, type validation, stack listing, and synthesis with the
administrator profile and the populated dev configuration:

```sh
yarn workspace infra test --runInBand
yarn workspace infra build-types
env AWS_PROFILE=your-administrator-profile yarn workspace infra cdk list -c environment=dev
env AWS_PROFILE=your-administrator-profile yarn workspace infra cdk synth -c environment=dev 'SimpleTarotDev/*'
```

Diff and deploy the dev application:

```sh
env AWS_PROFILE=your-administrator-profile yarn workspace infra cdk diff --method=template --exclusively -c environment=dev 'SimpleTarotDev/*'
env AWS_PROFILE=your-administrator-profile yarn workspace infra cdk deploy --exclusively -c environment=dev 'SimpleTarotDev/*'
```

Production uses the equivalent explicit selector. Because prod is intentionally
not deployed, first create and review real `apps/infra/.env.prod` values, then
run:

```sh
env AWS_PROFILE=your-administrator-profile yarn workspace infra cdk list -c environment=prod
env AWS_PROFILE=your-administrator-profile yarn workspace infra cdk synth -c environment=prod 'SimpleTarotProd/*'
env AWS_PROFILE=your-administrator-profile yarn workspace infra cdk diff --method=template --exclusively -c environment=prod 'SimpleTarotProd/*'
env AWS_PROFILE=your-administrator-profile yarn workspace infra cdk deploy --exclusively -c environment=prod 'SimpleTarotProd/*'
```

Every list, synth, diff, or deploy command requires the matching populated
`.env.<environment>` file. Review diffs before deployment; replacement of
Cognito, DynamoDB, or S3 resources requires explicit investigation and
approval.

## Validation

Confirm the dev API health endpoint:

```sh
DEV_API_URL=https://your-dev-api-id.execute-api.us-east-2.amazonaws.com
curl -s -o /dev/null -w '%{http_code}\n' "${DEV_API_URL}/health"
```

The unauthenticated health request should return `401`, confirming that the
deployed API authorizer is active.

## Rollback

Redeploy the last known-good revision for the target environment. From a
checkout of that reviewed revision, run the matching application command:

```sh
env AWS_PROFILE=your-administrator-profile yarn workspace infra cdk deploy --exclusively -c environment=dev 'SimpleTarotDev/*'
env AWS_PROFILE=your-administrator-profile yarn workspace infra cdk deploy --exclusively -c environment=prod 'SimpleTarotProd/*'
```

Allow CloudFormation to roll back a failed update. Never delete a prod stack as
routine rollback, and do not treat DynamoDB point-in-time recovery as routine
deployment rollback.
