# Deterministic Composer Runtime

## Purpose

The development API composes exact tarot context from an approved opaque corpus bundle before it
calls Amazon Bedrock. This runtime keeps canonical card, orientation, spread-position, and
relationship facts deterministic while retaining Bedrock Knowledge Bases for selective thematic
retrieval and generated prose.

Corpus sources, compilation, editorial rules, real fixtures, publication, activation, and
ingestion remain private. This public repository contains only the generic consumer contract,
validation, composition, AWS loading boundary, and runtime integration.

The deployed development path performs one explicit Knowledge Base retrieval and one separate
Bedrock Converse invocation. Deterministic composer context is required for that Bedrock path.

## Runtime ownership

The public API owns:

- strict compatibility validation for the active pointer, release manifest, and opaque composer
  bundle
- bounded S3 reads, checksum validation, immutable bundle caching, and fail-closed replacement
- deterministic request normalization, card-local composition, named positional relationships,
  and whole-spread relationships
- precedence-ordered prompt rendering and the exact active-corpus metadata filter
- safe errors, aggregate logs, response metadata, and persistence metadata

The private corpus workflow owns the meaning of the data supplied through that contract. Public
code must not reproduce its compiler, source schema, editorial logic, or real rules.

## Request flow

```mermaid
flowchart LR
    Request["Authenticated POST /readings"]
    Validate["Transport validation"]
    Pointer["Read active pointer"]
    Bundle["Validate manifest and immutable bundle"]
    Compose["Deterministic composition"]
    Query["Reading-level retrieval query"]
    Filter["Active-version metadata filter"]
    Retrieve["Bedrock Knowledge Base Retrieve"]
    Evidence["Bounded internal evidence"]
    Prompt["Controlled generation prompt"]
    Converse["Bedrock Converse"]
    Response["Reading response and persistence"]

    Request --> Validate
    Validate --> Pointer
    Pointer --> Bundle
    Bundle --> Compose
    Compose --> Query
    Compose --> Filter
    Query --> Retrieve
    Filter --> Retrieve
    Retrieve --> Evidence
    Compose --> Prompt
    Evidence --> Prompt
    Prompt --> Converse
    Converse --> Response
```

When composer mode is enabled, the route:

1. Validates the existing public request contract before any S3 access.
2. Reads the development active-release pointer on every request.
3. Validates same-stage Knowledge Base and data-source identities.
4. Loads or reuses one fully validated immutable bundle for the complete pointer identity.
5. Normalizes supported single-card or Celtic Cross input against exact bundle identities.
6. Composes card-local facts, declared named-position edges, and allowlisted whole-spread results.
7. Builds one reading-level query from user intent and composed relationship themes.
8. Adds an `andAll` retrieval filter for the exact corpus version, approved status, and
   correspondence-theme document kind.
9. Requests five Knowledge Base results without a reranker and reduces non-empty text to bounded
   internal evidence.
10. Builds a controlled generation prompt in the approved evidence order.
11. Calls Bedrock Converse through the configured application inference profile and maps generated
    text into the existing public response with an empty citations array.

The enabled path never falls back to an old bundle or the local placeholder after a compatibility,
load, or composition failure.

## Consumer compatibility

The public consumer projection is intentionally narrower than the private artifact. It accepts
only known schema versions, exact fields, safe relative object paths, bounded object sizes,
lowercase SHA-256 identities, and allowlisted predicate and relationship types.

Spread positions use zero-based sequential `order` values. Celtic Cross requests must contain ten
items whose position IDs match that exact order. Card indexes resolve to one canonical card and the
submitted card name must match. A mismatch is a safe request-domain error, not a semantic search.

The loader reads only:

- `state/dev/active-release.json`
- `releases/*/manifest.json`
- `releases/*/composer-bundle.json`

It validates the immutable bundle byte size, SHA-256 checksum, schema, corpus version, and public
consumer projection before replacing its one-entry cache. The active pointer is read for every
enabled request; identical concurrent misses share one in-flight immutable load.

## Prompt precedence and retrieval

The composed prompt orders evidence as:

1. authority and non-contradiction instructions
2. active corpus and spread identity
3. ordered card, orientation, position, and exact-meaning context
4. declared named positional relationships
5. bounded whole-spread relationships
6. optional bounded retrieved themes
7. user intent
8. response-shape requirements

Retrieved text may enrich these exact facts but cannot replace or contradict them. Empty optional
relationship sections are omitted. Private source IDs and rule IDs are not rendered.

The retriever performs one `Retrieve` request per reading with five results by default and no
reranker. Each result contributes at most 2,000 characters and the full evidence section is capped
at 8,000 characters. Empty or whitespace-only results are omitted. If retrieval succeeds with no
usable evidence, Converse still generates from deterministic context. If retrieval fails, Converse
is not invoked.

Retrieved evidence is treated as untrusted data, escaped inside explicit prompt boundaries, and
kept out of public responses, persistence, logs, and safe errors. Converse uses a maximum of 3,072
output tokens and temperature `0.7`. It returns no public citations.

## Configuration and deployment

Development is deployed with:

```text
BEDROCK_RUNTIME_MODE=bedrock
COMPOSER_RUNTIME_MODE=enabled
BEDROCK_CORPUS_BUCKET=<same-stage corpus bucket>
BEDROCK_DATA_SOURCE_ID=<same-stage data source>
BEDROCK_KNOWLEDGE_BASE_ID=<same-stage Knowledge Base>
```

Production and local operation use `COMPOSER_RUNTIME_MODE=disabled`. Local mode does not construct
the composer S3 reader and returns the offline placeholder reading. Deployed Bedrock generation
requires composed context; disabled composer mode is not a live Bedrock fallback. Production has
no composer object-read grant.

The development Lambda role has `s3:GetObject` only for the three patterns listed under consumer
compatibility. The Bedrock stack exports the bucket and data-source identities consumed by the API
stack through strong CloudFormation references.

## Errors, logs, and persistence

Unsupported card or spread selections return HTTP 400:

```json
{"code":"INVALID_COMPOSER_REQUEST","message":"The reading selection is not supported by the active tarot corpus."}
```

Artifact, configuration, identity, integrity, or load failures return a retryable HTTP 503:

```json
{"code":"COMPOSER_UNAVAILABLE","message":"Tarot reading context is temporarily unavailable.","retryable":true}
```

Responses and DynamoDB generation metadata expose only:

- `composerMode`
- optional `corpusVersion`
- optional `namedPairCount`
- optional `wholeSpreadCount`

They never persist composed cards, prompts, themes, relationship facts, support lists, source IDs,
or rule IDs. Runtime logs use request IDs, timing, corpus version, prompt lengths, card count, token
usage, and aggregate retrieval/evidence counts. Retrieved text and generated text are not logged.
Authorization is redacted and request bodies are not logged.

Knowledge Base retrieval failures return a retryable HTTP 503 with
`BEDROCK_RETRIEVAL_UNAVAILABLE`; generation failures return a retryable HTTP 503 with
`BEDROCK_GENERATION_UNAVAILABLE`. Bedrock throttling returns HTTP 429 with `BEDROCK_THROTTLED`.

## Operations and verification

Before a development deployment:

1. Run API and infrastructure tests, type builds, lint, and `git diff --check`.
2. Review the exact `SimpleTarotDev/*` CDK diff.
3. Confirm production has no changes.
4. Confirm composer IAM contains only the three approved S3 object patterns.
5. Obtain explicit authorization for the exact development targets.

After deployment, inspect selected Lambda environment fields and the synthesized IAM statement,
then run authenticated single-card and Celtic Cross cases. Record only request IDs, status,
response-shape validity, composer mode, corpus version, item and relationship counts, empty
citation count, aggregate retrieval/evidence counts, Converse completion, output length, and
timings. Compare the returned version with the active pointer without committing or printing
artifact bodies.

The 2026-07-18 development verification covered both supported spreads, exact active-version
metadata, five retrieved and usable results for each controlled request, one retrieval and one
Converse boundary event per request, non-empty generated positions, empty public citations, and
aggregate-only logs. A mobile end-to-end check then exposed and verified a corrected public card
name mismatch before this documentation checkpoint. Production and private corpus resources were
not deployed or mutated.

## Rollback

Rollback the explicit retrieval and Converse runtime by redeploying the last known-good reviewed
application revision. Do not restore a combined retrieval-and-generation compatibility path.

Composer mode can still be disabled through a reviewed infrastructure change, but this is an
operational shutdown of deployed Bedrock reading generation rather than a legacy Bedrock fallback:

1. Set development composer mode to disabled in the reviewed infrastructure definition.
2. Generate and review the development CDK diff.
3. Confirm it removes the bucket/data-source environment identities, the three S3 read patterns,
   and their dependent exports.
4. Deploy only after exact-target authorization.
5. Verify the expected safe generation-unavailable response in Bedrock mode and the offline
   placeholder path in local mode.

Disabling composer mode does not mutate the active corpus release, delete the Knowledge Base, or
change the vector data source. Restoring enabled mode requires a new reviewed diff and explicit
authorization.
