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
- compatibility checks and generic loading for an approved artifact when those capabilities are
  implemented

The public repository must not reproduce private corpus behavior or import private build tooling.

## Artifact contract

A future public runtime consumer may accept only an approved, versioned, opaque artifact set. The handoff
must include schema and corpus compatibility metadata, object identities, and checksums sufficient
to reject incomplete, incompatible, or corrupted input without interpreting how the corpus was
constructed.

Private artifact publication and development activation are implemented outside this repository.
Public runtime loading, caching, and compatibility enforcement remain deferred.

## Target development definition

The public development infrastructure definition uses a selective data source at
`corpus/active/` with `NONE` chunking. It retains the existing corpus bucket, S3 Vectors index,
Knowledge Base, and generation profile. Production retains the legacy `corpus/` and fixed-size
definition.

The API continues to use Bedrock Agent Runtime `RetrieveAndGenerate`. Generic composer-artifact
loading, deterministic relationship composition, explicit retrieval and generation, and saved-case
verification remain future work.

## Change coordination

Any change to the artifact handoff must update this document together with:

- [Bedrock Corpus Operations](bedrock_corpus_operations.md)
- [Bedrock RAG API Integration](bedrock_rag_api_integration.md)
- the private corpus workflow's artifact contract

Public documentation may describe compatibility and operational responsibilities, but it must not
include a private repository path, corpus example, rule definition, or artifact-construction
command.
