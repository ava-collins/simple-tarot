# Private Corpus Artifact Boundary

## Purpose

This document defines the public contract between Simple Tarot's private corpus workflow and this
public application repository. It intentionally excludes corpus content, construction commands,
compiler behavior, relationship rules, private paths, and real artifact examples.

## Ownership

The private corpus workflow owns:

- source material and canonical data
- migration, validation, compilation, and relationship rules
- real fixtures, generated artifacts, editorial review, and artifact approval
- immutable release publication, active-prefix mirroring, ingestion, and rollback

The public application repository owns:

- the private S3 destination and Bedrock Knowledge Base data source
- the S3 Vectors index and Bedrock runtime infrastructure
- runtime IAM and environment configuration
- compatibility checks, bounded loading, immutable caching, and deterministic composition for an
  approved artifact

The public repository must not reproduce private corpus behavior or import private build tooling.

## Artifact contract

The implemented public runtime consumer accepts approved opaque artifact sets for schemas 1 and 2.
The handoff includes schema and corpus compatibility metadata, object identities, and checksums
sufficient to reject incomplete, cross-version, incompatible, or corrupted input without
interpreting how the corpus was constructed. Spread positions use zero-based sequential order
values as part of the consumer compatibility contract.

Schema 2 adds only the public fields needed for deterministic single-card composition: explicit
number, resolved classical element, optional Minor-card suit, orientation-labeled keyword sets
with internal provenance, and exact approved themes for the arcana/suit/number/element dimensions.
The private workflow remains solely responsible for assignments, correspondences, wording,
editorial checklists, and derivation rules.

Private artifact publication and development activation are implemented outside this repository.
Public runtime loading, caching, compatibility enforcement, and generic deterministic composition
are implemented for development. See
[Deterministic Composer Runtime](deterministic-composer-runtime.md).

## Target development definition

The public development infrastructure definition uses a selective data source at
`corpus/active/` with `NONE` chunking. It retains the existing corpus bucket, S3 Vectors index,
Knowledge Base, and generation profile. Production retains the legacy `corpus/` and fixed-size
definition.

For a schema-2 single card, the development API uses the opaque bundle directly and performs no
Knowledge Base retrieval before its one Bedrock Converse call. Schema-1 single cards and Celtic
Cross requests retain one explicit retrieval with an active-version filter before Converse.
Normal responses keep resolved context, prompts, and retrieved evidence internal. The
authenticated development evaluation response exposes a versioned deterministic or explicit-RAG
trace to the private harness. This does not broaden the public artifact contract. Production
retains the legacy corpus infrastructure definition but has not been deployed with this runtime.

Runtime behavior follows the activated release. Supporting schema 2 in application code does not
publish or activate a private release, initiate ingestion, or change AWS resources. Rolling the
active pointer back to a compatible schema-1 release restores the schema-1 runtime behavior.

## Change coordination

Any change to the artifact handoff must update this document together with:

- [Bedrock Corpus Operations](bedrock_corpus_operations.md)
- [Bedrock RAG API Integration](bedrock_rag_api_integration.md)
- the private corpus workflow's artifact contract

Public documentation may describe compatibility and operational responsibilities, but it must not
include a private repository path, corpus example, rule definition, or artifact-construction
command.
