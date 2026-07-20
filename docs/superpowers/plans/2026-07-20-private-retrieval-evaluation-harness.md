# Private Retrieval-Evaluation Harness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a development-only authenticated evaluation endpoint backed by the exact normal reading pipeline, plus a private interactive CLI that records bounded runtime evidence and human ratings without changing normal reading responses or persistence.

**Architecture:** A shared reading executor composes the request and invokes the existing explicit retrieval-and-Converse generator once, returning the normal reading and an internal trace. `POST /readings` maps and persists only the existing response. Development-only `POST /reading-evaluations` serializes the trace without persisting the reading. The private corpus repository owns saved cases, interactive feedback, validation, and create-only run records.

**Tech Stack:** TypeScript 6, Node.js 22, Express 5, Vitest 3, AWS SDK v3, AWS CDK v2, Amazon Bedrock Knowledge Bases and Converse, Cognito JWT authentication, Yarn 4.15.0.

## Global Constraints

- Follow `docs/superpowers/specs/2026-07-20-private-retrieval-evaluation-harness-design.md` exactly.
- Start from the merged explicit retrieval-and-Converse implementation and treat the current public and private repository checkouts as authoritative. Reinspect files before editing; do not undo later optimization refactors in `simple-tarot-corpus`.
- Keep proprietary corpus content, compiler implementation, relationship rules, real private fixtures, generated artifacts, and evaluation records out of the public repository.
- Reuse one composition, retrieval, evidence, prompt, and Converse execution. The evaluation feature must add no second Bedrock call.
- Preserve the exact public `ReadingResponse` and all current successful/failed reading-history behavior for `POST /readings`.
- The evaluation route performs no successful-reading save, failed-attempt save, profile mutation, corpus mutation, or content-bearing S3/application log write.
- Expose evaluation mode only when `EVALUATION_RUNTIME_MODE=enabled`; require Cognito auth, Bedrock mode, and composer mode at configuration startup. Disabled and local modes do not mount the route and return 404.
- Return only the resolved `ComposedReadingContext` for that reading, never the complete composer bundle.
- Return candidate text capped at 2,000 characters per result and the exact evidence text admitted under the existing 8,000-character total limit. Preserve all five bounded candidates for feedback even when later candidates contribute no prompt evidence.
- Return the exact system and user prompts sent to Converse. Never write those prompts, retrieved text, resolved context, generated output, tokens, or credentials to API logs.
- Normalize an optional document ID only from the terminal `.txt` filename of a supported Bedrock S3 location. Never return the bucket name, key prefix, URI, or raw metadata.
- Store development API URL and Cognito access token in private process environment only. Never print or persist the token.
- The harness evaluates the active development corpus only. It cannot publish, ingest, activate, select, or roll back a corpus release.
- Add no dashboard, mobile UI, reranker, score threshold, fine-tuning, recommendation engine, structured model output, new AWS resource, or new IAM permission.
- Prefer small pure functions and extract shared behavior only where the normal and evaluation paths genuinely use it.
- Use TDD within every checkpoint and observe each focused test fail for the intended missing behavior before implementation.
- Preserve unrelated user changes in both repositories.
- After automated verification, leave every implementation checkpoint uncommitted. The user manually validates and commits its files, then confirms the commit and explicitly authorizes continuation.
- Public and private repository changes are separate user-owned commits.

---

## File and Interface Map

### Public repository — create

- `apps/api/src/evaluations/contracts.ts`
- `apps/api/src/evaluations/constants.ts`
- `apps/api/src/readings/reading-executor.ts` and `.test.ts`
- `apps/api/src/readings/runtime.ts` and `.test.ts`
- `apps/api/src/routes/reading-evaluations.ts` and `.test.ts`
- `apps/api/src/server.test.ts`

### Public repository — modify

- `apps/api/src/bedrock/explicit-rag-types.ts`
- `apps/api/src/bedrock/knowledge-base-retriever.ts` and `.test.ts`
- `apps/api/src/bedrock/retrieval-evidence.ts` and `.test.ts`
- `apps/api/src/bedrock/converse-client.ts` and `.test.ts`
- `apps/api/src/bedrock/explicit-rag-generator.ts` and `.test.ts`
- `apps/api/src/routes/readings.ts` and `.test.ts`
- `apps/api/src/config.ts` and `.test.ts`
- `apps/api/src/server.ts`
- `apps/infra/lib/api-stack.ts`
- `apps/infra/test/api-stack.test.ts`
- `apps/infra/test/simple-tarot-stage.test.ts`

### Private repository — create

- `src/evaluation/contracts.ts` and `.test.ts`
- `src/evaluation/constants.ts`
- `src/evaluation/evaluation-arguments.ts` and `.test.ts`
- `src/evaluation/case-loader.ts` and `.test.ts`
- `src/evaluation/api-client.ts` and `.test.ts`
- `src/evaluation/feedback.ts` and `.test.ts`
- `src/evaluation/run-record.ts` and `.test.ts`
- `scripts/run-evaluation.ts`
- `evaluations/cases/general-single-card.json`
- `evaluations/runs/.gitkeep`

### Private repository — modify

- `package.json`
- `.env.example`

### Documentation — modify

- Public `README.md`
- Public `apps/api/README.md`
- Public `apps/infra/README.md`
- Public `docs/bedrock_rag_api_integration.md`
- Public `.agents/bedrock-rag-api-reference.md`
- Public `.agents/bedrock-rag-change-checklist.md`
- Private `README.md`
- Private `docs/artifact-contract.md` only if it currently describes evaluation or runtime ownership; otherwise leave it unchanged and state why in checkpoint evidence.

---

# Checkpoint 1 — Shared Reading Execution and Internal Trace

## Task 1: Extend retrieval evidence without changing its prompt chunks

**Files:**
- Modify: `apps/api/src/bedrock/explicit-rag-types.ts`
- Modify: `apps/api/src/bedrock/knowledge-base-retriever.ts`
- Modify: `apps/api/src/bedrock/knowledge-base-retriever.test.ts`
- Modify: `apps/api/src/bedrock/retrieval-evidence.ts`
- Modify: `apps/api/src/bedrock/retrieval-evidence.test.ts`
- Create: `apps/api/src/evaluations/contracts.ts`
- Create: `apps/api/src/evaluations/constants.ts`

**Interfaces:**

```ts
export type RetrievedTextResult = {
    documentId?: string;
    score?: number;
    text?: string;
};

export type RetrievalEvaluationResult = {
    rank: number;
    score?: number;
    documentId?: string;
    candidateText: string;
    candidateCharacterCount: number;
    evidenceText: string;
    evidenceCharacterCount: number;
    includedInPrompt: boolean;
    truncatedByResultLimit: boolean;
    truncatedByTotalLimit: boolean;
};
```

- [ ] **Step 1: Write failing retriever mapping tests**

Cover ranked text and score preservation, S3 `.txt` terminal-name normalization, and omission for unsupported/malformed locations. Assert no bucket, prefix, URI, metadata, or raw location survives.

- [ ] **Step 2: Observe red**

```sh
yarn workspace api test --run src/bedrock/knowledge-base-retriever.test.ts
```

Expected: FAIL because results do not expose score or normalized document ID.

- [ ] **Step 3: Implement the smallest pure location mapper and retrieval mapping**

Keep the mapper private to the retriever unless a second caller genuinely appears. Preserve current
safe aggregate logging. Own reusable evaluation route, schema-version, and mode strings in
`evaluations/constants.ts`.

- [ ] **Step 4: Write failing evidence trace tests**

Assert rank preservation; trimming; empty-result handling; 2,000-character candidate caps; exact 8,000-character evidence admission; partial final evidence; candidates excluded only by the total limit; and both truncation flags. Assert `chunks` remains exactly the non-empty `evidenceText` list used by the existing prompt builder.

- [ ] **Step 5: Observe red, implement, and observe green**

```sh
yarn workspace api test --run src/bedrock/retrieval-evidence.test.ts
```

Expected: first FAIL on absent detail, then PASS with unchanged prompt chunk ordering.

## Task 2: Return prompt and generation metrics from the explicit pipeline

**Files:**
- Modify: `apps/api/src/bedrock/explicit-rag-types.ts`
- Modify: `apps/api/src/bedrock/converse-client.ts`
- Modify: `apps/api/src/bedrock/converse-client.test.ts`
- Modify: `apps/api/src/bedrock/explicit-rag-generator.ts`
- Modify: `apps/api/src/bedrock/explicit-rag-generator.test.ts`
- Modify: `apps/api/src/evaluations/contracts.ts`

**Interfaces:**

```ts
export type ExplicitRagExecution = {
    generated: GeneratedReading;
    trace: {
        retrieval: RetrievalEvaluationTrace;
        prompt: GenerationPrompt;
        generation: GenerationEvaluationTrace;
    };
};
```

- [ ] **Step 1: Write failing Converse tests for returned safe metrics**

Require the same generated text plus configured model identity, stop reason, optional input/output token counts, output character count, and elapsed duration. Inject a monotonic clock for deterministic timing. Preserve all existing safe error and logging assertions.

- [ ] **Step 2: Observe red, implement, and observe green**

```sh
yarn workspace api test --run src/bedrock/converse-client.test.ts
```

- [ ] **Step 3: Write failing orchestrator trace tests**

Assert one retrieval and one Converse call; plain active-filter descriptor; requested/returned/usable counts; bounded result details; exact query; exact system/user prompt equality with the object passed to Converse; generation metrics; zero-result generation; and no Converse call after retrieval failure.

- [ ] **Step 4: Observe red, implement, and observe green**

```sh
yarn workspace api test --run src/bedrock/explicit-rag-generator.test.ts
```

The orchestrator returns `ExplicitRagExecution`; it does not serialize or log the trace.

## Task 3: Extract one shared reading executor

**Files:**
- Create: `apps/api/src/readings/reading-executor.ts`
- Create: `apps/api/src/readings/reading-executor.test.ts`
- Create: `apps/api/src/readings/runtime.ts`
- Create: `apps/api/src/readings/runtime.test.ts`
- Modify: `apps/api/src/routes/readings.ts`
- Modify: `apps/api/src/routes/readings.test.ts`

**Interfaces:**

```ts
export type ReadingExecution = {
    composerMetadata: ComposerResponseMetadata;
    context?: ComposedReadingContext;
    generated: GeneratedReading;
    reading: ReadingResponse;
    trace?: ExplicitRagEvaluationTrace;
};

export type ReadingExecutor = {
    execute(request: ReadingRequest, requestId?: string): Promise<ReadingExecution>;
};
```

- [ ] **Step 1: Write failing executor tests**

Cover disabled/local execution, enabled composition before generation, exact composer metadata, fail-closed missing enabled dependencies, response mapping, request ID forwarding, and internal trace preservation.

- [ ] **Step 2: Observe red, implement the focused executor, and observe green**

```sh
yarn workspace api test --run src/readings/reading-executor.test.ts
```

- [ ] **Step 3: Write failing runtime factory tests**

Assert the factory constructs local dependencies without AWS clients and constructs one shared composer/retriever/Converse/executor graph in Bedrock mode. Keep storage and API-log sinks outside the executor.

- [ ] **Step 4: Move current default dependency construction into `readings/runtime.ts`**

Remove module-load `getApiConfig()` and singleton dependency creation from `routes/readings.ts`. Keep route creation dependency-injected so tests and the evaluation route can reuse the same executor instance.

- [ ] **Step 5: Refactor normal-route tests before production code**

Update tests to provide a `ReadingExecutor`. Preserve assertions for validation, successful persistence, failed-attempt persistence, aggregate API logging, authenticated history, and unchanged response bodies. Add an assertion that a returned trace is not serialized or persisted.

- [ ] **Step 6: Implement the route refactor and run the checkpoint suite**

```sh
yarn workspace api test --run \
  src/bedrock/knowledge-base-retriever.test.ts \
  src/bedrock/retrieval-evidence.test.ts \
  src/bedrock/converse-client.test.ts \
  src/bedrock/explicit-rag-generator.test.ts \
  src/readings/reading-executor.test.ts \
  src/readings/runtime.test.ts \
  src/routes/readings.test.ts
yarn workspace api build-types
git diff --check
```

Expected: PASS. A normal reading still performs one composition, one retrieval, and one Converse call and returns the pre-existing response contract.

## Checkpoint 1 manual verification and stop

- [ ] Review the public diff and confirm it contains only internal trace capture and shared execution refactoring.
- [ ] Run the API locally in local mode and confirm `POST /readings` still returns the normal placeholder response.
- [ ] Confirm no evaluation route or infrastructure setting exists yet.
- [ ] Leave all checkpoint files uncommitted. Stop and ask the user to validate and commit them, then wait for commit confirmation and authorization before Checkpoint 2.

---

# Checkpoint 2 — Development-Only Evaluation Route and Infrastructure Gate

## Task 1: Add strict evaluation configuration

**Files:**
- Modify: `apps/api/src/config.ts`
- Modify: `apps/api/src/config.test.ts`

**Interfaces:**

```ts
export type EvaluationRuntimeConfig = { mode: 'disabled' } | { mode: 'enabled' };
```

- [ ] **Step 1: Write failing configuration tests**

Test disabled-by-default, explicit enabled only with Cognito auth + Bedrock + composer, rejection of unknown mode, and startup rejection when any prerequisite is absent.

- [ ] **Step 2: Observe red, implement, and observe green**

```sh
yarn workspace api test --run src/config.test.ts
```

## Task 2: Add the non-persisting authenticated route

**Files:**
- Create: `apps/api/src/routes/reading-evaluations.ts`
- Create: `apps/api/src/routes/reading-evaluations.test.ts`
- Create: `apps/api/src/server.test.ts`
- Modify: `apps/api/src/server.ts`
- Modify: `apps/api/src/readings/runtime.ts`

- [ ] **Step 1: Write failing route tests**

Cover valid response schema, exact request ID/corpus/version/time, normal reading payload, resolved context, retrieval trace, full prompt, generation trace, and existing safe 400/429/503 behavior. Inject spies that prove no reading-history or profile dependency is accepted or called and that logs contain only route/status/request/timing/count metadata.

- [ ] **Step 2: Observe red, implement the route, and observe green**

```sh
yarn workspace api test --run src/routes/reading-evaluations.test.ts
```

- [ ] **Step 3: Write server mounting tests**

Assert the route is absent in disabled/local configuration, mounted behind the same Cognito middleware when enabled, rejects missing/invalid auth, and reuses the same runtime executor instance as `POST /readings`.

- [ ] **Step 4: Refactor `createApiServer` to build and inject one runtime graph**

Keep health and avatar behavior unchanged. Do not add an operator role or separate auth system.

## Task 3: Enable development only in CDK

**Files:**
- Modify: `apps/infra/lib/api-stack.ts`
- Modify: `apps/infra/test/api-stack.test.ts`
- Modify: `apps/infra/test/simple-tarot-stage.test.ts`

- [ ] **Step 1: Write failing CDK assertions**

Require `EVALUATION_RUNTIME_MODE=enabled` in development alone. Also configure the existing
development Cognito application mode with the synthesized issuer and client ID so the API startup
prerequisite and local middleware path are explicit. Require production to omit the evaluation
variable, not merely set it disabled. Snapshot resource/IAM counts or compare synthesized
statements so no resource or permission is added.

- [ ] **Step 2: Observe red, make the conditional environment-only change, and observe green**

```sh
yarn workspace infra test --runInBand test/api-stack.test.ts test/simple-tarot-stage.test.ts
```

- [ ] **Step 3: Run the full public validation gate**

```sh
yarn workspace api test
yarn workspace api build-types
yarn workspace infra test --runInBand
yarn workspace infra build-types
git diff --check
```

Expected: PASS; development has the evaluation switch and existing Cognito identities, production
has no evaluation surface, and IAM/resources are unchanged.

## Checkpoint 2 manual verification and stop

- [ ] Start the API locally with evaluation disabled and verify `POST /reading-evaluations` returns 404.
- [ ] Inspect route tests showing enabled calls are authenticated and never persist.
- [ ] Inspect the development diff and production synthesis assertions and verify there is no new
AWS resource or IAM action.
- [ ] Leave all checkpoint files uncommitted. Stop for user validation and commit; do not begin private harness work until the user confirms the commit and authorizes Checkpoint 3.

---

# Checkpoint 3 — Private Interactive Harness and Create-Only Records

All paths in this checkpoint are relative to `/Users/ava/code/simple-tarot-corpus`. Reinspect current private code first and adapt naming to existing optimized conventions without moving proprietary implementation into public Git.

## Task 1: Validate saved cases and API responses

**Files:**
- Create: `src/evaluation/contracts.ts`
- Create: `src/evaluation/contracts.test.ts`
- Create: `src/evaluation/constants.ts`
- Create: `src/evaluation/evaluation-arguments.ts`
- Create: `src/evaluation/evaluation-arguments.test.ts`
- Create: `src/evaluation/case-loader.ts`
- Create: `src/evaluation/case-loader.test.ts`
- Create: `evaluations/cases/general-single-card.json`

- [ ] **Step 1: Write failing schema tests**

Validate the approved `EvaluationCase`, public reading request, full `ReadingEvaluationResponse`, nested trace limits, slug/filename identity, and rejection of unknown or credential-shaped fields.

- [ ] **Step 2: Observe red, implement pure parsers, and observe green**

```sh
yarn vitest run --config vitest.config.mjs \
  src/evaluation/contracts.test.ts \
  src/evaluation/evaluation-arguments.test.ts \
  src/evaluation/case-loader.test.ts
```

Use a small general reading case with public transport inputs only. Do not copy canonical meanings or rules into it.
Own `--case`, `/reading-evaluations`, the schema version, relevance choices,
`SIMPLE_TAROT_DEVELOPMENT_API_URL`, and `SIMPLE_TAROT_COGNITO_ACCESS_TOKEN` in the focused constants
module. Test missing, duplicate, and unknown arguments using the existing activation argument
convention.

## Task 2: Add the token-safe API client and interactive feedback

**Files:**
- Create: `src/evaluation/api-client.ts`
- Create: `src/evaluation/api-client.test.ts`
- Create: `src/evaluation/feedback.ts`
- Create: `src/evaluation/feedback.test.ts`

- [ ] **Step 1: Write failing API client tests**

Inject `fetch`. Assert one POST to `/reading-evaluations`, JSON request body, Bearer token only in the Authorization header, safe failure reporting, validated success parsing, and proof that returned/debug values never contain the token.

- [ ] **Step 2: Observe red, implement, and observe green**

```sh
yarn vitest run --config vitest.config.mjs src/evaluation/api-client.test.ts
```

- [ ] **Step 3: Write failing feedback tests**

Inject line input/output adapters. Require exactly one `relevant | irrelevant | unsure` answer for every returned rank, integer 1–5 values for faithfulness/specificity/coherence/richness, and an optional trimmed note. Test retry of invalid interactive values and cancellation without a result.

- [ ] **Step 4: Implement feedback collection and its bounded display renderer**

Display reading, resolved context, ranked candidates/scores, admitted evidence, truncation state, and complete system/user prompts. Never display the access token or environment object.

## Task 3: Write validated records once and expose the command

**Files:**
- Create: `src/evaluation/run-record.ts`
- Create: `src/evaluation/run-record.test.ts`
- Create: `scripts/run-evaluation.ts`
- Create: `evaluations/runs/.gitkeep`
- Modify: `package.json`
- Modify: `.env.example`

- [ ] **Step 1: Write failing record tests**

Require every returned rank exactly once; document-ID/rank agreement; rating bounds; matching case/corpus identities; filename-safe UTC path `evaluations/runs/<case>/<corpus>/<timestamp>.json`; credential-field rejection; deterministic pretty JSON; parent directory creation; and exclusive create semantics that reject collisions.

- [ ] **Step 2: Observe red, implement, and observe green**

```sh
yarn vitest run --config vitest.config.mjs src/evaluation/run-record.test.ts
```

- [ ] **Step 3: Add the thin command**

Add `evaluation:run` and parse only `--case <id>`. Read named development API URL and access-token variables from the environment, validate them, load the case, invoke the client, collect feedback, validate the complete run, and write once. A network failure, invalid response, cancellation, or invalid feedback writes no file.

- [ ] **Step 4: Run the complete private gate**

```sh
yarn test
yarn typecheck
git diff --check
```

Expected: PASS. No test output, fixture, serialized record, or error includes a token.

## Checkpoint 3 manual verification and stop

- [ ] Run `yarn evaluation:run --case general-single-card` with a deliberately unreachable local URL and dummy token; confirm the safe failure creates no run file and does not print the token.
- [ ] Review the example case and confirm it contains only public reading inputs.
- [ ] Review the private diff and confirm no compiler, rules, activation, or corpus artifacts were changed.
- [ ] Leave private files uncommitted. Stop for user validation and a private-repository commit; wait for confirmation and authorization before documentation/deployment preparation.

---

# Checkpoint 4 — Durable Documentation and Predeployment Review

## Task 1: Update public current-state guidance

**Files:**
- Modify: `README.md`
- Modify: `apps/api/README.md`
- Modify: `apps/infra/README.md`
- Modify: `docs/bedrock_rag_api_integration.md`
- Modify: `.agents/bedrock-rag-api-reference.md`
- Modify: `.agents/bedrock-rag-change-checklist.md`

- [ ] Document the shared execution boundary, unchanged normal response/persistence, authenticated development-only route, exact exposed trace, aggregate-only logging, environment prerequisite, and rollback switch.
- [ ] Keep operational examples free of real tokens, API IDs, corpus content, and private record bodies.
- [ ] Mark the design and this plan as historical planning records once implementation is current, and link durable documentation from the root index.

## Task 2: Update private harness operations

**Files:**
- Modify: private `README.md`
- Inspect and conditionally modify: private `docs/artifact-contract.md`

- [ ] Document required environment names, `yarn evaluation:run --case <id>`, case/run ownership, feedback scales, active-corpus-only behavior, token safety, create-only records, and manual Git comparison.
- [ ] Do not imply the harness can activate, publish, ingest, or select a release.
- [ ] Change the artifact contract only if necessary to remove a stale evaluation/runtime statement; the harness does not alter compiler artifact schemas.

## Task 3: Verify documentation and review the development deployment diff

- [ ] Run repository documentation link and stale-reference checks required by the Simple Tarot documentation skill.
- [ ] Run final local suites in both repositories:

```sh
cd /Users/ava/code/simple-tarot
yarn workspace api test
yarn workspace api build-types
yarn workspace infra test --runInBand
yarn workspace infra build-types

cd /Users/ava/code/simple-tarot-corpus
yarn test
yarn typecheck
```

- [ ] Synthesize and inspect the development API diff before any deployment; rely on the passing
production synthesis tests for the production-absence contract:

```sh
cd /Users/ava/code/simple-tarot
yarn workspace infra cdk diff SimpleTarotApi-dev -c environment=dev
```

Expected: development shows the Lambda code asset, evaluation environment value, and existing
Cognito issuer/client configuration needed by application authentication; no IAM, database,
corpus, Knowledge Base, ingestion, or new-resource change. Production absence is proven by the
production synthesis tests because this checkout does not keep a local `.env.prod`.

- [ ] Run `git diff --check` and inspect `git status --short` separately in both repositories.

## Checkpoint 4 manual verification and stop

- [ ] User reviews and commits public documentation separately from private documentation.
- [ ] User confirms both commits and reviews the CDK diff.
- [ ] Stop and request explicit authorization to deploy the development API. Do not deploy production or mutate corpus resources.

---

# Checkpoint 5 — Authorized Development Deployment and End-to-End Verification

This checkpoint begins only after the user explicitly authorizes the reviewed development deployment.

## Task 1: Deploy the development API only

- [ ] Re-run the development CDK diff and compare it with the approved diff.
- [ ] Deploy only the exact development API stack using the repository's established authenticated AWS profile and command.
- [ ] Record deployment outputs needed for testing in temporary local files or shell variables only; do not commit identifiers or credentials.

## Task 2: Run the private harness against development

- [ ] Obtain a fresh Cognito token using the established authenticated process; never paste it into source, logs, or a run record.
- [ ] Run one saved case:

```sh
cd /Users/ava/code/simple-tarot-corpus
yarn evaluation:run --case general-single-card
```

- [ ] Confirm the response corpus version matches the active development pointer.
- [ ] Inspect ranked candidates, exact admitted evidence, resolved reading context, full prompt, generation metrics, and generated reading; complete all feedback and ratings.
- [ ] Inspect the new private record path and validate that it contains no token, API URL, bucket/key URI, or credential-shaped field.

## Task 3: Verify non-mutation and regression behavior

- [ ] Confirm the evaluation reading and any evaluation failure do not appear in DynamoDB reading history or user-profile state.
- [ ] Inspect CloudWatch/S3 API logging for the request and confirm only aggregate fields exist; no prompt, evidence, context, output, token, or record content is logged.
- [ ] Run a normal mobile reading and confirm its response and saved-history behavior remain unchanged.
- [ ] Confirm production, active corpus state, Knowledge Base, data source, and ingestion jobs were untouched.
- [ ] Run the relevant deployed API smoke checks for 401, safe 400, and disabled/unknown routes without recording secrets.

## Task 4: Capture only durable verification status

- [ ] If durable docs need live-verification status or corrected commands, update only the affected public/private guidance and rerun link/stale-reference checks.
- [ ] Leave any generated evaluation run and documentation correction uncommitted for the user to inspect.

## Checkpoint 5 manual verification and stop

- [ ] User validates the live evaluation output, private run record, normal mobile regression, non-persistence evidence, and safe logs.
- [ ] User commits the private run and any approved documentation corrections in their owning repositories.
- [ ] After commit confirmation, use superpowers:requesting-code-review and superpowers:finishing-a-development-branch to prepare the public and private branches for review. Do not merge, push, or create pull requests unless the user asks.

---

## Final Success Gate

- [ ] A private saved case completes one authenticated call against the active development runtime.
- [ ] Normal and evaluation routes share exact composition, retrieval, evidence, prompt, and Converse execution.
- [ ] Normal responses and history persistence are unchanged.
- [ ] Evaluation responses contain only reading-specific resolved context, bounded retrieval detail, exact prompts, generated reading, and safe metrics.
- [ ] Development alone exposes the authenticated route; production and local modes return 404.
- [ ] Evaluation calls mutate no reading, profile, corpus, ingestion, or infrastructure state.
- [ ] Completed private records are validated, token-free, create-only, human-rated, and suitable for Git comparison.
- [ ] Public and private durable documentation describe the implemented architecture without stale RetrieveAndGenerate, opaque-evidence, or API-persistence guidance.
