# Simple Tarot API

`apps/api` is the REST backend for the Bedrock RAG tarot reading MVP.

- [Endpoints](#endpoints)
- [Local Mode](#local-mode)
- [Bedrock Mode](#bedrock-mode)
- [Commands](#commands)

## Endpoints

- `GET /health`
- `POST /readings`
- `GET /readings`

`POST /readings` accepts a spread, ordered card items, reversed flags, and an
optional question. The route validates input, builds a deterministic retrieval
prompt, then either returns a local placeholder response or calls Bedrock
Knowledge Bases depending on runtime configuration.

Authenticated successful readings are persisted to DynamoDB with the full
`ReadingResponse`, generated reading text/citations, original request/question,
and created timestamp. Authenticated failed generation attempts are persisted
with sanitized failure fields and are excluded from user-facing history.

`GET /readings` returns the signed-in user's successful reading history newest
first.

The API also maintains a minimal user profile item when successful readings are
saved. See `docs/user_reading_persistence.md` for table keys, profile fields,
and AWS CLI inspection commands.

## Local Mode

Local mode is the default for generation and does not require Bedrock access:

```sh
cp apps/api/.env.example apps/api/.env
yarn api:dev
```

To exercise authenticated persistence locally, configure Cognito auth and the
user-data table env vars in `apps/api/.env`.

```sh
API_AUTH_MODE=cognito
COGNITO_ISSUER=<cognito-issuer-output>
COGNITO_CLIENT_ID=<cognito-user-pool-client-id-output>
USER_DATA_TABLE_NAME=<user-data-table-name-output>
API_LOG_BUCKET_NAME=<api-log-bucket-name-output>
```

## Bedrock Mode

Set these values to call Bedrock Agent Runtime `RetrieveAndGenerate`:

```sh
BEDROCK_RUNTIME_MODE=bedrock
BEDROCK_REGION=us-east-1
BEDROCK_KNOWLEDGE_BASE_ID=<cloudformation-output>
BEDROCK_MODEL_ID=
BEDROCK_INFERENCE_PROFILE_ID=global.anthropic.claude-sonnet-4-5-20250929-v1:0
BEDROCK_INFERENCE_PROFILE_ARN=
BEDROCK_MAX_ATTEMPTS=5
BEDROCK_RETRIEVAL_RESULTS=5
```

These can live in `apps/api/.env`; the API loads them through `dotenv` at
startup.

Use `BEDROCK_MODEL_ARN` instead of `BEDROCK_MODEL_ID` when calling a model that
requires an explicit ARN. When `BEDROCK_MODEL_ID` is provided, the API expands
it to a foundation model ARN for the configured region.

To reduce single-region model throttling, use a Bedrock inference profile
instead of `BEDROCK_MODEL_ID`:

```sh
BEDROCK_INFERENCE_PROFILE_ID=global.anthropic.claude-sonnet-4-5-20250929-v1:0
```

`BEDROCK_INFERENCE_PROFILE_ARN` has highest precedence, followed by
`BEDROCK_INFERENCE_PROFILE_ID`, `BEDROCK_MODEL_ARN`, then `BEDROCK_MODEL_ID`.

The deployed API CDK stack currently sets `BEDROCK_RUNTIME_MODE=local` while
Bedrock model access is pending. When Bedrock access is approved, update the API
Lambda environment to `BEDROCK_RUNTIME_MODE=bedrock`, verify corpus ingestion,
and update the response mapper so `ReadingResponse.metadata.mode` records
`bedrock` for Bedrock-generated readings.

## Commands

```sh
yarn workspace api test
yarn workspace api build-types
yarn api:build
yarn api:dev
```
