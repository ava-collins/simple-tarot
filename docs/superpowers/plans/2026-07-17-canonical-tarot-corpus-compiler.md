# Canonical Tarot Corpus and Compiler Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the legacy Firestore-shaped tarot export into a validated, reviewable canonical source and compile it reproducibly into an exact composer bundle, discrete selective-RAG documents, native Bedrock metadata sidecars, and a coverage report.

**Architecture:** Keep the legacy normalizer and deployed `RetrieveAndGenerate` path intact while introducing a parallel version-1 corpus pipeline. Pure schema validation, migration, document construction, and coverage calculations live in focused `apps/api/src/corpus` modules; command-line scripts own filesystem I/O. The seven files under `assets/corpus` become canonical editorial input after their generated migration is reviewed.

**Tech Stack:** TypeScript 6, Node.js 22 filesystem APIs, Vitest 3, JSON source artifacts, Amazon Bedrock S3 data-source metadata sidecar format.

## Global Constraints

- Implement only the canonical source migration and compiler described here; do not change CDK resources, upload to AWS, start ingestion, or replace the runtime `RetrieveAndGenerate` path.
- Preserve `assets/ignore/corpus-source.json` as read-only migration input and preserve `apps/api/corpus/generated/tarot-corpus.jsonl` as the rollback artifact.
- Keep all compiler behavior pure and deterministic; isolate filesystem reads and writes in CLI scripts and writer functions.
- Treat card correspondence references and descriptive themes as optional. Missing optional coverage produces warnings, never a failed compilation.
- Reject duplicate IDs, invalid references, invalid schema versions, unsupported predicates, and malformed spread order or narrative edges.
- Admit only `approved` theme fragments to compiled composer and RAG artifacts.
- Never evaluate source predicates as JavaScript. Version 1 only represents the allowlisted `eq`, `in`, `all`, `any`, and `not` operators.
- Keep reusable strings in the nearest owning constants module.
- Do not add a schema-validation dependency; the version-1 validator is a focused TypeScript module with explicit type guards and structured issues.
- Run internal test-writing, test-running, implementation, and automated verification without pausing inside a checkpoint.
- After each checkpoint's automated verification, leave its changes uncommitted and stop with the listed manual-verification instructions.
- The user validates and commits each checkpoint. Do not proceed until the user confirms validation, confirms the commit, and explicitly authorizes the next checkpoint.
- Update durable architecture and operations documentation in Checkpoint 3 so current and future agents do not follow the legacy pipeline as the new architecture.

## Delivery Sequence

This plan is the first of four ordered implementation plans derived from the approved design:

1. **This plan:** canonical source, validation, migration, compiler, and coverage report.
2. Rewrite the held corpus-ingestion design and plan native S3 object/sidecar deployment, `NONE` chunking, filterable S3 Vectors metadata, and ingestion automation.
3. Implement deterministic runtime composition plus one Bedrock `Retrieve` request and explicit model invocation.
4. Build the small AWS-backed design harness and saved-case comparison workflow.

Each later plan consumes checked-in interfaces and artifacts from this plan. None may be folded into a checkpoint below.

---

## Checkpoint 1: Canonical Schema and Validation

### Task 1: Define the version-1 canonical model

**Files:**
- Create: `apps/api/src/corpus/canonical-types.ts`
- Create: `apps/api/src/corpus/corpus-constants.ts`
- Create: `apps/api/src/corpus/canonical-validation.ts`
- Test: `apps/api/src/corpus/canonical-validation.test.ts`

**Interfaces:**
- Produces: `CanonicalCorpus`, `CanonicalCard`, `CanonicalSpread`, `CanonicalCorrespondence`, `ThemeFragment`, `RelationshipRule`, `LegacyPositionMeaning`, `CorpusSource`, `CorpusPredicate`, `ValidationIssue`, and `ValidationResult`.
- Produces: `validateCanonicalCorpus(input: unknown): ValidationResult<CanonicalCorpus>`.
- Produces: `CANONICAL_SCHEMA_VERSION`, `CANONICAL_FILE_NAMES`, `SUPPORTED_PREDICATE_OPERATORS`, `THEME_STATUSES`, and `RELATIONSHIP_SCOPES`.
- Consumed by: Checkpoint 2 migration and Checkpoint 3 compiler.

- [ ] **Step 1: Write the schema constants and compile-time types**

Define these exact constants:

```ts
export const CANONICAL_SCHEMA_VERSION = 1 as const;

export const CANONICAL_FILE_NAMES = {
    cards: 'cards.json',
    correspondences: 'correspondences.json',
    legacyPositionMeanings: 'legacy-position-meanings.json',
    relationshipRules: 'relationship-rules.json',
    sources: 'sources.json',
    spreads: 'spreads.json',
    themeFragments: 'theme-fragments.json'
} as const;

export const SUPPORTED_PREDICATE_OPERATORS = ['eq', 'in', 'all', 'any', 'not'] as const;
export const THEME_STATUSES = ['draft', 'approved', 'retired'] as const;
export const RELATIONSHIP_SCOPES = ['card-local', 'named-pair', 'whole-spread'] as const;
```

Use one envelope shape for every canonical file:

```ts
export type CanonicalCollection<T> = {
    schemaVersion: 1;
    items: T[];
};
```

Define stable string IDs and the following required domain shapes:

```ts
export type SubjectReference = {
    type: 'alphabet' | 'arcana' | 'card' | 'element' | 'number' | 'sephiroth' | 'suit';
    id: string;
};

export type CanonicalCard = {
    id: string;
    index: number;
    name: string;
    title: string;
    arcana: 'major' | 'minor';
    description: string;
    uprightKeywords: string[];
    reversedKeywords: string[];
    correspondenceIds: string[];
    attributes: Record<string, string | number>;
};

export type SpreadPosition = {
    id: string;
    displayName: string;
    description: string;
    lens: string;
    order: number;
};

export type SpreadNarrativeEdge = {
    id: string;
    fromPositionId: string;
    toPositionId: string;
    relationship: 'colors' | 'explains' | 'informs' | 'meets' | 'modifies';
};

export type CanonicalSpread = {
    id: string;
    displayName: string;
    positions: SpreadPosition[];
    narrativeEdges: SpreadNarrativeEdge[];
};

export type CanonicalCorrespondence = {
    id: string;
    kind: SubjectReference['type'];
    name: string;
    attributes: Record<string, string | number | string[]>;
    sourceIds: string[];
};

export type CorpusPredicate =
    | { eq: [{ field: string }, string | number | boolean] }
    | { in: [{ field: string }, Array<string | number>] }
    | { all: CorpusPredicate[] }
    | { any: CorpusPredicate[] }
    | { not: CorpusPredicate };

export type ThemeFragment = {
    id: string;
    kind: 'correspondence-theme';
    subjects: SubjectReference[];
    theme: string;
    when: CorpusPredicate;
    polarity: 'contextual' | 'reinforcing' | 'challenging';
    status: 'draft' | 'approved' | 'retired';
    sourceIds: string[];
};

export type RelationshipCondition =
    | { type: 'named-position-edge'; edgeId: string }
    | { type: 'dominance'; subject: 'element' | 'suit'; minimumCount: number }
    | { type: 'major-arcana-weight'; minimumCount: number }
    | { type: 'number-repetition'; minimumCount: number }
    | {
          type: 'orientation-balance';
          orientation: 'upright' | 'reversed';
          minimumCount: number;
      };

export type RelationshipRule = {
    id: string;
    scope: 'card-local' | 'named-pair' | 'whole-spread';
    ruleType:
        | 'element-dominance'
        | 'major-arcana-weight'
        | 'named-position-edge'
        | 'number-repetition'
        | 'orientation-balance'
        | 'suit-dominance';
    priority: number;
    condition: RelationshipCondition;
    fact: string;
    sourceIds: string[];
};

export type LegacyPositionMeaning = {
    id: string;
    spreadId: string;
    positionId: string;
    cardId: string;
    orientation: 'upright' | 'reversed';
    meaning: string;
    sourceIds: string[];
    status: 'approved';
};

export type CorpusSource = {
    id: string;
    title: string;
    author?: string;
    uri?: string;
    license?: string;
    editorialNotes?: string;
};
```

`CanonicalCorpus` must contain seven `CanonicalCollection` properties matching the seven files. `single_card` must not appear as a spread or position.

- [ ] **Step 2: Write failing validator tests**

Add focused fixtures and assertions for:

```ts
expect(validateCanonicalCorpus(validCorpus)).toEqual({
    ok: true,
    value: validCorpus,
    warnings: []
});
```

Cover these failures with exact issue codes:

```text
invalid_schema_version
duplicate_id
invalid_reference
invalid_spread_order
invalid_narrative_edge
invalid_relationship_condition
unsupported_predicate_operator
invalid_predicate_field
invalid_editorial_status
```

Cover these non-failing warnings:

```text
missing_optional_correspondence
missing_optional_theme
```

The valid fixture must contain one card, one two-position spread, one correspondence, one approved theme, one named-pair rule, one legacy meaning, and one source. Assert that a missing optional card correspondence returns `ok: true` plus `missing_optional_correspondence`.

- [ ] **Step 3: Run the validator tests and verify the expected failure**

Run:

```sh
yarn workspace api test canonical-validation.test.ts
```

Expected: FAIL because `validateCanonicalCorpus` does not exist.

- [ ] **Step 4: Implement structural and cross-reference validation**

Implement:

```ts
export type ValidationIssue = {
    code:
        | 'duplicate_id'
        | 'invalid_editorial_status'
        | 'invalid_narrative_edge'
        | 'invalid_predicate_field'
        | 'invalid_reference'
        | 'invalid_relationship_condition'
        | 'invalid_schema_version'
        | 'invalid_spread_order'
        | 'missing_optional_correspondence'
        | 'missing_optional_theme'
        | 'unsupported_predicate_operator';
    path: string;
    message: string;
};

export type ValidationResult<T> =
    | { ok: true; value: T; warnings: ValidationIssue[] }
    | { ok: false; errors: ValidationIssue[]; warnings: ValidationIssue[] };
```

Validation must:

- confirm all seven envelopes use schema version `1` and contain arrays;
- confirm IDs are non-empty and unique within their entity namespace;
- confirm card `correspondenceIds`, theme subjects/source IDs, rule source IDs, meaning card/spread/position/source IDs, correspondence source IDs, and spread narrative edges resolve;
- confirm each spread position order is the zero-based sequence `0..length - 1` with no duplicates;
- reject `single_card` as a spread ID;
- confirm each predicate is an object with exactly one supported operator;
- allow predicate fields only from `card.*`, `pair.*`, `spread.*`, and `reading.*` allowlists declared beside the validator;
- confirm each relationship rule's `ruleType` matches its typed `condition`, referenced narrative edges resolve, and every `minimumCount` is a positive integer;
- treat an absent optional correspondence or absent approved theme coverage as a warning;
- return all discovered issues in deterministic `path` then `code` order.

Do not import `node:fs` in this module.

- [ ] **Step 5: Run Checkpoint 1 automated verification**

Run:

```sh
yarn workspace api test canonical-validation.test.ts
yarn workspace api build-types
yarn lint
git diff --check
```

Expected: all commands pass; only the four Checkpoint 1 files are modified or untracked.

### Checkpoint 1 manual verification and stop

Ask the user to inspect the four Checkpoint 1 files and confirm:

- the seven-file envelopes and domain types match the approved design;
- `single_card` remains position-less;
- sparse correspondence/theme coverage is warning-only;
- invalid references and predicates fail closed;
- no filesystem or AWS I/O leaked into validation.

Leave all Checkpoint 1 files uncommitted. Stop. The user validates and commits the files, then confirms the commit and explicitly authorizes Checkpoint 2.

---

## Checkpoint 2: Mechanical Legacy Migration and Canonical Source

### Task 2: Extend the legacy export types and build a pure migration

**Files:**
- Modify: `apps/api/src/corpus/types.ts`
- Create: `apps/api/src/corpus/migrate-firestore-corpus.ts`
- Test: `apps/api/src/corpus/migrate-firestore-corpus.test.ts`
- Create: `apps/api/scripts/migrate-corpus.ts`
- Modify: `apps/api/package.json`
- Generate: `assets/corpus/cards.json`
- Generate: `assets/corpus/spreads.json`
- Generate: `assets/corpus/correspondences.json`
- Generate: `assets/corpus/theme-fragments.json`
- Generate: `assets/corpus/relationship-rules.json`
- Generate: `assets/corpus/legacy-position-meanings.json`
- Generate: `assets/corpus/sources.json`

**Interfaces:**
- Consumes: `CanonicalCorpus` and `validateCanonicalCorpus` from Checkpoint 1.
- Produces: `migrateFirestoreCorpus(source: FirestoreCorpusExport): CanonicalCorpus`.
- Produces CLI: `yarn workspace api corpus:migrate [source-path] [output-directory]`.
- Default input: `assets/ignore/corpus-source.json`.
- Default output: `assets/corpus`.

- [ ] **Step 1: Expand legacy types without changing the existing normalizer contract**

Add optional fields to `FirestoreCard` for `name`, `arcana`, `element`, `number`, `path`, `decan`, `image`, `color`, and `hex`. Add typed records for the `spreads`, `elements`, `suits`, `sephiroth`, and `alphabet` collections while keeping every legacy property optional or `unknown` at the untrusted input boundary.

Do not change `CorpusDocument`, `normalizeFirestoreCorpus`, or `writeNormalizedCorpus`; the current JSONL rollback path must continue to compile and pass its existing tests.

- [ ] **Step 2: Write failing migration tests**

Build one compact Firestore-shaped fixture containing:

- two cards deliberately supplied out of index order;
- one Celtic Cross spread with two ordered positions;
- one element, suit, Sephiroth, and alphabet item;
- one upright and one reversed position meaning;
- one missing optional correspondence reference.

Assert:

```ts
const migrated = migrateFirestoreCorpus(fixture);

expect(migrated.cards.items.map(card => card.id)).toEqual(['the-fool', 'ace-of-coins']);
expect(migrated.spreads.items[0]?.positions.map(position => position.order)).toEqual([0, 1]);
expect(migrated.legacyPositionMeanings.items).toHaveLength(2);
expect(migrated.sources.items).toContainEqual(
    expect.objectContaining({ id: 'legacy-corpus-source' })
);
expect(validateCanonicalCorpus(migrated).ok).toBe(true);
```

Also assert that rerunning migration on the same fixture yields byte-equivalent `JSON.stringify` output and that the input object is not mutated.

- [ ] **Step 3: Run migration tests and verify the expected failure**

Run:

```sh
yarn workspace api test migrate-firestore-corpus.test.ts
```

Expected: FAIL because `migrateFirestoreCorpus` does not exist.

- [ ] **Step 4: Implement deterministic entity migration**

Implement the following mechanical rules:

- slugify stable IDs using lowercase ASCII, `&` → `and`, non-alphanumeric runs → `-`, and trimmed dashes;
- sort cards by numeric `index`, then name; use the source `name` when non-empty and otherwise the Firestore document key;
- map `type` to suit only when it references a known suit; map `arcana` only when it is `major` or `minor`;
- preserve non-empty card `element`, `number`, `path`, `decan`, `image`, `color`, and `hex` values in `attributes`;
- produce correspondence IDs as `<collection-kind>-<slug>`, including explicit `arcana-major`, `arcana-minor`, and card number correspondences referenced by cards;
- preserve legacy collection attributes as strings, numbers, or comma-split string lists without inventing absent prose;
- use the authoritative legacy spread position array order and copy its description into both `description` and initial `lens`;
- seed only these approved Celtic Cross narrative edges:
  - `past-informs-situation` (`past` → `situation`, `informs`)
  - `root-explains-situation` (`root` → `situation`, `explains`)
  - `challenge-modifies-situation` (`challenge` → `situation`, `modifies`)
  - `self-meets-influences` (`self` → `influences`, `meets`)
  - `hope-colors-outcome` (`hope` → `outcome`, `colors`)
- extract every non-empty Celtic Cross meaning into a stable ID `<spread>-<position>-<card>-<orientation>`;
- create approved theme fragments only from existing descriptive fields: element keywords/energy, suit keywords/dominant/zodiac, and Sephiroth title/meaning/represents;
- create no theme text for alphabet records that only contain identity fields;
- seed one `named-position-edge` relationship rule for each of the five narrative edges, with the matching `edgeId`, priority `100`, and a factual sentence derived from the edge relationship;
- seed these whole-spread rule definitions, which remain reviewable data and are not evaluated in this plan:
  - suit dominance: minimum count `3`, priority `80`;
  - element dominance: minimum count `3`, priority `80`;
  - Major Arcana weight: minimum count `5`, priority `70`;
  - repeated number: minimum count `2`, priority `60`;
  - reversed orientation balance: minimum count `6`, priority `50`;
- attach `legacy-corpus-source` to every migrated item with provenance support;
- set every envelope to schema version `1` and sort every output collection by stable ID except cards and spread positions, which retain canonical numeric order.

The migration must preserve all 78 cards, the one authoritative Celtic Cross spread, and all 1,560 non-empty legacy meanings.

- [ ] **Step 5: Implement the migration CLI and seven-file writer**

Add to `apps/api/package.json`:

```json
"corpus:migrate": "node -r ts-node/register ./scripts/migrate-corpus.ts"
```

The script must:

1. resolve optional input/output arguments without shelling out;
2. read the legacy export through `readFirestoreCorpusExport`;
3. call `migrateFirestoreCorpus`;
4. call `validateCanonicalCorpus` and exit non-zero after printing structured errors if invalid;
5. create the output directory;
6. write each collection as two-space-indented JSON with one trailing newline, using a shared `writeCanonicalCorpus` function colocated with the migration module;
7. print counts and validation warnings without printing source content.

Return the seven absolute paths from `writeCanonicalCorpus` so its output is directly testable.

- [ ] **Step 6: Run the migration against the real legacy export**

Run:

```sh
yarn workspace api corpus:migrate
```

Expected summary:

```text
cards: 78
spreads: 1
legacyPositionMeanings: 1560
```

The correspondence and theme counts must be printed and captured in the manual-verification handoff rather than hard-coded here, because empty optional descriptive fields are intentionally omitted.

- [ ] **Step 7: Prove migration determinism and source preservation**

Run:

```sh
git diff -- assets/ignore/corpus-source.json
shasum assets/corpus/*.json
yarn workspace api corpus:migrate
shasum assets/corpus/*.json
yarn workspace api test normalize-corpus.test.ts migrate-firestore-corpus.test.ts canonical-validation.test.ts
yarn workspace api build-types
yarn lint
git diff --check
```

Expected:

- no diff for `assets/ignore/corpus-source.json`;
- both checksum listings are identical;
- all tests, type build, lint, and whitespace checks pass;
- `apps/api/corpus/generated/tarot-corpus.jsonl` is unchanged.

### Checkpoint 2 manual verification and stop

Ask the user to review the migration code plus representative records from all seven `assets/corpus/*.json` files. Report the exact entity/theme/warning counts and explicitly call out any unresolved source references.

The user should confirm that:

- the 78 cards and 1,560 bespoke meanings were preserved;
- spread position order and descriptions came from the source rather than guessed names;
- generated themes contain only legacy source language;
- the seeded relationship definitions and five narrative edges match the approved bounded scope;
- sparse content remains visible as coverage gaps rather than invented prose.

Leave all Checkpoint 2 changes uncommitted. Stop. The user validates and commits the files, then confirms the commit and explicitly authorizes Checkpoint 3.

---

## Checkpoint 3: Deterministic Compiler, Generated Artifacts, and Documentation

### Task 3: Load canonical source and compile the composer bundle

**Files:**
- Create: `apps/api/src/corpus/canonical-loader.ts`
- Test: `apps/api/src/corpus/canonical-loader.test.ts`
- Create: `apps/api/src/corpus/compile-corpus.ts`
- Test: `apps/api/src/corpus/compile-corpus.test.ts`

**Interfaces:**
- Produces: `loadCanonicalCorpus(sourceDirectory: string): CanonicalCorpus`.
- Produces: `compileCanonicalCorpus(corpus: CanonicalCorpus): CompiledCorpus`.
- Produces: `ComposerBundle`, `SemanticRagDocument`, `CoverageReport`, and `CompiledCorpus`.

- [ ] **Step 1: Write failing loader tests**

Create a temporary directory with the seven required JSON files and assert that `loadCanonicalCorpus` returns a validated `CanonicalCorpus`. Add failures for a missing file, malformed JSON, and invalid cross-reference; error messages must include the file/path and validator issue code without echoing full source content.

- [ ] **Step 2: Run loader tests and verify the expected failure**

Run:

```sh
yarn workspace api test canonical-loader.test.ts
```

Expected: FAIL because `loadCanonicalCorpus` does not exist.

- [ ] **Step 3: Implement canonical loading**

Read exactly the filenames in `CANONICAL_FILE_NAMES`, parse each independently, assemble `CanonicalCorpus`, and validate it. Throw one `CanonicalCorpusValidationError` containing sorted structured issues when validation fails. Keep file access in this loader; do not add file access to the validator or compiler.

- [ ] **Step 4: Write failing composer-bundle tests**

For a valid compact corpus, assert that the bundle contains:

```ts
export type ComposerBundle = {
    schemaVersion: 1;
    corpusVersion: string;
    cardsById: Record<string, CanonicalCard>;
    spreadsById: Record<string, CanonicalSpread>;
    correspondencesById: Record<string, CanonicalCorrespondence>;
    approvedThemeFragments: ThemeFragment[];
    relationshipRules: RelationshipRule[];
    legacyPositionMeaningsByKey: Record<string, LegacyPositionMeaning>;
};
```

Use the lookup key `${spreadId}:${positionId}:${cardId}:${orientation}`. Assert:

- draft and retired themes are absent;
- all map keys are lexically ordered before serialization;
- compiling the same corpus twice is byte-equivalent;
- `corpusVersion` is a lowercase 64-character SHA-256 digest derived from canonical semantic content, not time or filesystem metadata.

- [ ] **Step 5: Run compiler tests and verify the expected failure**

Run:

```sh
yarn workspace api test compile-corpus.test.ts
```

Expected: FAIL because `compileCanonicalCorpus` does not exist.

- [ ] **Step 6: Implement composer-bundle compilation**

Construct the bundle without mutation or I/O. Canonicalize object keys recursively before hashing and serialization. The digest input must exclude `corpusVersion`, then the resulting digest becomes the active `corpusVersion` included in every compiled output.

Do not evaluate relationship predicates or resolve reading requests in this plan.

### Task 4: Compile discrete selective-RAG documents and coverage

**Files:**
- Modify: `apps/api/src/corpus/compile-corpus.ts`
- Modify: `apps/api/src/corpus/compile-corpus.test.ts`
- Create: `apps/api/src/corpus/bedrock-metadata.ts`
- Test: `apps/api/src/corpus/bedrock-metadata.test.ts`
- Create: `apps/api/src/corpus/coverage-report.ts`
- Test: `apps/api/src/corpus/coverage-report.test.ts`

**Interfaces:**
- Produces: `toBedrockMetadataSidecar(document: SemanticRagDocument): BedrockMetadataSidecar`.
- Produces: `buildCoverageReport(corpus: CanonicalCorpus, corpusVersion: string): CoverageReport`.

- [ ] **Step 1: Write failing semantic-document and sidecar tests**

Define:

```ts
export type SemanticRagDocument = {
    id: string;
    kind: 'correspondence-theme';
    text: string;
    subjectIds: string[];
    topicTags: string[];
    status: 'approved';
    sourceIds: string[];
    schemaVersion: 1;
    corpusVersion: string;
};
```

Assert that one approved theme creates one document whose text is clean prose only. Exact card facts, legacy position meanings, and relationship rules must produce no semantic documents.

Assert that each sidecar uses Bedrock's native shape:

```ts
{
    metadataAttributes: {
        corpusVersion: {
            value: { type: 'STRING', stringValue: '<digest>' },
            includeForEmbedding: false
        },
        documentKind: {
            value: { type: 'STRING', stringValue: 'correspondence-theme' },
            includeForEmbedding: false
        },
        schemaVersion: {
            value: { type: 'NUMBER', numberValue: 1 },
            includeForEmbedding: false
        },
        status: {
            value: { type: 'STRING', stringValue: 'approved' },
            includeForEmbedding: false
        },
        subjectIds: {
            value: { type: 'STRING_LIST', stringListValue: ['element-fire'] },
            includeForEmbedding: false
        },
        topicTags: {
            value: { type: 'STRING_LIST', stringListValue: ['creative-force'] },
            includeForEmbedding: true
        }
    }
}
```

Identity/control fields stay excluded from embeddings. `topicTags` is the only version-1 metadata field included in embedding text; the theme's prose remains the primary embedding content.

- [ ] **Step 2: Write failing coverage tests**

Define a report containing:

```ts
export type CoverageReport = {
    schemaVersion: 1;
    corpusVersion: string;
    totals: {
        cards: number;
        spreads: number;
        correspondences: number;
        approvedThemes: number;
        legacyPositionMeanings: number;
        semanticDocuments: number;
    };
    cardsWithoutCorrespondences: string[];
    correspondencesWithoutApprovedThemes: string[];
    cardsByApprovedThemeCount: Record<string, number>;
    warnings: ValidationIssue[];
};
```

Assert deterministic sorting, zero-count inclusion, and warning preservation. Missing themes must not throw.

- [ ] **Step 3: Run focused tests and verify the expected failures**

Run:

```sh
yarn workspace api test bedrock-metadata.test.ts coverage-report.test.ts compile-corpus.test.ts
```

Expected: FAIL because sidecar and coverage functions do not exist.

- [ ] **Step 4: Implement semantic document, sidecar, and coverage compilation**

Use theme fragment IDs as document IDs. Derive `topicTags` deterministically from subject kind/ID plus normalized non-stopword terms in the fragment ID; do not use an LLM or network request. Sort and deduplicate all list metadata.

Make `compileCanonicalCorpus` return:

```ts
export type CompiledCorpus = {
    composerBundle: ComposerBundle;
    semanticDocuments: SemanticRagDocument[];
    metadataSidecars: Record<string, BedrockMetadataSidecar>;
    coverageReport: CoverageReport;
};
```

### Task 5: Add compiler CLI, generated artifacts, and durable documentation

**Files:**
- Create: `apps/api/scripts/compile-corpus.ts`
- Modify: `apps/api/package.json`
- Generate: `apps/api/corpus/compiled/composer-bundle.json`
- Generate: `apps/api/corpus/compiled/coverage-report.json`
- Generate: `apps/api/corpus/compiled/rag/*.txt`
- Generate: `apps/api/corpus/compiled/rag/*.txt.metadata.json`
- Create: `docs/deterministic_tarot_corpus_architecture.md`
- Modify: `README.md`
- Modify: `apps/api/README.md`
- Modify: `apps/infra/README.md`
- Modify: `docs/bedrock_corpus_operations.md`
- Modify: `docs/bedrock_rag_api_integration.md`
- Modify: `.agents/bedrock-rag-api-reference.md`
- Modify: `.agents/bedrock-rag-change-checklist.md`

**Interfaces:**
- Produces CLI: `yarn workspace api corpus:compile [source-directory] [output-directory]`.
- Default input: `assets/corpus`.
- Default output: `apps/api/corpus/compiled`.

- [ ] **Step 1: Write the compiler writer test before the CLI implementation**

Add a temporary-directory test to `compile-corpus.test.ts` for:

```ts
writeCompiledCorpus(compiled: CompiledCorpus, outputDirectory: string): string[]
```

Assert exact files, two-space JSON with a trailing newline, `.txt` containing only `document.text` plus a trailing newline, matching `.txt.metadata.json` sidecars, lexically sorted returned paths, and deletion of stale files inside the dedicated output directory before writing.

- [ ] **Step 2: Run the writer test and verify the expected failure**

Run:

```sh
yarn workspace api test compile-corpus.test.ts
```

Expected: FAIL because `writeCompiledCorpus` does not exist.

- [ ] **Step 3: Implement the writer and CLI**

Add to `apps/api/package.json`:

```json
"corpus:compile": "node -r ts-node/register ./scripts/compile-corpus.ts"
```

The CLI must load, validate, compile, replace only the dedicated compiled-output directory, and print artifact counts plus coverage gaps. It must exit non-zero without altering the last good output when source validation or compilation fails: write into a sibling temporary directory first, then rename it into place after success.

- [ ] **Step 4: Compile the real canonical source twice and verify reproducibility**

Run:

```sh
yarn workspace api corpus:compile
shasum apps/api/corpus/compiled/composer-bundle.json apps/api/corpus/compiled/coverage-report.json apps/api/corpus/compiled/rag/* | shasum
yarn workspace api corpus:compile
shasum apps/api/corpus/compiled/composer-bundle.json apps/api/corpus/compiled/coverage-report.json apps/api/corpus/compiled/rag/* | shasum
```

Expected: both aggregate checksums match. The composer bundle reports 78 cards, one Celtic Cross spread, and 1,560 legacy position meanings; semantic document count equals approved theme count.

- [ ] **Step 5: Write the durable architecture document**

Document:

- why exact tarot facts bypass semantic retrieval;
- the seven canonical files and their ownership;
- migration versus compilation commands;
- composer bundle lookup key and corpus-version digest;
- why RAG output includes only approved open-ended themes;
- sidecar filter/embedding semantics;
- coverage warning behavior;
- the phased rollout and unchanged legacy rollback path;
- the future ingestion, runtime, and harness plans.

Link it from `README.md#architecture`, `apps/api/README.md`, and `apps/infra/README.md`.

- [ ] **Step 6: Correct current operations and agent guidance without claiming unimplemented deployment behavior**

Update current docs to say:

- `corpus:migrate` is the one-time/repeatable legacy-to-canonical authoring migration;
- editors change `assets/corpus/*.json` after migration, not the ignored legacy export;
- `corpus:compile` produces composer/RAG artifacts but does not upload or ingest them yet;
- the live Knowledge Base still uses `tarot-corpus.jsonl`, fixed-size chunking, and `RetrieveAndGenerate` until the next plans are implemented;
- the new compiled RAG directory must not be manually uploaded into the current data source;
- rollback remains `corpus:normalize` plus the legacy JSONL upload and existing runtime path.

Preserve historical plan/spec files as history; do not rewrite completed historical records.

- [ ] **Step 7: Run full Checkpoint 3 automated verification**

Run:

```sh
yarn workspace api test
yarn workspace api build-types
yarn lint
rg -n "deterministic_tarot_corpus_architecture|corpus:migrate|corpus:compile|tarot-corpus.jsonl|RetrieveAndGenerate" README.md apps docs .agents
git diff --check
git status --short
```

Expected:

- API tests, type build, lint, and diff checks pass;
- new architecture links resolve from the root/API/infra entry points;
- current-state docs clearly distinguish new compiled artifacts from the still-live legacy path;
- no infrastructure or runtime reading files changed;
- all Checkpoint 3 changes remain uncommitted.

### Checkpoint 3 manual verification and stop

Ask the user to inspect:

- a card and spread in `composer-bundle.json`;
- at least two semantic `.txt`/sidecar pairs;
- `coverage-report.json`, including sparse correspondence gaps;
- the new architecture document and updated current-state/rollback guidance;
- the final `git status --short` scope.

The user should run or review the reported checksum comparison and confirm that exact card/position meanings never appear in the semantic RAG output.

Leave all Checkpoint 3 files uncommitted. Stop. The user validates and commits them, then confirms the commit. Only after that confirmation may planning begin for the rewritten ingestion/metadata infrastructure phase.

## Final Acceptance Criteria

- `assets/corpus` contains exactly seven validated, reviewable canonical JSON files at schema version 1.
- Migration preserves all 78 cards, the authoritative ordered Celtic Cross spread, and 1,560 legacy position meanings without modifying the ignored source.
- Invalid required references and unsupported predicates fail before artifacts are replaced.
- Missing optional correspondences and themes appear in coverage output but do not fail compilation.
- Compilation is byte-reproducible and assigns one stable corpus-version digest to all artifacts.
- The composer bundle supports exact keyed lookup; semantic documents contain only approved thematic enrichment.
- Every semantic text object has one matching native Bedrock metadata sidecar.
- The legacy JSONL, current fixed-size Bedrock data source, and runtime `RetrieveAndGenerate` path remain intact as rollback until later phases are verified.
- Durable and agent-facing documentation accurately distinguishes implemented compiler behavior from future AWS ingestion/runtime work.
