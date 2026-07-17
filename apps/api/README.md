# Simple Tarot API

`apps/api` is the REST backend for the Bedrock RAG tarot reading MVP.

-   [Endpoints](#endpoints)
-   [Local Mode](#local-mode)
-   [Bedrock Mode](#bedrock-mode)
-   [Commands](#commands)

## Endpoints

-   `GET /health`
-   `GET /avatars`
-   `POST /readings`
-   `GET /readings`

`GET /avatars` returns `{ thumbnails: string[] }` — a list of image URLs sourced
from Google Images via SerpAPI. Requires `SERPAPI_API_KEY` in the environment;
returns an empty array when the key is absent so the app degrades gracefully to
the default placeholder image. The Expo app currently reaches this route through
an RSC Server Function; see
[RSC Readings and Avatars Pilot](../../docs/rsc-readings-and-avatars-pilot.md).

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
saved. See [User Reading Persistence](../../docs/user_reading_persistence.md)
for table keys, profile fields, and AWS CLI inspection commands. See
[RSC Readings and Avatars Pilot](../../docs/rsc-readings-and-avatars-pilot.md)
for the mobile Server Function boundary around readings and avatar discovery.

## Local Mode

Local mode remains available for offline generation and does not require
Bedrock access. Set it explicitly after copying the Bedrock-first example:

```sh
cp apps/api/.env.example apps/api/.env
BEDROCK_RUNTIME_MODE=local yarn api:dev
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
BEDROCK_REGION=us-east-2
BEDROCK_KNOWLEDGE_BASE_ID=<cloudformation-output>
BEDROCK_MODEL_ID=
BEDROCK_INFERENCE_PROFILE_ID=
BEDROCK_INFERENCE_PROFILE_ARN=<BedrockInferenceProfileArn-output>
BEDROCK_MAX_ATTEMPTS=5
BEDROCK_RETRIEVAL_RESULTS=5
```

These can live in `apps/api/.env`; the API loads them through `dotenv` at
startup.

Use `BEDROCK_MODEL_ARN` instead of `BEDROCK_MODEL_ID` when calling a model that
requires an explicit ARN. When `BEDROCK_MODEL_ID` is provided, the API expands
it to a foundation model ARN for the configured region.

The CDK Bedrock stack creates a regional application inference profile from the
configured `us-east-2` foundation model. Use its output ARN:

```sh
BEDROCK_INFERENCE_PROFILE_ARN=<BedrockInferenceProfileArn-output>
```

`BEDROCK_INFERENCE_PROFILE_ARN` has highest precedence, followed by
`BEDROCK_INFERENCE_PROFILE_ID`, `BEDROCK_MODEL_ARN`, then `BEDROCK_MODEL_ID`.

Corpus sources, transformation code, relationship rules, and generated artifacts are private.
This workspace consumes the configured Knowledge Base through Bedrock Agent Runtime; it does not
generate corpus artifacts. See
[Bedrock Corpus Operations](../../docs/bedrock_corpus_operations.md) for the approved-artifact
handoff and ingestion boundary.

The deployed API CDK stack sets `BEDROCK_RUNTIME_MODE=bedrock` unconditionally
(no deployed local-mode fallback), imports the Knowledge Base ID and
application inference profile ARN from the same stage, and grants the Lambda
permission to call `RetrieveAndGenerate`, `GetInferenceProfile`,
`InvokeModel`, and `Retrieve` — all four are required once the generation
model sits behind an application inference profile. Generated and failed
reading metadata records the active generation mode.

## Commands

```sh
yarn workspace api test
yarn workspace api build-types
yarn api:build
yarn api:dev
```
