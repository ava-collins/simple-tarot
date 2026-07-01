# Simple Tarot API

`apps/api` is the REST backend for the Bedrock RAG tarot reading MVP.

## Endpoints

- `GET /health`
- `POST /readings`

`POST /readings` accepts a spread, ordered card items, reversed flags, and an
optional question. The route validates input, builds a deterministic retrieval
prompt, then either returns a local placeholder response or calls Bedrock
Knowledge Bases depending on runtime configuration.

## Local Mode

Local mode is the default and does not require AWS credentials:

```sh
cp apps/api/.env.example apps/api/.env
yarn api:dev
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

## Commands

```sh
yarn workspace api test
yarn workspace api build-types
yarn api:build
yarn api:dev
```
