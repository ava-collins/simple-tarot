# Simple Tarot Infrastructure

This workspace contains the AWS CDK v2 app for Simple Tarot infrastructure.

## App Structure

- `bin/simple-tarot-infra.ts` is the CDK entrypoint.
- `lib/config.ts` loads deployment configuration from `apps/infra/.env`.
- `lib/cognito-stack.ts` — Cognito user pool, OAuth app client, hosted domain.
- `lib/bedrock-infra-stack.ts` — S3 corpus bucket, IAM KB role, AOSS collection + policies.
- `lib/bedrock-kb-stack.ts` — Bedrock Knowledge Base, S3 data source, API service IAM role.
- `test/cognito-stack.test.ts` — CDK assertion tests.

## Stacks

### `SimpleTarotCognito-<env>`

Cognito auth infrastructure for the mobile app:

- Cognito user pool (email sign-in, self sign-up)
- Public app client for Expo/mobile OAuth authorization-code flow
- Hosted Cognito domain
- CloudFormation outputs that map to Expo `EXPO_PUBLIC_*` values

The app client has no client secret. `dev` uses destroy removal policy; `prod` uses retain + deletion protection.

### `SimpleTarotBedrockInfra-<env>`

AOSS and supporting infrastructure for the Bedrock Knowledge Base. Deployed first:

- S3 corpus bucket (`simple-tarot-corpus-<env>-<account>`)
- IAM role for the Bedrock KB service principal
- OpenSearch Serverless encryption policy
- OpenSearch Serverless network policy (`AllowFromPublic: true` — required by AWS for Bedrock without VPC)
- OpenSearch Serverless vector collection
- AOSS data access policy (grants KB role index read/write)

Exports `collectionArn`, `kbRoleArn`, `corpusBucketArn`, `corpusBucketName` to `BedrockKbStack`.

### `SimpleTarotBedrockKb-<env>`

Bedrock Knowledge Base and API resources. Deployed second, after a 90-second wait to allow AOSS data access policy propagation:

- Bedrock Knowledge Base (Titan Embeddings v2, OpenSearch Serverless storage)
- Bedrock S3 data source (fixed-size chunking, 300 tokens, 20% overlap)
- IAM role for the Express reading API service

Outputs (populate `apps/graph-api/.env` after deploy):
- `BedrockKnowledgeBaseId` → `BEDROCK_KB_ID`
- `BedrockDataSourceId` → `BEDROCK_KB_DATA_SOURCE_ID`
- `CorpusBucketName` → `CORPUS_BUCKET_NAME`
- `ApiRoleArn`

## Environment Configuration

```sh
cp apps/infra/.env.example apps/infra/.env
```

Fill in all values before running CDK commands. The `.env` file is gitignored.

Required variables:

```sh
SIMPLE_TAROT_ENV
SIMPLE_TAROT_AWS_REGION
SIMPLE_TAROT_MOBILE_CALLBACK_URL
SIMPLE_TAROT_MOBILE_LOGOUT_URL
SIMPLE_TAROT_WEB_CALLBACK_URL
SIMPLE_TAROT_WEB_LOGOUT_URL
SIMPLE_TAROT_COGNITO_DOMAIN_PREFIX
```

## Expo Contract

After deploying the Cognito stack, sync outputs into `apps/tarot/.env.local`. Full mapping in `docs/cognito_expo_config_contract.md`.

## Commands

```sh
yarn workspace infra build            # Compile CDK app
yarn workspace infra test             # Run CDK assertion tests
yarn workspace infra cdk synth        # Synthesize CloudFormation templates

# Bedrock stacks — deploy in sequence with 90s propagation wait
yarn bedrock:deploy                   # Deploy BedrockInfra then BedrockKb
yarn bedrock:destroy                  # Destroy BedrockKb then BedrockInfra

# Read outputs after deploy
aws cloudformation describe-stacks \
  --stack-name SimpleTarotBedrockKb-dev \
  --query 'Stacks[0].Outputs'
```

`yarn workspace infra cdk synth` requires a populated `apps/infra/.env`.
