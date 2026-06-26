# Simple Tarot Infrastructure

This workspace contains the AWS CDK v2 app for Simple Tarot infrastructure.

## App Structure

- `bin/simple-tarot-infra.ts` is the CDK entrypoint.
- `lib/config.ts` loads deployment configuration from `apps/infra/.env`.
- `lib/cognito-stack.ts` defines the Cognito user pool, public OAuth app
  client, hosted domain, and Expo-facing CloudFormation outputs.
- `lib/bedrock-rag-stack.ts` defines the S3 corpus bucket, OpenSearch
  Serverless vector store, Bedrock Knowledge Base, S3 data source, and API
  handoff outputs for generated tarot readings.
- `test/cognito-stack.test.ts` contains CDK assertion tests for the stack
  contract.
- `test/bedrock-rag-stack.test.ts` contains CDK assertion tests for the
  Bedrock RAG contract.

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

After deploying the Bedrock RAG stack, sync these outputs into the API runtime
environment:

- `BedrockCorpusBucketName` -> `BEDROCK_CORPUS_BUCKET`
- `BedrockKnowledgeBaseId` -> `BEDROCK_KNOWLEDGE_BASE_ID`
- `BedrockDataSourceId` -> `BEDROCK_DATA_SOURCE_ID`
- `BedrockRegion` -> `BEDROCK_REGION`
- `BedrockGenerationModelId` -> `BEDROCK_INFERENCE_PROFILE_ID`

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
yarn workspace infra build
yarn workspace infra test
yarn workspace infra cdk synth
```

`yarn workspace infra cdk synth` requires a populated `apps/infra/.env`.
