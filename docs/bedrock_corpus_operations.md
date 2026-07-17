# Bedrock Corpus Operations

## Ownership boundary

Corpus sources, transformation code, relationship rules, and generated artifacts are private.
The public repository owns Bedrock infrastructure and runtime integration only. It does not
contain commands for creating or modifying corpus artifacts.

Do not upload an artifact unless the corpus owner has supplied and approved it through the private
workflow. This public runbook begins with an approved artifact and does not document its private
location or construction.

## Current deployed state

`apps/infra/lib/bedrock-rag-stack.ts` provisions:

- a private, versioned S3 corpus bucket
- an Amazon S3 Vectors index
- a Bedrock Knowledge Base
- an S3 data source scoped to the configured corpus prefix
- an application inference profile used by the API

The data source currently uses `FIXED_SIZE` chunking at 200 maximum tokens with 20 percent
overlap. The public API still calls Bedrock Agent Runtime `RetrieveAndGenerate`.

Infrastructure deployment does not upload corpus objects or start a Knowledge Base ingestion job.
The previously deployed objects remain in S3 until an operator deliberately replaces them.

## Required outputs

Deploy or inspect the Bedrock stack through the commands in
[`apps/infra/README.md`](../apps/infra/README.md#commands). Corpus operations use these
CloudFormation outputs:

- `BedrockCorpusBucketName`
- `BedrockKnowledgeBaseId`
- `BedrockDataSourceId`
- `BedrockRegion`
- `BedrockInferenceProfileArn`
- `BedrockGenerationModelId`
- `BedrockEmbeddingModelId`

The default S3 inclusion prefix is `corpus/`. If
`SIMPLE_TAROT_BEDROCK_CORPUS_PREFIX` changes, use the configured value instead.

## Upload an approved artifact

Confirm the artifact and destination with the corpus owner before uploading. Use an explicit local
artifact path supplied through the private workflow:

```sh
aws s3 cp <approved-private-artifact-path> \
  s3://<BedrockCorpusBucketName>/<configured-prefix>/<artifact-name>
```

Never substitute a source or generated path from this public repository. Do not upload an
unreviewed artifact or a selective-RAG artifact to the legacy data source.

## Start and inspect ingestion

After the approved objects are present under the configured prefix, start ingestion:

```sh
aws bedrock-agent start-ingestion-job \
  --knowledge-base-id <BedrockKnowledgeBaseId> \
  --data-source-id <BedrockDataSourceId>
```

Use the returned ingestion job identifier to inspect status:

```sh
aws bedrock-agent get-ingestion-job \
  --knowledge-base-id <BedrockKnowledgeBaseId> \
  --data-source-id <BedrockDataSourceId> \
  --ingestion-job-id <IngestionJobId>
```

Do not treat upload success as ingestion success. Wait for a completed ingestion job before testing
retrieval.

## API handoff

For a direct local API run in Bedrock mode, configure:

```sh
BEDROCK_RUNTIME_MODE=bedrock
BEDROCK_REGION=us-east-2
BEDROCK_KNOWLEDGE_BASE_ID=<BedrockKnowledgeBaseId>
BEDROCK_INFERENCE_PROFILE_ARN=<BedrockInferenceProfileArn>
BEDROCK_RETRIEVAL_RESULTS=5
BEDROCK_MAX_ATTEMPTS=5
```

Then run:

```sh
yarn api:dev
```

The deployed `SimpleTarotApi-<environment>` Lambda receives the Knowledge Base ID, region, and
inference profile directly from the Bedrock stack. Its role can call
`bedrock:RetrieveAndGenerate`, `bedrock:GetInferenceProfile`, `bedrock:InvokeModel`, and
`bedrock:Retrieve`.

## Verification checklist

1. Confirm the artifact is approved through the private corpus workflow.
2. Confirm the target bucket, prefix, Knowledge Base, and data source belong to the intended
   environment.
3. Upload only the approved artifact set.
4. Start ingestion and wait for it to complete.
5. Send a `POST /readings` request in Bedrock mode.
6. Inspect generated text and citations without exposing private artifact content in logs or public
   issues.

If ingestion fails with S3 Vectors' 2048-byte filterable-metadata limit, inspect the deployed
chunking and metadata configuration before changing infrastructure. The current 200-token setting
was selected to remain below that service limit.
