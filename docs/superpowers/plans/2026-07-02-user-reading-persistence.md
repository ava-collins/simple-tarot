# User Reading Persistence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist authenticated mobile users and their generated reading history in AWS through the existing API, without exposing AWS datastore credentials to the mobile app.

**Architecture:** The mobile app continues to authenticate with Cognito and calls the REST API with a Cognito bearer token. For the MVP deployment, API Gateway + Lambda hosts the API; API Gateway should enforce Cognito JWT authentication where possible, while the Express API still normalizes the authenticated user context for local/test execution. The API derives the stable Cognito `sub` as the application user id, writes reading history and failed generation attempts to DynamoDB using its Lambda execution role, writes request/diagnostic metadata to an S3-backed API log source, and returns the current `ReadingResponse` contract for successful readings. Because AWS Bedrock model access is still pending AWS Support review, the full persistence/history flow must be exercisable with the existing local API generation mode and one or two deterministic test reading variants before real Bedrock responses are available.

**Tech Stack:** Expo React Native mobile app, Express REST API, AWS Cognito User Pools, API Gateway, Lambda, AWS CDK, DynamoDB, S3, AWS SDK for JavaScript v3, Vitest/Jest.

## Global Constraints

- Implement in small executable stages.
- At the end of each stage, stop and ask the user to validate.
- Provide commands for validation.
- Do not proceed to the next stage until the user confirms.
- Keep the design simple.
- Do not introduce elaborate queues/workflows/agents unless needed.
- Use existing repo patterns.
- Persist at minimum both `ReadingResponse` and `GeneratedReading`.
- Record the date/time of the reading.
- Persist the original user question when provided.
- Persist failed generation attempts for support and quality review.
- Do not persist API metadata such as source IP, route, method, duration, or user agent in DynamoDB; capture that data through the API log source.
- Store raw source IP in the S3 API log source.
- Do not show failed generation attempts in the user-facing mobile history screen.
- Support local/test-data execution of the full feature set while AWS Bedrock model access is pending review.
- Keep local generated reading variants simple and deterministic; one or two variations are enough for now.
- The mobile app must not receive direct datastore credentials.

---

## Datastore Recommendation

**Recommended for MVP: DynamoDB**

DynamoDB fits the current and near-future shape best: one authenticated user owns many readings, reads are likely "list my readings" and "get one reading", and the reading payload is naturally document-shaped JSON. It also avoids database servers, migrations, connection pooling, and VPC complexity while still leaving room to add account preferences, saved spreads, favorites, feedback, subscriptions, or usage records later.

Proposed single-table shape:

- Table: `simple-tarot-<env>-user-data`
- Primary key: `pk`, `sk`
- User profile item: `pk = USER#<cognitoSub>`, `sk = PROFILE`
- Reading item: `pk = USER#<cognitoSub>`, `sk = READING#<createdAtIso>#<readingId>`
- Optional GSI later: `readingId-index` with `readingId` as partition key only if admin/support lookup by reading id becomes necessary.

Recommended reading item fields:

- `entityType`: `reading`
- `userId`: Cognito `sub`
- `readingId`
- `createdAt`
- `updatedAt`
- `spread`
- `readingResponse`: full `ReadingResponse`
- `generatedReading`: full `GeneratedReading`
- `request`: sanitized `ReadingRequest`, including the spread/items and original user question when provided
- `question`: copied from `request.question` for efficient history display and auditing
- `generationMetadata`: mode, item count, model id, Bedrock request id/attempts/status if available, retrieval result count if available
- For local/test data, `generationMetadata.mode` remains `local` and `generatedReading.modelId` should use a stable local identifier such as `local-prompt-v1` or `local-test-variant-1`
- `schemaVersion`: start with `1`

Recommended failed attempt item fields:

- `entityType`: `readingAttempt`
- `status`: `failed`
- `userId`: Cognito `sub`
- `requestId`: API request id
- `createdAt`
- `updatedAt`
- `spread`
- `question`: copied from `request.question` when provided
- `request`: sanitized `ReadingRequest`
- `failure`: stable error code, sanitized error message, HTTP status code, and service name when available
- `generationMetadata`: mode, item count, model id when known
- `schemaVersion`: start with `1`

Data to avoid or minimize:

- Do not store access tokens, refresh tokens, id tokens, or raw authorization headers.
- Treat email, IP address, question text, and user agent as PII-adjacent. Store only if the product needs them; prefer Cognito `sub` over email as the durable user key.
- Store source IP, user agent, route, method, duration, and similar API metadata in the API log source rather than DynamoDB.

## API Logging Recommendation

Use an S3 bucket as the MVP API log source for request/diagnostic metadata that should not live in the user-data table. Keep the format structured JSON Lines or one JSON object per request under a date partition such as `api-logs/year=2026/month=07/day=02/<requestId>.json`.

Recommended log fields:

- `timestamp`
- `requestId`
- `method`
- `route`
- `statusCode`
- `durationMs`
- `sourceIp`: raw source IP
- `userAgent`
- `cognitoSub` when authenticated
- `readingId` or `attemptId` when applicable
- `errorCode` and sanitized `errorMessage` for failures
- `awsRequestId` from Lambda context when available
- `apiVersion` or git sha if available

Do not log authorization headers, tokens, cookies, or full raw request bodies. Because user questions may be sensitive, log only a `hasQuestion` boolean or a short hash in S3 unless a later audit workflow explicitly requires full prompt storage outside DynamoDB.

## Alternatives Considered

**Aurora Serverless/PostgreSQL**

Good if the product quickly needs relational querying, reporting, billing/account joins, or complex admin operations. It is heavier for this MVP because it introduces migrations, SQL schema design, connection management, and more deployment surface.

**S3 JSON objects**

Simple and cheap for append-only archives, but weak for user history queries, pagination, conditional writes, and account-centric access. Better later as an export/archive target than as the primary app datastore.

**Cognito user attributes only**

Appropriate for small profile flags, not reading history. It would mix auth identity with application data and hit size/query limitations quickly.

**AppSync/Amplify Data**

Useful for direct mobile sync/offline patterns, but it adds a new API style and client data layer. For this repo, the existing REST API should stay the trust boundary.

## Security Approach

The mobile app should authenticate users, not services. It sends `Authorization: Bearer <Cognito access token>` to the REST API over HTTPS.

The REST API should authenticate the user and perform all datastore reads/writes server-side:

- Validate Cognito JWT signature using the User Pool JWKS.
- Validate issuer, audience/client id, token use, expiration, and optionally scopes/groups.
- Derive `userId` from `sub`; never accept `userId` from the mobile request body for persistence.
- Use the API runtime's AWS IAM role to access DynamoDB with least-privilege permissions for the one table.
- Grant the mobile app no DynamoDB IAM permissions.
- Redact sensitive headers from logs and keep persisted DynamoDB records limited to reading, request, and sanitized failure data.

Deployment-specific path:

- Deploy the MVP REST API with API Gateway + Lambda.
- Prefer an API Gateway HTTP API Cognito JWT authorizer for protected routes.
- Keep a lightweight server-side user context contract in Express so local development and tests can inject/verify authenticated users consistently.
- Use the Lambda execution role for DynamoDB and S3 log writes with least-privilege permissions.

## Local/Test Generation Recommendation

Until AWS approves Bedrock model access, keep `BEDROCK_RUNTIME_MODE` unset or set to local mode and use deterministic generated reading fixtures to exercise the full feature set. This should validate authentication, request validation, successful reading persistence, failed-attempt persistence, S3 log writing, reading-history sorting, and mobile history display without calling Bedrock.

Recommended local variants:

- `local-test-variant-1`: successful generated reading with summary text, one or more positions, empty or fixture citations, and `modelId: "local-test-variant-1"`.
- `local-test-variant-2`: a second successful generated reading with different text/citations, selected by a simple deterministic input such as spread name or item count.
- Failed local path: a test-only trigger that produces a sanitized generation failure so failed-attempt persistence can be verified without Bedrock.

Keep these variants small and clearly marked as local/test data so they do not look like production model output.

## Stage 1: Infrastructure Decision, DynamoDB Table, and API Log Bucket

**Files:**

- Modify: `apps/infra/lib/config.ts`
- Create: `apps/infra/lib/user-data-stack.ts`
- Modify: `apps/infra/bin/simple-tarot-infra.ts`
- Create or modify tests: `apps/infra/test/user-data-stack.test.ts`

**Deliverable:** CDK synthesizes a DynamoDB table with environment-aware removal policy, encryption, point-in-time recovery for prod, and outputs the table name/ARN. The same stack also creates an S3 API log bucket with block public access, enforced SSL, server-side encryption, lifecycle rules, and outputs for the bucket name/ARN.

**Validation commands:**

```bash
yarn workspace infra test
yarn workspace infra build-types
yarn workspace infra cdk synth
```

**Stop for user validation:** Confirm the table design, S3 API log bucket design, environment names, and CDK output shape before API code is changed.

## Stage 2: API Gateway + Lambda Hosting Shape

**Files:**

- Modify: `apps/api/package.json`
- Modify: `apps/api/src/server.ts`
- Create or modify Lambda adapter entrypoint, final path to be confirmed from existing API packaging conventions.
- Modify: `apps/infra/lib/config.ts`
- Create: `apps/infra/lib/api-stack.ts`
- Modify: `apps/infra/bin/simple-tarot-infra.ts`
- Create tests: `apps/infra/test/api-stack.test.ts`

**Deliverable:** CDK can synthesize API Gateway + Lambda infrastructure for the existing Express API, including Lambda environment variables for the DynamoDB table, S3 log bucket, Bedrock configuration, and Cognito authorizer configuration. The Lambda execution role has least-privilege access to DynamoDB, S3 log writes, and existing Bedrock runtime needs.

**Validation commands:**

```bash
yarn api:build
yarn workspace infra test
yarn workspace infra build-types
yarn workspace infra cdk synth
```

**Stop for user validation:** Confirm the generated API Gateway/Lambda resources, environment variables, and IAM permissions before auth and persistence behavior is implemented.

## Stage 3: API Auth Boundary

**Files:**

- Modify: `apps/api/package.json`
- Modify: `apps/api/src/config.ts`
- Create: `apps/api/src/auth/cognito-jwt.ts`
- Create: `apps/api/src/auth/auth-context.ts`
- Modify: `apps/api/src/server.ts`
- Create tests: `apps/api/src/auth/cognito-jwt.test.ts`

**Deliverable:** The API can consume authenticated user claims from API Gateway/Lambda and can also validate Cognito bearer tokens directly for local/test execution. Protected reading and reading-history routes reject missing/invalid auth while preserving local/test ergonomics.

**Validation commands:**

```bash
yarn api:test
yarn api:build
```

**Stop for user validation:** Confirm the API accepts the mobile token shape already produced by Cognito and rejects missing/invalid tokens.

## Stage 4: Persistence Module

**Files:**

- Modify: `apps/api/package.json`
- Modify: `apps/api/src/config.ts`
- Create: `apps/api/src/readings/persistence/contracts.ts`
- Create: `apps/api/src/readings/persistence/reading-history-store.ts`
- Create: `apps/api/src/readings/persistence/dynamodb-reading-history-store.ts`
- Create tests: `apps/api/src/readings/persistence/reading-history-store.test.ts`

**Deliverable:** A small store interface can save and read reading history by authenticated user id. Unit tests verify key shape, serialized payloads, failure records, and DynamoDB command inputs without requiring a live AWS table.

**Validation commands:**

```bash
yarn api:test
yarn api:build
```

**Stop for user validation:** Confirm the persisted fields, PII choices, and read/list access patterns before routes are exposed.

## Stage 5: Local/Test Reading Generation Fixtures

**Files:**

- Modify: `apps/api/src/routes/readings.ts` if the local generator stays route-local for this stage.
- Prefer create: `apps/api/src/readings/local-generated-reading.ts` if the current route-local generator needs to stay small and testable.
- Create or modify tests: `apps/api/src/readings/local-generated-reading.test.ts`

**Deliverable:** The API has one or two deterministic local generated reading variants and one test-only local failure path. These fixtures exercise the same `GeneratedReading` and `ReadingResponse` persistence path that Bedrock will use later.

**Validation commands:**

```bash
yarn api:test
yarn api:build
```

**Stop for user validation:** Confirm the local/test reading outputs are sufficient to exercise the full feature set while Bedrock access is pending.

## Stage 6: S3 API Log Source

**Files:**

- Modify: `apps/api/src/config.ts`
- Create: `apps/api/src/logging/api-log-sink.ts`
- Create tests: `apps/api/src/logging/api-log-sink.test.ts`
- Modify: `apps/api/src/logger.ts` only if the existing logger should call the S3 sink directly.

**Deliverable:** The API can write sanitized structured request/diagnostic log events to the S3 API log bucket. DynamoDB reading-history records do not include source IP, route, method, duration, user agent, or other API metadata.

**Validation commands:**

```bash
yarn api:test
yarn api:build
```

**Stop for user validation:** Confirm S3 log fields and redaction behavior before reading routes write production data.

## Stage 7: API Routes for Save, Failure Capture, and History

**Files:**

- Modify: `apps/api/src/routes/readings.ts`
- Create or modify tests: `apps/api/src/routes/readings.test.ts`

**Deliverable:** `POST /readings` persists the authenticated user's `ReadingResponse`, `GeneratedReading`, original `question` when provided, and created timestamp after successful generation. Failed generation attempts are persisted with sanitized failure fields and the original request/question. Add `GET /readings` for newest-first user history that can surface successful readings by user question, excludes failed attempts from the user-facing response, and add `GET /readings/:readingId` if the mobile UI needs detail retrieval separately.

**Validation commands:**

```bash
yarn api:test
yarn api:build
```

Manual API validation after a deployed or local authenticated setup exists:

```bash
BEDROCK_RUNTIME_MODE=local yarn api:dev

curl -i -H "Authorization: Bearer <COGNITO_ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"spread":"three-card","items":[{"cardIndex":0,"cardName":"The Fool","position":"Past","reversed":false}]}' \
  http://localhost:4100/readings

curl -i -H "Authorization: Bearer <COGNITO_ACCESS_TOKEN>" \
  http://localhost:4100/readings
```

**Stop for user validation:** Confirm reading generation still works and history returns only the signed-in user's records.

## Stage 8: Mobile API Client and Reading History Screen

**Files:**

- Create: `apps/tarot/src/api/tarot-api.ts`
- Create: `apps/tarot/src/readings/use-reading-history.ts`
- Create or modify route/UI files for a reading-history screen.
- Create tests near the new API/readings modules.

**Deliverable:** Mobile requests include the Cognito access token, can request a reading, and can fetch the signed-in user's reading history. The visible history screen lists only the signed-in user's successful readings in descending chronological order and surfaces the original user question for each reading when present. Failed generation attempts remain API/admin-only for now.

**Validation commands:**

```bash
yarn workspace tarot test
yarn workspace tarot build-types
yarn ios
```

**Stop for user validation:** Confirm the app can sign in, generate a reading, restart, and see the saved reading history.

## Stage 9: Account Profile Persistence

**Files:**

- Extend the API persistence module from Stage 4.
- Extend protected API routes only if the mobile app needs account profile reads/writes now.
- Optionally create a profile item when the first reading is saved.

**Deliverable:** A minimal profile item exists for future account features without duplicating Cognito as the source of truth for credentials.

Suggested profile fields:

- `userId`
- `createdAt`
- `updatedAt`
- `firstSeenAt`
- `lastSeenAt`
- `lastReadingAt`
- `readingCount`
- `cognitoIssuer`
- Optional denormalized display fields: email or display name only if the app needs them outside Cognito.

**Validation commands:**

```bash
yarn api:test
yarn api:build
yarn workspace infra test
```

**Stop for user validation:** Confirm whether profile persistence should ship in MVP or wait until a concrete account feature needs it.

## Open Questions Before Implementation

Answered decisions:

- REST API hosting for the MVP: API Gateway + Lambda.
- Reading history should include the user's original `question`, when provided, to support auditing Bedrock reading accuracy.
- Raw source IP and API request metadata should not be persisted in DynamoDB. Capture API metadata through the S3 API log source instead.
- The mobile MVP should include a visible reading-history screen.
- The history screen should surface readings by user question and sort in descending chronological order.
- Failed generation attempts should be persisted for support and analytics.
- S3 API logs should store raw source IP.
- Failed attempts should not appear in the user-facing mobile history screen; they remain API/admin-only for now.
- AWS Bedrock model access is pending AWS Support review, so local API/test data must support exercising the full flow before real Bedrock readings are available.
- One or two deterministic local successful reading variants are enough for now.

## Self-Review

Spec coverage: The plan covers datastore options, recommends DynamoDB, persists `ReadingResponse`, `GeneratedReading`, original user question, successful readings, and failed attempts, records timestamps, uses Cognito auth with API Gateway + Lambda, keeps the API as the secure AWS datastore boundary, moves API metadata to an S3 log source instead of DynamoDB, includes a mobile history screen sorted descending by time, supports local/test data while Bedrock access is pending review, and splits work into validation stages.

Placeholder scan: No implementation placeholders are required for this high-level pass; open questions are explicit decisions for review before code.

Type consistency: Reading contracts match `apps/api/src/readings/contracts.ts`, with `ReadingResponse`, `GeneratedReading`, `ReadingRequest`, `ReadingCitation`, and the existing `metadata.mode` values.
