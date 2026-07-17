# Private Corpus Repository Extraction — Design

## Status

Approved on 2026-07-17.

## Objective

Move all proprietary tarot corpus content, corpus-processing code, compiler behavior, and
relationship rules out of the public `simple-tarot` repository into a private sibling repository
named `simple-tarot-corpus` before continuing the Bedrock RAG implementation.

The public application will eventually consume opaque, versioned artifacts. It will not contain
or reproduce the private source corpus, compiler, migration logic, or rule definitions.

## Current State

The public `bedrock-rag-artifacts` branch contains the committed canonical schema and migration
work from the first two corpus checkpoints. That branch has already been pushed to the public
GitHub remote. The compiler, coverage implementation, generated composer bundle, and generated
RAG documents from the third checkpoint remain uncommitted locally.

Public `main` also already contains the legacy corpus normalizer, its corpus-specific types and
tests, and its command wrapper. The extraction therefore audits and moves both the new pipeline
and the legacy processing path. Existing public history cannot be made private retroactively; the
cleanup removes this code from future public repository tips and prevents further proprietary
development there.

No raw source corpus or generated composer bundle is known to have been pushed. Nevertheless,
ordinary follow-up deletion commits would leave the already-pushed processing code reachable in
branch history, so the public branch requires cleanup after the private copy is verified.

## Repository Boundary

### Private `simple-tarot-corpus`

The private repository owns:

- legacy and canonical corpus sources
- canonical schema and validation
- Firestore-source migration
- corpus compiler and metadata generation
- relationship-rule definitions and processing
- corpus-specific fixtures and tests
- coverage reports and generated composer/RAG artifacts
- future artifact publication to private AWS storage

Its initial layout is:

```text
src/
  canonical/
  migration/
  compiler/
scripts/
  migrate-corpus.ts
  compile-corpus.ts
corpus/
  source/
  canonical/
tests/
package.json
tsconfig.json
.gitignore
README.md
```

The repository must install, compile, test, and generate artifacts without importing code from
the public application repository. Proprietary source and canonical data may be versioned in the
private repository. Generated output remains ignored during this extraction phase.

### Public `simple-tarot`

The public repository may later own only:

- stable artifact interfaces and compatibility checks
- secure configuration for locating a published artifact version
- generic artifact loading and caching
- generic reading orchestration
- synthetic fixtures that contain no real corpus text or proprietary rules
- public documentation of the artifact boundary

It must not contain real corpus content, migration or compiler implementation, relationship-rule
definitions, or generated private artifacts.

## Artifact Boundary

The private compiler will eventually publish a versioned artifact set containing:

- a deterministic composer bundle
- Bedrock RAG text documents and native metadata sidecars
- a coverage report
- a manifest containing the schema version, corpus version, object checksums, and object paths

The exact publishing implementation is deferred. The extraction establishes the ownership and
output contract only. The public application must treat published content as opaque private data
and use explicit compatibility metadata rather than importing the private compiler package.

## Extraction Sequence

1. Create the sibling local repository `simple-tarot-corpus`.
2. Transfer the committed checkpoint 1 and 2 work, the uncommitted checkpoint 3 work, and the
   private corpus source into it.
3. Replace public-repository paths and workspace assumptions with standalone private-repository
   configuration.
4. Add private-repository documentation and ignore generated output.
5. Install dependencies and run migration, compiler, unit, type, lint, determinism, and
   content-boundary checks independently.
6. Create the GitHub repository with private visibility and push the verified work.
7. Confirm the private remote contains the preserved commit and remains private.
8. Remove all transferred uncommitted files from the public working tree.
9. Remove the public `bedrock-rag-artifacts` remote branch and recreate any future public
   integration branch from `main`.
10. On the recreated public branch, remove the legacy normalizer, corpus-specific types and tests,
    command wrapper, and stale documentation while retaining generic Bedrock runtime and
    infrastructure integration.
11. Verify proprietary corpus paths are absent from the resulting public branch tip and that its
    changes from `main` are limited to the approved public cleanup and documentation.

The private push must be verified before any public branch deletion or history replacement.

## GitHub Exposure and Cleanup

Because checkpoint 1 and 2 commits reached a public branch, removing the branch cannot guarantee
that no third party has already cloned or cached them. The cleanup goal is to remove normal public
reachability and prevent further development from retaining those commits.

The legacy normalizer has already existed on public `main`. Removing it in a normal cleanup commit
does not erase it from historical commits. Rewriting the entire public main-branch history would
disrupt existing clones and is outside this extraction. The code must be treated as previously
disclosed even after its current files are removed.

The preferred cleanup is to delete the public feature branch after the private repository has a
verified copy. Future public integration work begins from `main`; the proprietary commits are not
merged, cherry-picked, or rebased into the replacement branch.

Remote branch deletion is a destructive external action and receives its own manual checkpoint.
The user must explicitly authorize or perform it after confirming the private remote.

## Verification

The private extraction is complete when:

- the private repository installs and runs without the public workspace
- its migration and compilation tests pass
- repeated compilation produces matching corpus versions and artifact checksums
- generated RAG content contains no exact legacy position meanings
- generated output is ignored by the private repository
- the GitHub repository visibility is confirmed private
- the private remote contains the verified extraction commit
- the public branch tip contains no real corpus content, compiler, migration, normalizer, or rule
  files
- a fresh public branch based on `main` contains none of the proprietary checkpoint commits
- documentation in each repository describes its resulting ownership boundary

## Error Handling and Recovery

- If standalone private tests fail, retain the public branch and continue fixing the private copy.
- If private GitHub creation or push fails, do not alter public history.
- If visibility cannot be confirmed as private, stop before uploading proprietary files.
- If public cleanup fails after the private push, keep the verified private remote and retry public
  cleanup without rewriting the private repository.
- Preserve local backups until both repository states have been manually verified.

## Initial Scope

This extraction does not:

- publish artifacts to S3
- add IAM, deployment, retention, or rollback automation
- change the deployed Bedrock Knowledge Base
- change the reading runtime to consume composer artifacts
- introduce a private npm package or a separate composition service
- guarantee removal from third-party clones or caches made while the public branch existed

Those changes require later designs and checkpoints after the repository boundary is established.
