# Simple Tarot Infrastructure

This workspace contains the AWS CDK v2 app for Simple Tarot infrastructure.

- [App Structure](#app-structure)
- [Cognito Stack](#cognito-stack)
- [Bedrock RAG Stack](#bedrock-rag-stack)
- [User Data Stack](#user-data-stack)
- [API Stack](#api-stack)
- [Environment Configuration](#environment-configuration)
- [API Contract](#api-contract)
- [Expo Contract](#expo-contract)
- [Commands](#commands)

## App Structure

- `bin/simple-tarot-infra.ts` is the CDK entrypoint.
- `lib/config.ts` loads deployment configuration from `apps/infra/.env`.
- `lib/cognito-stack.ts` defines the Cognito user pool, public OAuth app
  client, hosted domain, and Expo-facing CloudFormation outputs.
- `lib/bedrock-rag-stack.ts` defines the S3 corpus bucket, OpenSearch
  Serverless vector store, Bedrock Knowledge Base, S3 data source, and API
  handoff outputs for generated tarot readings.
- `lib/user-data-stack.ts` defines the DynamoDB user-data table and S3 API log
  bucket used by authenticated reading persistence.
- `lib/api-stack.ts` defines the API Gateway HTTP API, Lambda runtime, Cognito
  JWT authorizer, and Lambda permissions for DynamoDB, S3 API logs, and
  Bedrock.
- `test/cognito-stack.test.ts` contains CDK assertion tests for the stack
  contract.
- `test/bedrock-rag-stack.test.ts` contains CDK assertion tests for the
  Bedrock RAG contract.
- `test/user-data-stack.test.ts` contains CDK assertion tests for the DynamoDB
  user-data table and S3 API log bucket.
- `test/api-stack.test.ts` contains CDK assertion tests for the HTTP API,
  Lambda runtime, Cognito authorizer, and runtime permissions.

## Cognito Stack

The current CDK app synthesizes one Cognito stack for the configured Simple
Tarot environment. The stack name follows:

```text
SimpleTarotCognito-<environment>
```

The stack creates:

- a Cognito user pool for email sign-in and self sign-up
- a public app client for Expo/mobile OAuth authorization-code flow
- a hosted Cognito domain
- CloudFormation outputs that map to Expo `EXPO_PUBLIC_*` values

The app client does not create a client secret. Expo receives public
identifiers and URLs only.

`dev` uses destroy removal policy for iteration. `prod` uses retain removal
policy plus Cognito deletion protection, but production deployment settings
should be reviewed before first deployment.

## Bedrock RAG Stack

The CDK app also synthesizes one Bedrock RAG stack for the configured Simple
Tarot environment. The stack name follows:

```text
SimpleTarotBedrockRag-<environment>
```

The stack creates:

- an S3 bucket for normalized corpus documents
- an OpenSearch Serverless `VECTORSEARCH` collection and vector index
- OpenSearch Serverless encryption, network, and data access policies
- a Bedrock Knowledge Base using the configured embedding model
- an S3 data source scoped to the configured corpus prefix
- CloudFormation outputs consumed by `apps/api`

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

- a DynamoDB table with `pk` and `sk` string keys for user profile, successful
  reading, and failed reading-attempt items
- an S3 bucket for structured API request/diagnostic logs under `api-logs/`
- CloudFormation outputs for table name/ARN and log bucket name/ARN

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

- a Node.js 22 Lambda for `apps/api`
- an API Gateway HTTP API protected by the Cognito JWT authorizer
- `ANY /{proxy+}` and `ANY /` routes to the Lambda integration
- Lambda environment variables for Bedrock, user-data table, and API log bucket
- least-privilege grants for DynamoDB read/write, S3 API log writes, and
  Bedrock `RetrieveAndGenerate`
- `ApiUrl`, `ApiFunctionName`, and `ApiFunctionArn` outputs

`ApiUrl` is the mobile app's `EXPO_PUBLIC_TAROT_API_URL`. The current API uses
API Gateway HTTP API, so this output does not include a REST API stage path such
as `/dev`.

The API stack currently deploys `BEDROCK_RUNTIME_MODE=local` so the mobile
reading-history persistence flow works while Bedrock model access is pending.
When Bedrock access is approved, change the Lambda environment to
`BEDROCK_RUNTIME_MODE=bedrock`, confirm corpus ingestion, and redeploy
`SimpleTarotApi-<environment>`.

## Environment Configuration

Deployment-specific values are intentionally kept out of committed source and
are loaded from `apps/infra/.env`.

Create the local env file from the example:

```sh
cp apps/infra/.env.example apps/infra/.env
```

Then fill in every value in `apps/infra/.env` before running CDK commands. The
real `.env` file is ignored by git.

The example file lists required variable names only:

- `SIMPLE_TAROT_ENV`
- `SIMPLE_TAROT_AWS_REGION`
- `SIMPLE_TAROT_MOBILE_CALLBACK_URL`
- `SIMPLE_TAROT_MOBILE_LOGOUT_URL`
- `SIMPLE_TAROT_WEB_CALLBACK_URL`
- `SIMPLE_TAROT_WEB_LOGOUT_URL`
- `SIMPLE_TAROT_COGNITO_DOMAIN_PREFIX`
- `SIMPLE_TAROT_BEDROCK_CORPUS_PREFIX`
- `SIMPLE_TAROT_BEDROCK_EMBEDDING_MODEL_ID`
- `SIMPLE_TAROT_BEDROCK_EMBEDDING_DIMENSIONS`
- `SIMPLE_TAROT_BEDROCK_GENERATION_MODEL_ID`
- `SIMPLE_TAROT_AOSS_INDEX_PRINCIPAL_ARN`

Do not commit real environment values.

The Bedrock values have safe development defaults in `.env.example`. Override
them only when changing model choices, embedding dimensions, or the S3 object
prefix used for corpus ingestion.

`SIMPLE_TAROT_AOSS_INDEX_PRINCIPAL_ARN` is optional. By default the stack grants
OpenSearch Serverless index creation to the standard modern CDK CloudFormation
execution role:

```text
arn:aws:iam::<account-id>:role/cdk-hnb659fds-cfn-exec-role-<account-id>-<region>
```

Set `SIMPLE_TAROT_AOSS_INDEX_PRINCIPAL_ARN` when deploying with a custom
CloudFormation execution role or CI deployment role.

## API Contract

The deployed API stack wires Bedrock, Cognito, user-data, and log-bucket
outputs directly into Lambda environment variables. For local API runs, copy the
same CloudFormation outputs into `apps/api/.env`.

Bedrock outputs:

- `BedrockCorpusBucketName` -> `BEDROCK_CORPUS_BUCKET`
- `BedrockKnowledgeBaseId` -> `BEDROCK_KNOWLEDGE_BASE_ID`
- `BedrockDataSourceId` -> `BEDROCK_DATA_SOURCE_ID`
- `BedrockRegion` -> `BEDROCK_REGION`
- `BedrockGenerationModelId` -> `BEDROCK_INFERENCE_PROFILE_ID`

User-data outputs:

- `UserDataTableName` -> `USER_DATA_TABLE_NAME`
- `ApiLogBucketName` -> `API_LOG_BUCKET_NAME`

Cognito outputs:

- `CognitoIssuer` -> `COGNITO_ISSUER`
- `CognitoUserPoolClientId` -> `COGNITO_CLIENT_ID`

## Expo Contract

The Expo-facing public output contract is documented in
`docs/cognito_expo_config_contract.md`.

After deployment, sync the CDK outputs into:

- `apps/tarot/.env.local` for local development
- EAS environment variables for preview/testing builds

Use `apps/tarot/.env.local.example` as the local template. The real
`.env.local` file is ignored by git.

## Commands

```sh
yarn workspace infra build-types
yarn workspace infra test
yarn workspace infra cdk synth
```

`yarn workspace infra cdk synth` requires a populated `apps/infra/.env`.
