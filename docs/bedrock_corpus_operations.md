# Bedrock Corpus Operations

## Ownership boundary

Corpus sources, transformation code, relationship rules, generated artifacts, publication, and
activation are private. The public repository owns Bedrock infrastructure and runtime integration
only. It does not contain corpus construction, publication, or activation commands.

The durable ownership and compatibility contract is defined in
[Private Corpus Artifact Boundary](private-corpus-artifact-boundary.md).

## Development data-source definition

`apps/infra/lib/bedrock-rag-stack.ts` retains the development:

- private, versioned S3 corpus bucket
- Amazon S3 Vectors bucket and index
- Bedrock Knowledge Base
- embedding model and generation inference profile
- CloudFormation handoff outputs

The development stack definition replaces only the legacy data source. The selective data source:

- reads the stable `corpus/active/` prefix populated by the private workflow
- uses `NONE` chunking so each approved semantic text object is one ingestion document
- uses the `DELETE` data deletion policy
- has a new logical identity and versioned name because Bedrock cannot change chunking strategy on
  an existing data source

The production definition remains on `corpus/` with `FIXED_SIZE` chunking at 200 maximum tokens and
20 percent overlap. Production is not part of this cutover.

The public API remains on Bedrock Agent Runtime `RetrieveAndGenerate`. Deterministic composer-bundle
loading and explicit retrieval plus generation are later implementation stages.

## Deployment boundary

Infrastructure deployment does not publish or activate corpus objects. Before deploying the
development data-source replacement:

1. Run the focused infrastructure tests and type build.
2. Generate the exact development Bedrock stack diff.
3. Confirm that the bucket, vector bucket/index, Knowledge Base, and inference profile are retained.
4. Confirm that only the development data source and its output reference are replaced.
5. Obtain explicit authorization for the temporary development retrieval interruption.

Replacing the legacy development data source deletes its indexed vector data under Bedrock's
`DELETE` policy; it does not delete the vector store. Development retrieval is therefore empty
until the private workflow activates the approved release and Bedrock completes ingestion. If
replacement fails, inspect the data source for `DELETE_UNSUCCESSFUL` before retrying or assuming
the legacy embeddings were removed.

After deployment, the private corpus owner resolves the new data source output and performs the
separately authorized activation. Do not treat infrastructure deployment, object publication, or
copy completion as ingestion success; activation is successful only when Bedrock reports a
completed ingestion job.

## Required outputs

Inspect the Bedrock stack through the commands in
[`apps/infra/README.md`](../apps/infra/README.md#commands). The private operational workflow uses
these CloudFormation outputs without exposing corpus implementation details here:

- `BedrockCorpusBucketName`
- `BedrockKnowledgeBaseId`
- `BedrockDataSourceId`
- `BedrockRegion`
- `BedrockInferenceProfileArn`
- `BedrockGenerationModelId`
- `BedrockEmbeddingModelId`

For development, `BedrockDataSourceId` changes when the selective data source is deployed. The
bucket and Knowledge Base outputs must remain unchanged.

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

The deployed `SimpleTarotApi-<environment>` Lambda receives the Knowledge Base ID, region, and
inference profile directly from the Bedrock stack. Its current role can call
`bedrock:RetrieveAndGenerate`, `bedrock:GetInferenceProfile`, `bedrock:InvokeModel`, and
`bedrock:Retrieve`.

## Verification checklist

1. Confirm the stack, account, Region, bucket, Knowledge Base, and data source are development
   resources.
2. Confirm the CDK diff replaces only the approved development data source.
3. After authorized deployment, confirm the bucket and Knowledge Base outputs did not change.
4. Wait for the private workflow to report successful activation and completed ingestion.
5. Confirm filtered retrieve-only results use approved selective metadata.
6. Send a `POST /readings` request in Bedrock mode and inspect generated text and citations without
   exposing private artifact content in logs or public issues.
