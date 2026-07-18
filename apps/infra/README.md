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
full Cognito, user-data, Bedrock RAG, and API path with Bedrock generation and deterministic
composer runtime enabled.

## App Structure

-   `bin/simple-tarot-infra.ts` is the CDK entrypoint.
-   `lib/config.ts` selects `dev` or `prod` explicitly and loads deployment
    configuration from `apps/infra/.env.<environment>`.
-   `lib/simple-tarot-stage.ts` composes Cognito, user data, Bedrock RAG, and API
    stacks into one environment boundary.
-   `lib/cognito-stack.ts` defines the Cognito user pool, public OAuth app
    client, hosted domain, and Expo-facing CloudFormation outputs.
-   `lib/bedrock-rag-stack.ts` defines the S3 corpus bucket, S3 Vectors vector
    store, Bedrock Knowledge Base, S3 data source, application inference
    profile, and API handoff outputs for generated tarot readings.
-   `lib/user-data-stack.ts` defines the DynamoDB user-data table and S3 API log
    bucket used by authenticated reading persistence.
-   `lib/api-stack.ts` defines the API Gateway HTTP API, Lambda runtime, Cognito
    JWT authorizer, and Lambda permissions for DynamoDB, S3 API logs, and
    Bedrock (`Retrieve`, `GetInferenceProfile`, and `InvokeModel`). Consumes
    `BedrockRagStack`/`UserDataStack`/`CognitoStack`
    resources with `ReferenceStrength.STRONG`.
    Development also receives the corpus bucket/data-source identities and exact read-only
    composer artifact grants.
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

-   a private S3 bucket for approved corpus artifacts
-   an Amazon S3 Vectors vector bucket and vector index
-   a Bedrock Knowledge Base using the configured embedding model, backed by
    the S3 Vectors index
-   an S3 data source scoped to the configured corpus prefix
-   a regional Bedrock application inference profile for the configured
    generation model
-   CloudFormation outputs consumed by `apps/api`

Development uses the selective corpus data source at `corpus/active/` with `NONE` chunking and a
`DELETE` data deletion policy. Each approved semantic object is ingested as one document. Production
retains the legacy `corpus/` prefix and fixed-size 200-token, 20-percent-overlap definition. The
development API performs explicit filtered Knowledge Base retrieval followed by Converse; the
private corpus workflow owns publication and activation for the development destination.

The implemented [Deterministic Composer Runtime](../../docs/deterministic-composer-runtime.md)
grants only the development API narrowly scoped reads for the active pointer, release manifest,
and composer bundle. Production remains composer-disabled and receives no artifact-read grant.

S3 Vectors was chosen over OpenSearch Serverless for cost: OpenSearch
Serverless carries a fixed OCU-hour floor even in non-redundant mode
(~$174/mo), while S3 Vectors is pure pay-per-use with no fixed floor. The
tradeoff is retrieval latency — sub-second/cold, as low as 100ms warm for S3
Vectors versus OpenSearch Serverless's sub-millisecond — acceptable for this
app's single-request reading flow.

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
-   development-only composer mode, corpus bucket, and data-source identities
-   least-privilege grants for DynamoDB read/write and S3 API log writes
-   development-only `s3:GetObject` for the active pointer, release manifests,
    and composer bundles
-   scoped permission to call Bedrock Agent Runtime `Retrieve` on the Knowledge Base,
    `GetInferenceProfile` on the application inference profile, and `InvokeModel` on the profile
    and underlying foundation model
-   `ApiUrl`, `ApiFunctionName`, and `ApiFunctionArn` outputs

`ApiUrl` is the mobile app's `EXPO_PUBLIC_TAROT_API_URL`. The current API uses
API Gateway HTTP API, so this output does not include a REST API stage path such
as `/dev`. Every route requires a valid Cognito JWT at the gateway layer — the
API's own "unauthenticated reads permitted" logic is unreachable through the
deployed URL; it only applies when running the Express app directly.

The API stack deploys `BEDROCK_RUNTIME_MODE=bedrock` unconditionally (no
deployed local-mode fallback) and receives the Knowledge Base ID, `us-east-2`
region, and application inference profile ARN directly from the Bedrock stack
via `ReferenceStrength.STRONG` cross-stack references (CloudFormation
Export/Import, not the CDK default `Fn::GetStackOutput` — needed so a plain
`cdk deploy` of this stack reliably picks up a replaced Knowledge Base or
inference profile from `SimpleTarotBedrockRag-<env>`). The Lambda role can call
`bedrock:Retrieve` on the Knowledge Base, `bedrock:GetInferenceProfile` on the
application inference profile, and `bedrock:InvokeModel` on the profile and underlying foundation
model. The API uses the profile for one Converse call after explicit retrieval. Private corpus
activation and ingestion
must complete before generated readings can retrieve context.
Corpus sources, transformation code, relationship rules, and generated artifacts are private;
this public workspace provisions their AWS destination but does not build them. Follow
[Bedrock Corpus Operations](../../docs/bedrock_corpus_operations.md) only after the corpus owner
provides an approved artifact.

Development sets `COMPOSER_RUNTIME_MODE=enabled` and consumes
`BEDROCK_CORPUS_BUCKET` plus `BEDROCK_DATA_SOURCE_ID` through strong same-stage references.
Production sets composer mode disabled and has no composer S3 grant. See
[Deterministic Composer Runtime](../../docs/deterministic-composer-runtime.md) for loading,
compatibility, verification, and rollback.

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

The Bedrock values have environment-specific defaults in both example files. Development targets
`corpus/active/`; production retains `corpus/`. Override them only when deliberately changing model
choices, embedding dimensions, or the S3 object prefix used for corpus ingestion.

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

Development composer handoff:

-   `BedrockCorpusBucketName` -> `BEDROCK_CORPUS_BUCKET`
-   `BedrockDataSourceId` -> `BEDROCK_DATA_SOURCE_ID`
-   environment definition -> `COMPOSER_RUNTIME_MODE=enabled`

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

For composer-only rollback, review a development diff with composer mode disabled. It must remove
`BEDROCK_CORPUS_BUCKET`, `BEDROCK_DATA_SOURCE_ID`, the three composer `s3:GetObject` patterns, and
their dependent exports. Because deployed Bedrock generation requires composed context, disabling
composer is not a live Bedrock fallback; use local mode only for offline placeholder development.
See
[Deterministic Composer Runtime](../../docs/deterministic-composer-runtime.md#rollback).

For a general stack rollback, redeploy the last known-good revision for the target environment. From a
checkout of that reviewed revision, run the matching application command:

```sh
env AWS_PROFILE=your-administrator-profile yarn workspace infra cdk deploy --exclusively -c environment=dev 'SimpleTarotDev/*'
env AWS_PROFILE=your-administrator-profile yarn workspace infra cdk deploy --exclusively -c environment=prod 'SimpleTarotProd/*'
```

Allow CloudFormation to roll back a failed update. Never delete a prod stack as
routine rollback, and do not treat DynamoDB point-in-time recovery as routine
deployment rollback.
