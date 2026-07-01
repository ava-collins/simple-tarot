# Agent Checklist: Bedrock RAG Changes

Use this checklist before modifying the Bedrock RAG API, corpus, or infra
integration.

## First Read

Read these files before editing:

- `docs/bedrock_rag_api_integration.md`
- `docs/bedrock_corpus_operations.md`
- `.agents/bedrock-rag-api-reference.md`
- `apps/api/README.md`
- `apps/infra/README.md`

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

When changing corpus shape:

- Edit `apps/api/src/corpus/normalize-corpus.ts` and
  `apps/api/src/corpus/types.ts`.
- Update `apps/api/src/corpus/normalize-corpus.test.ts`.
- Run normalization and inspect generated JSONL.
- Update human and agent docs if generated record semantics change.

When changing infra:

- Edit `apps/infra/lib/bedrock-rag-stack.ts` or `apps/infra/lib/config.ts`.
- Update `apps/infra/test/bedrock-rag-stack.test.ts`.
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
