# Agent Checklist: Bedrock RAG Changes

Use this checklist before modifying the Bedrock RAG API, corpus, or infra
integration.

## First Read

Read these files before editing:

- `docs/bedrock_rag_api_integration.md`
- `docs/bedrock_corpus_operations.md`
- `docs/user_reading_persistence.md`
- `.agents/bedrock-rag-api-reference.md`
- `apps/api/README.md`
- `apps/infra/README.md`
- `apps/tarot/README.md`

Then inspect the exact code path you are changing.

## Preserve Contracts

API request contract:

- `spread`
- `items[].cardIndex`
- `items[].cardName`
- `items[].position`
- `items[].reversed`
- optional `question`

API response contract:

- `readingId`
- `spread`
- `summary`
- `positions`
- `citations`
- `metadata`

Corpus document contract:

- `id`
- `kind`
- `text`
- `metadata.cardIndex`
- `metadata.cardName`
- `metadata.keywords`
- `metadata.orientation`
- `metadata.position`
- `metadata.sourceCollection`
- `metadata.sourcePath`
- `metadata.spread`

Infrastructure output names:

- `ApiUrl`
- `ApiFunctionName`
- `ApiFunctionArn`
- `UserDataTableName`
- `UserDataTableArn`
- `ApiLogBucketName`
- `ApiLogBucketArn`
- `BedrockCorpusBucketName`
- `BedrockKnowledgeBaseId`
- `BedrockDataSourceId`
- `BedrockRegion`
- `BedrockGenerationModelId`
- `BedrockEmbeddingModelId`

## Common Change Areas

When changing prompt behavior:

- Edit `apps/api/src/readings/prompt-builder.ts`.
- Update `apps/api/src/readings/prompt-builder.test.ts`.
- Keep card order, position, and orientation explicit in the prompt.

When changing Bedrock runtime behavior:

- Edit `apps/api/src/bedrock/bedrock-client.ts` or
  `apps/api/src/config.ts`.
- Update `apps/api/src/bedrock/bedrock-client.test.ts` or
  `apps/api/src/config.test.ts`.
- Preserve inference profile precedence unless intentionally changing API env
  semantics.
- Remember that the deployed API stack currently sets
  `BEDROCK_RUNTIME_MODE=local`; enabling Bedrock requires an API stack/Lambda
  environment update and deployment.

When changing reading persistence behavior:

- Edit `apps/api/src/readings/persistence/*` and, if route wiring changes,
  `apps/api/src/routes/readings.ts`.
- Update `apps/api/src/readings/persistence/reading-history-store.test.ts` and
  `apps/api/src/routes/readings.test.ts`.
- Preserve key shapes unless intentionally migrating data:
  - `USER#<sub>` / `PROFILE`
  - `USER#<sub>` / `READING#<createdAt>#<readingId>`
  - `USER#<sub>` / `READING_ATTEMPT#<createdAt>#<requestId>`
- Keep source IP, user agent, route, method, duration, and similar API metadata
  out of DynamoDB; those belong in S3 API logs.
- Keep authorization headers, tokens, cookies, and full raw request bodies out
  of logs.

When changing mobile reading history behavior:

- Edit `apps/tarot/src/api/tarot-api.ts`,
  `apps/tarot/src/readings/use-reading-history.ts`, or
  `apps/tarot/src/app/readings/*`.
- Update nearby tarot tests.
- Use the exact `ApiUrl` output for `EXPO_PUBLIC_TAROT_API_URL`; do not append
  `/dev` for the current HTTP API.
- Keep failed attempts hidden from the user-facing history screen unless the
  product requirement changes.

When changing corpus shape:

- Edit `apps/api/src/corpus/normalize-corpus.ts` and
  `apps/api/src/corpus/types.ts`.
- Update `apps/api/src/corpus/normalize-corpus.test.ts`.
- Run normalization and inspect generated JSONL.
- Update human and agent docs if generated record semantics change.

When changing infra:

- Edit the relevant stack in `apps/infra/lib/*`:
  - Bedrock resources: `bedrock-rag-stack.ts`
  - user-data table or API log bucket: `user-data-stack.ts`
  - HTTP API/Lambda/Cognito authorizer/runtime env: `api-stack.ts`
  - config naming/defaults: `config.ts`
- Update the matching `apps/infra/test/*.test.ts`.
- Keep CloudFormation outputs stable unless coordinating an API/deployment
  handoff update.

## Upload And Sync Reality Check

The repo does not currently contain corpus upload or Knowledge Base sync
scripts. If a task needs live retrieval after corpus changes, account for
these manual steps:

```sh
aws s3 cp apps/api/corpus/generated/tarot-corpus.jsonl \
  s3://<BedrockCorpusBucketName>/<prefix>tarot-corpus.jsonl

aws bedrock-agent start-ingestion-job \
  --knowledge-base-id <BedrockKnowledgeBaseId> \
  --data-source-id <BedrockDataSourceId>
```

Default prefix is `corpus/`.

## Known Follow-Up Candidates

- Add `metadata.mode = bedrock` when Bedrock generation is used.
- Decide whether Bedrock successful readings need additional generation
  metadata beyond `modelId`, item count, and mode.
- Add scripted corpus upload.
- Add scripted ingestion start and status polling.
- Consider a long-lived Bedrock runtime generator instead of creating one in
  the request path.
- Revisit OpenSearch Serverless public network policy after API deployment
  topology is known.

## Required Verification

For API changes:

```sh
yarn workspace api test
yarn workspace api build-types
```

For infra changes:

```sh
yarn workspace infra test
yarn workspace infra build-types
```

For docs-only changes:

```sh
git diff --check
```

For mobile reading-history changes:

```sh
yarn workspace tarot test
yarn workspace tarot build-types
```
