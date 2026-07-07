# Bedrock RAG API MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first backend MVP for generative tarot readings using a new Express REST API, normalized corpus documents, and Amazon Bedrock Knowledge Bases.

**Architecture:** The API validates reading requests, builds a deterministic retrieval/generation prompt, calls Bedrock Knowledge Bases, and returns structured reading output with citations and evaluation metadata.

**Tech Stack:** Yarn 4 workspaces, TypeScript, Node.js, Express, Vitest or Jest for tests following local package conventions, AWS CDK in `apps/infra`, Amazon S3, Amazon Bedrock Knowledge Bases, Amazon Bedrock Agent Runtime `RetrieveAndGenerate`, and OpenSearch Serverless as the MVP vector store.

## Global Constraints

-   Do not integrate the mobile app or Storybook UI in this MVP pass.
-   Do use `assets/ignore/corpus-source.json` as the source for the Bedrock corpus.
-   Do keep the first pass simple and reviewable at each stage.
-   Do include commands at every stage so the user can validate before the next stage begins.
-   Do stop after each stage and ask the user to verify before continuing.
-   Do not commit real AWS account IDs, Cognito values, Bedrock identifiers, S3 bucket names, or local `.env` secrets.

---

## Stage 1: API Workspace Scaffold And REST Contract

**Purpose:** Create `apps/api` as a standalone TypeScript Express app with a stable REST contract before any Bedrock integration.

**Files:**

-   Create: `apps/api/package.json`
-   Create: `apps/api/tsconfig.json`
-   Create: `apps/api/vitest.config.mjs`
-   Create: `apps/api/src/index.ts`
-   Create: `apps/api/src/server.ts`
-   Create: `apps/api/src/config.ts`
-   Create: `apps/api/src/routes/health.ts`
-   Create: `apps/api/src/routes/readings.ts`
-   Create: `apps/api/src/readings/contracts.ts`
-   Create: `apps/api/src/readings/validation.ts`
-   Create: `apps/api/src/readings/validation.test.ts`
-   Modify: `package.json`

**Interfaces:**

-   Produces: `POST /readings`
-   Produces: `GET /health`
-   Produces: `ReadingRequest`, `ReadingResponse`, and validation helpers used by later stages.

**Implementation Checklist:**

-   [ ] Add the `api` workspace package with `build-types`, `dev`, `start`, and `test` scripts.
-   [ ] Add root scripts such as `api:build`, `api:dev`, `api:start`, and `api:test`.
-   [ ] Implement `GET /health` returning `{ "status": "ok" }`.
-   [ ] Define `POST /readings` request and response types.
-   [ ] Add validation for required spread/card fields without calling Bedrock yet.
-   [ ] Return a deterministic placeholder response from `POST /readings` so the route can be exercised end to end.
-   [ ] Add unit tests for valid and invalid reading request validation.

**Validation Commands:**

```bash
yarn workspace api test
yarn workspace api build-types
yarn api:build
```

Optional manual check:

```bash
yarn api:dev
curl -s http://localhost:4100/health
curl -s -X POST http://localhost:4100/readings \
  -H 'content-type: application/json' \
  -d '{"spread":"celtic_cross","items":[{"cardIndex":0,"cardName":"The Fool","position":"situation","reversed":false}],"question":"What should I understand right now?"}'
```

**User Verification Gate:** Stop after this stage. Ask the user to run the validation commands and confirm the scaffold, route contract, and validation behavior look right before continuing.

---

## Stage 2: Corpus Normalization Pipeline

**Purpose:** Convert `assets/ignore/corpus-source.json` from Firestore export shape into clean retrieval documents that Bedrock can ingest.

**Files:**

-   Create: `apps/api/src/corpus/firestore-export.ts`
-   Create: `apps/api/src/corpus/normalize-corpus.ts`
-   Create: `apps/api/src/corpus/normalize-corpus.test.ts`
-   Create: `apps/api/src/corpus/types.ts`
-   Create: `apps/api/scripts/normalize-corpus.ts`
-   Create: `apps/api/corpus/.gitkeep`
-   Modify: `apps/api/package.json`

**Interfaces:**

-   Consumes: `assets/ignore/corpus-source.json`
-   Produces: generated local corpus files under `apps/api/corpus/generated/`
-   Produces: normalized document metadata for `cardName`, `cardIndex`, `orientation`, `spread`, `position`, `keywords`, `sourceCollection`, and `sourcePath`.

**Implementation Checklist:**

-   [ ] Parse the Firestore export without mutating the source file.
-   [ ] Extract card descriptions, keywords, reversed keywords, and Celtic Cross position meanings.
-   [ ] Generate one retrieval document per card/orientation/position meaning where possible.
-   [ ] Generate card-level context documents for descriptions and keywords.
-   [ ] Write generated documents as JSON files or JSONL records under `apps/api/corpus/generated/`.
-   [ ] Add tests that verify representative records for upright, reversed, and card-level documents.
-   [ ] Add a script command such as `yarn workspace api corpus:normalize`.

**Validation Commands:**

```bash
yarn workspace api test
yarn workspace api corpus:normalize
find apps/api/corpus/generated -type f | sort | head
yarn workspace api build-types
```

**User Verification Gate:** Stop after this stage. Ask the user to inspect a few generated corpus records and confirm the document shape is useful for retrieval before continuing.

---

## Stage 3: Reading Prompt And Response Mapper

**Purpose:** Build the deterministic prompt assembly and structured response mapping locally before wiring AWS.

**Files:**

-   Create: `apps/api/src/readings/prompt-builder.ts`
-   Create: `apps/api/src/readings/prompt-builder.test.ts`
-   Create: `apps/api/src/readings/response-mapper.ts`
-   Create: `apps/api/src/readings/response-mapper.test.ts`
-   Modify: `apps/api/src/routes/readings.ts`
-   Modify: `apps/api/src/readings/contracts.ts`

**Interfaces:**

-   Consumes: validated `ReadingRequest`
-   Produces: a prompt/query string for Bedrock retrieval and generation.
-   Produces: a stable `ReadingResponse` shape independent of AWS SDK response details.

**Implementation Checklist:**

-   [ ] Build a prompt that includes spread, ordered cards, position names, reversal flags, and optional user question.
-   [ ] Instruct generation to ground claims in retrieved tarot context.
-   [ ] Instruct generation to preserve position-specific meanings and orientation-specific meanings.
-   [ ] Define the response shape with `summary`, `positions`, `citations`, and `metadata`.
-   [ ] Keep AWS-specific fields out of route handlers by mapping them through `response-mapper.ts`.
-   [ ] Add tests for prompt content and response mapping.

**Validation Commands:**

```bash
yarn workspace api test
yarn workspace api build-types
```

Optional manual check:

```bash
yarn api:dev
curl -s -X POST http://localhost:4100/readings \
  -H 'content-type: application/json' \
  -d '{"spread":"celtic_cross","items":[{"cardIndex":0,"cardName":"The Fool","position":"situation","reversed":false},{"cardIndex":1,"cardName":"The Magician","position":"challenge","reversed":true}],"question":"What energy should I pay attention to?"}'
```

**User Verification Gate:** Stop after this stage. Ask the user to review the generated prompt and response shape before continuing.

---

## Stage 4: Bedrock Infrastructure Definition

**Purpose:** Extend `apps/infra` with the AWS resources required for managed RAG.

**Files:**

-   Create: `apps/infra/lib/bedrock-rag-stack.ts`
-   Create: `apps/infra/test/bedrock-rag-stack.test.ts`
-   Modify: `apps/infra/lib/config.ts`
-   Modify: `apps/infra/bin/simple-tarot-infra.ts`
-   Modify: `apps/infra/.env.example`
-   Modify: `apps/infra/README.md`

**Interfaces:**

-   Produces: S3 corpus bucket.
-   Produces: Bedrock Knowledge Base identifiers through CloudFormation outputs.
-   Produces: IAM role/policy boundaries for ingestion and API runtime.
-   Produces: environment variable names consumed by `apps/api`.

**Implementation Checklist:**

-   [ ] Add config for Bedrock region, embedding model, generation model, and corpus bucket naming.
-   [ ] Add an S3 bucket for normalized corpus artifacts.
-   [ ] Add OpenSearch Serverless vector store resources for the Knowledge Base.
-   [ ] Add Bedrock Knowledge Base and S3 data source resources where CDK L1 constructs are available.
-   [ ] Add CloudFormation outputs for corpus bucket, Knowledge Base ID, data source ID, region, and generation model ID.
-   [ ] Add CDK assertion tests for resource presence and output names.
-   [ ] Document deployment and environment handoff in `apps/infra/README.md`.

**Validation Commands:**

```bash
yarn workspace infra test
yarn workspace infra build-types
yarn workspace infra cdk synth
```

**User Verification Gate:** Stop after this stage. Ask the user to review synthesized CloudFormation and confirm the AWS resource design before deploying or wiring runtime calls.

---

## Stage 5: Bedrock Runtime Client In API

**Purpose:** Wire `apps/api` to call Bedrock Knowledge Bases through a narrow client interface.

**Files:**

-   Create: `apps/api/src/bedrock/bedrock-client.ts`
-   Create: `apps/api/src/bedrock/bedrock-client.test.ts`
-   Create: `apps/api/src/bedrock/types.ts`
-   Modify: `apps/api/src/config.ts`
-   Modify: `apps/api/src/routes/readings.ts`
-   Modify: `apps/api/package.json`
-   Modify: `apps/api/README.md`

**Interfaces:**

-   Consumes: `BEDROCK_REGION`, `BEDROCK_KNOWLEDGE_BASE_ID`, `BEDROCK_MODEL_ARN` or model ID, and optional retrieval configuration.
-   Produces: a `generateReading(prompt, requestMetadata)` function.
-   Produces: `ReadingResponse` from actual Bedrock `RetrieveAndGenerate` output.

**Implementation Checklist:**

-   [ ] Add the AWS SDK packages required for Bedrock Agent Runtime.
-   [ ] Load and validate Bedrock runtime environment variables at startup.
-   [ ] Implement a Bedrock client wrapper with dependency injection for tests.
-   [ ] Call `RetrieveAndGenerate` using the prompt from Stage 3.
-   [ ] Map Bedrock output text and citations into the response contract.
-   [ ] Keep a local/mock mode available so tests do not require AWS credentials.
-   [ ] Add unit tests for runtime mapping and missing configuration behavior.

**Validation Commands:**

```bash
yarn workspace api test
yarn workspace api build-types
yarn api:build
```

Optional AWS-backed manual check after infra exists and env values are configured:

```bash
yarn api:dev
curl -s -X POST http://localhost:4100/readings \
  -H 'content-type: application/json' \
  -d '{"spread":"celtic_cross","items":[{"cardIndex":0,"cardName":"The Fool","position":"situation","reversed":false}],"question":"What should I understand right now?"}'
```

**User Verification Gate:** Stop after this stage. Ask the user to run local tests and, if AWS env is configured, run the manual reading request before continuing.

---

## Stage 6: Corpus Upload And Knowledge Base Sync Operations

**Purpose:** Add documented commands for moving normalized corpus artifacts into S3 and triggering a Knowledge Base sync.

**Files:**

-   Create: `apps/api/scripts/upload-corpus.ts`
-   Create: `apps/api/scripts/sync-knowledge-base.ts`
-   Create: `apps/api/src/corpus/upload-config.ts`
-   Create: `apps/api/src/corpus/upload-config.test.ts`
-   Modify: `apps/api/package.json`
-   Modify: `apps/api/README.md`

**Interfaces:**

-   Consumes: generated corpus files from Stage 2.
-   Consumes: `BEDROCK_CORPUS_BUCKET`, `BEDROCK_KNOWLEDGE_BASE_ID`, `BEDROCK_DATA_SOURCE_ID`, and `AWS_REGION`.
-   Produces: uploaded corpus objects in S3.
-   Produces: a started Bedrock ingestion job.

**Implementation Checklist:**

-   [ ] Add upload configuration validation.
-   [ ] Add a corpus upload script using AWS SDK S3 commands.
-   [ ] Add a Knowledge Base sync script using Bedrock Agent APIs.
-   [ ] Add dry-run logging so file/object mapping can be reviewed before upload.
-   [ ] Add tests for config validation and S3 object key generation.
-   [ ] Document the exact local operations sequence.

**Validation Commands:**

```bash
yarn workspace api test
yarn workspace api corpus:normalize
yarn workspace api corpus:upload --dry-run
yarn workspace api kb:sync --dry-run
yarn workspace api build-types
```

AWS-backed operation after user approval:

```bash
yarn workspace api corpus:upload
yarn workspace api kb:sync
```

**User Verification Gate:** Stop after this stage. Ask the user to approve the dry-run object list before uploading or syncing the real Knowledge Base.

---

## Stage 7: Evaluation Harness For Reading Accuracy

**Purpose:** Add repeatable checks for reading quality, grounding, and regression review.

**Files:**

-   Create: `apps/api/evaluation/golden-readings.json`
-   Create: `apps/api/src/evaluation/evaluate-reading.ts`
-   Create: `apps/api/src/evaluation/evaluate-reading.test.ts`
-   Create: `apps/api/scripts/evaluate-readings.ts`
-   Modify: `apps/api/package.json`
-   Modify: `apps/api/README.md`

**Interfaces:**

-   Consumes: fixed reading requests and expected evaluation traits.
-   Produces: local evaluation output with scores for card relevance, position relevance, orientation accuracy, citation presence, and response completeness.

**Implementation Checklist:**

-   [ ] Add a small golden dataset with at least three reading requests.
-   [ ] Score whether each response includes all requested cards and positions.
-   [ ] Score whether reversed cards are treated as reversed.
-   [ ] Score whether citations are present for generated readings.
-   [ ] Add a command such as `yarn workspace api eval:readings`.
-   [ ] Document how to compare evaluation output between prompt/model changes.

**Validation Commands:**

```bash
yarn workspace api test
yarn workspace api eval:readings --mock
yarn workspace api build-types
```

Optional AWS-backed evaluation after env values are configured:

```bash
yarn workspace api eval:readings
```

**User Verification Gate:** Stop after this stage. Ask the user to review evaluation scores and decide whether the MVP is accurate enough for mobile integration planning.

---

## Stage 8: MVP Documentation And Cutover Notes

**Files:**

-   Create: `apps/api/README.md`
-   Create: `docs/planning/bedrock_rag_api_mvp.md`
-   Modify: `docs/planning/index.md`
-   Modify: `README.md`

**Interfaces:**

-   Produces: developer setup docs.
-   Produces: API contract docs.
-   Produces: corpus operations docs.
-   Produces: evaluation docs.

**Implementation Checklist:**

-   [ ] Document local API setup and scripts.
-   [ ] Document required environment variables.
-   [ ] Document request and response examples for `POST /readings`.
-   [ ] Document corpus normalization, upload, and sync commands.
-   [ ] Document evaluation commands and interpretation.
-   [ ] Document out-of-scope mobile/UI integration and the later hook work.

**Validation Commands:**

```bash
yarn api:build
yarn workspace api test
yarn workspace infra test
yarn workspace infra build-types
yarn lint
```

**User Verification Gate:** Stop after this stage. Ask the user to review the docs and confirm the MVP architecture is ready for the next planning pass: mobile hooks and UI integration.

---

## Execution Rules

-   Execute only one stage at a time.
-   After each stage, summarize changed files, test results, and any open decisions.
-   Do not start the next stage until the user explicitly confirms the verification gate.
-   Prefer local unit tests and dry-run commands before AWS-backed operations.
-   Keep generated corpus output deterministic so diffs are reviewable.
-   Keep Bedrock and AWS SDK calls behind narrow interfaces so local tests do not require AWS credentials.
