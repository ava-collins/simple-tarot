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

Corpus ownership contract:

- Corpus sources, transformation code, relationship rules, real fixtures, and generated artifacts
  stay outside this public repository.
- Private operations own release publication, development activation, ingestion, and rollback.
- Public runtime and infrastructure changes must not reproduce private corpus behavior.
- Development runtime accepts only the documented opaque composer consumer projection; do not add
  real artifacts or infer new behavior from private contents.

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

- Edit `apps/api/src/composer/prompt-builder.ts` for explicit Bedrock generation behavior.
- Edit `apps/api/src/readings/local-generated-reading.ts` only for offline placeholder output.
- Update the matching focused test.
- Keep card order, position, and orientation explicit in the prompt.
- Keep retrieved themes after authoritative deterministic context, escaped as untrusted data, and
  absent from responses, persistence, logs, and safe errors.

When changing composer runtime behavior:

- Read `docs/deterministic-composer-runtime.md` and
  `docs/private-corpus-artifact-boundary.md` first.
- Keep S3 access bounded to the active pointer, release manifests, and composer bundles.
- Preserve zero-based sequential spread-position order compatibility.
- Preserve per-request pointer reads, immutable checksum/schema validation, one-entry cache, and
  fail-closed behavior.
- Keep responses, persistence, errors, and logs aggregate-only; never add composed content.

When changing Bedrock runtime behavior:

- Edit the smallest focused unit in `apps/api/src/bedrock/`: query builder, retrieval filter,
  Knowledge Base retriever, evidence builder, explicit-RAG orchestrator, Converse client, or
  `apps/api/src/config.ts`.
- Update the colocated focused test or `apps/api/src/config.test.ts`.
- Preserve one reading-level `Retrieve`, five results by default, no reranker, 2,000 characters per
  result, 8,000 total evidence characters, and one Converse call unless an approved design changes
  those contracts.
- Preserve zero-result generation from deterministic context and retrieval-failure prevention of
  Converse.
- Preserve inference profile precedence unless intentionally changing API env
  semantics.
- The deployed API stack sets `BEDROCK_RUNTIME_MODE=bedrock` unconditionally;
  there is no deployed local-mode fallback. Local mode only applies to
  offline API development (`yarn api:dev` without Bedrock env vars).

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

- Make the source, transformation, rule, and artifact changes through the private corpus workflow.
- Do not copy private implementation, paths, real fixtures, or generated output into this repo.
- Coordinate any public ingestion or compatibility change through an approved artifact contract.
- Update human and agent docs if the public AWS or runtime handoff changes.

When changing infra:

- Edit the relevant stack in `apps/infra/lib/*`:
  - Bedrock resources: `bedrock-rag-stack.ts`
  - user-data table or API log bucket: `user-data-stack.ts`
  - HTTP API/Lambda/Cognito authorizer/runtime env: `api-stack.ts`
  - config naming/defaults: `config.ts`
- Update the matching `apps/infra/test/*.test.ts`.
- Keep CloudFormation outputs stable unless coordinating an API/deployment
  handoff update.
- If a `bedrock-rag-stack.ts` resource (KB, index, data source, inference
  profile) that `api-stack.ts` consumes gets replaced (new physical
  ID/ARN), verify `ApiStack` actually picked up the new value after
  deploying — `ApiStack` uses `ReferenceStrength.STRONG` for exactly this
  reason, but always confirm with `aws cloudformation detect-stack-drift`
  or a direct `aws lambda get-function-configuration` /
  `aws iam get-role-policy` check rather than assuming.

## Activation And Sync Reality Check

The public repository does not contain corpus generation, publication, activation, or Knowledge
Base ingestion scripts. Development infrastructure owns the stable `corpus/active/` destination
and a `NONE`-chunked data source; the private workflow owns the controlled operations that populate
and ingest it. Production retains the legacy `corpus/` prefix and `FIXED_SIZE` chunking until a
separately reviewed migration.

## Known Follow-Up Candidates

- Consider additional Bedrock client lifecycle optimization only after measuring a need.
- Add reranking or structured model output only through a fresh approved design and implementation
  plan.
- Plan production migration separately if selective ingestion is promoted beyond development.

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
