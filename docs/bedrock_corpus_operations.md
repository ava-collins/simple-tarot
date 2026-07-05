# Bedrock Corpus Operations

This document covers the corpus side of the Bedrock Knowledge Base flow:
normalizing source tarot content, placing it in S3, and syncing it into
Bedrock.

## Current State

Implemented in the repo:

- Read a Firestore-shaped corpus export from `assets/ignore/corpus-source.json`.
- Normalize cards and Celtic Cross position meanings into deterministic JSONL.
- Write `apps/api/corpus/generated/tarot-corpus.jsonl`.
- Provision the S3 bucket and Bedrock S3 data source with CDK.

Not implemented as repo scripts yet:

- Upload normalized corpus files to the deployed S3 bucket.
- Start or poll a Bedrock Knowledge Base ingestion job.

This means a deployed stack is necessary but not sufficient for retrieval.
The S3 bucket must contain corpus objects under the data source inclusion
prefix, and the Bedrock data source must be synced after upload.

## Normalized Document Shape

The normalizer lives in `apps/api/src/corpus/normalize-corpus.ts`.

Each generated JSONL record has:

```json
{
  "id": "card-fool-context",
  "kind": "card-context",
  "text": "Card: ...",
  "metadata": {
    "cardIndex": 0,
    "cardName": "Fool",
    "keywords": ["..."],
    "orientation": "general",
    "position": "general",
    "sourceCollection": "cards",
    "sourcePath": "cards/Fool",
    "spread": "general"
  }
}
```

Document kinds:

- `card-context`: one general card document when description or keywords are
  present.
- `position-meaning`: one document for each non-empty Celtic Cross position,
  orientation, and card combination.

Metadata is designed to preserve enough structure for citation inspection and
future filtering, even though the current API relies on Bedrock's default
Knowledge Base retrieval rather than explicit metadata filters.

## Normalize Locally

Default command:

```sh
yarn workspace api corpus:normalize
```

Default source:

```text
assets/ignore/corpus-source.json
```

Default output directory:

```text
apps/api/corpus/generated
```

The script also accepts optional source and output arguments:

```sh
yarn workspace api corpus:normalize <source-json-path> <output-directory>
```

The output file name is always:

```text
tarot-corpus.jsonl
```

## Deploy Infrastructure

The Bedrock RAG stack is part of the CDK app in `apps/infra`.

Required before synth or deploy:

```sh
cp apps/infra/.env.example apps/infra/.env
```

Populate `apps/infra/.env`, then run CDK commands from the workspace:

```sh
yarn workspace infra cdk synth
yarn workspace infra cdk deploy SimpleTarotBedrockRag-dev
```

The stack outputs:

- `BedrockCorpusBucketName`
- `BedrockKnowledgeBaseId`
- `BedrockDataSourceId`
- `BedrockRegion`
- `BedrockGenerationModelId`
- `BedrockEmbeddingModelId`

## Upload And Sync

The stack creates an empty S3 bucket. Upload the generated corpus file under
the configured inclusion prefix before expecting retrieval to work.

Default prefix:

```text
corpus/
```

Example upload:

```sh
aws s3 cp apps/api/corpus/generated/tarot-corpus.jsonl \
  s3://<BedrockCorpusBucketName>/corpus/tarot-corpus.jsonl
```

Then start ingestion:

```sh
aws bedrock-agent start-ingestion-job \
  --knowledge-base-id <BedrockKnowledgeBaseId> \
  --data-source-id <BedrockDataSourceId>
```

If `SIMPLE_TAROT_BEDROCK_CORPUS_PREFIX` is changed, upload into that prefix
instead of `corpus/`.

## API Handoff

After the corpus has been uploaded and synced, set API Bedrock mode for local
API runs:

```sh
BEDROCK_RUNTIME_MODE=bedrock
BEDROCK_REGION=<BedrockRegion>
BEDROCK_KNOWLEDGE_BASE_ID=<BedrockKnowledgeBaseId>
BEDROCK_INFERENCE_PROFILE_ID=<BedrockGenerationModelId>
BEDROCK_RETRIEVAL_RESULTS=5
BEDROCK_MAX_ATTEMPTS=5
```

Then start the API:

```sh
yarn api:dev
```

The deployed `SimpleTarotApi-<environment>` stack currently sets the Lambda
environment to `BEDROCK_RUNTIME_MODE=local` so the mobile persistence flow can
run while Bedrock access is pending. When Bedrock access is approved, update the
API stack/Lambda environment to `BEDROCK_RUNTIME_MODE=bedrock` and redeploy.

Before enabling Bedrock mode in production, also update
`apps/api/src/readings/response-mapper.ts` so `ReadingResponse.metadata.mode`
records `bedrock` for Bedrock-generated readings.

## Refresh Checklist

Use this flow whenever source corpus content changes:

1. Update `assets/ignore/corpus-source.json`.
2. Run `yarn workspace api corpus:normalize`.
3. Inspect a few lines in `apps/api/corpus/generated/tarot-corpus.jsonl`.
4. Upload `tarot-corpus.jsonl` to the deployed S3 bucket under the inclusion
   prefix.
5. Start a Bedrock ingestion job for the Knowledge Base data source.
6. Wait for ingestion to complete in AWS tooling.
7. Send a `POST /readings` request in Bedrock mode and inspect citations.

## Future Automation Candidates

The previous implementation plan expected these scripts, but they are not yet
present:

- `apps/api/scripts/upload-corpus.ts`
- `apps/api/scripts/sync-knowledge-base.ts`
- upload configuration helpers and tests

When adding them, preserve the current deterministic normalization output and
use the CDK outputs as the source of bucket, Knowledge Base, data source,
region, and prefix values.
