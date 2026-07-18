# Deterministic Composer Runtime Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Load the active private composer bundle into the development API, compose exact tarot context deterministically, and use that context in the existing Bedrock `RetrieveAndGenerate` path without changing production.

**Architecture:** Server-only modules under `apps/api/src/composer/` validate a public consumer projection, normalize supported requests, evaluate data-driven rules, and produce a pure `ComposedReadingContext`. Development reads the active S3 release pointer on every Bedrock request, caches one validated immutable bundle, and injects composed context plus an active-version metadata filter into the existing generator; disabled mode preserves the legacy prompt and performs no S3 reads.

**Tech Stack:** TypeScript 6, Node.js 22, Vitest, Express 5, AWS SDK v3 S3 and Bedrock Agent Runtime, AWS CDK v2, Jest CDK assertions.

## Global Constraints

- Keep private corpus sources, real fixtures, facts, rule IDs, thresholds, compiler behavior, and artifact bodies out of public Git, logs, responses, snapshots, and errors.
- Keep reusable runtime composition server-only under `apps/api/src/composer/`; do not put it in `packages/hooks`, `packages/ui`, or `apps/tarot`.
- Keep each evaluator pure and deterministic. Isolate S3, environment access, logging, cache state, and time at explicit boundaries.
- Preserve the existing `ReadingRequest` transport contract and the existing `RetrieveAndGenerate` implementation in this project.
- Support only `single_card` and `celtic_cross`; normalize them internally to `single-card` and `celtic-cross`.
- Use only predicate operators `eq`, `in`, `all`, `any`, and `not`, and only allowlisted `card.*` fields.
- Apply initial caps of two themes per card, four named-pair results, and three whole-spread results.
- Read `state/dev/active-release.json` on every enabled Bedrock request; cache one fully validated immutable release by complete pointer identity.
- Reject composer domain errors with a safe typed 400 and artifact/configuration failures with a safe retryable typed 503. Never silently use legacy context or an old cached release while enabled.
- Development deploys with composer mode enabled. Production deploys disabled and receives no composer S3 permission.
- Keep deployment and production changes outside a checkpoint unless the user gives exact-target authorization.
- After each checkpoint's automated verification, leave changes uncommitted. The user validates and commits the checkpoint before authorizing the next one.

---

## File Structure

### Composer domain

- `apps/api/src/composer/constants.ts`: public schema versions, supported spread aliases, limits, operator/type allowlists, S3 keys, and size bounds.
- `apps/api/src/composer/contracts.ts`: narrow public consumer projection and composed-output types.
- `apps/api/src/composer/errors.ts`: safe domain and availability error classes.
- `apps/api/src/composer/test-fixture.ts`: invented, sanitized bundle and request builders used only by public tests.
- `apps/api/src/composer/predicate-evaluator.ts`: allowlisted recursive card predicate evaluation.
- `apps/api/src/composer/reading-normalizer.ts`: exact card/spread/position normalization and domain validation.
- `apps/api/src/composer/card-composer.ts`: card-local exact meaning and theme selection.
- `apps/api/src/composer/relationship-composer.ts`: declared named-edge and allowlisted whole-spread rule evaluation.
- `apps/api/src/composer/compose-reading.ts`: pure composition entry point and deterministic ordering/caps.

### Artifact loading

- `apps/api/src/composer/artifact-validator.ts`: pointer, manifest, and composer-bundle consumer validation.
- `apps/api/src/composer/s3-artifact-reader.ts`: narrowly injected S3 `GetObject` byte reads.
- `apps/api/src/composer/bundle-loader.ts`: per-request pointer reads, immutable bundle integrity checks, one-entry cache, and same-pointer single-flight.
- `apps/api/src/config.ts`: typed composer mode and required enabled-mode identities.
- `apps/infra/lib/bedrock-rag-stack.ts`: expose the owned corpus bucket and selected data source to the stage.
- `apps/infra/lib/api-stack.ts`: development environment variables and exact read-only S3 IAM.
- `apps/infra/lib/simple-tarot-stage.ts`: strong cross-stack composer identity wiring.

### Runtime integration

- `apps/api/src/composer/prompt-builder.ts`: precedence-ordered controlled-text rendering.
- `apps/api/src/composer/runtime.ts`: enabled-mode load/compose orchestration and safe aggregate logging.
- `apps/api/src/bedrock/retrieval-filter.ts`: exact active-release metadata filter.
- `apps/api/src/bedrock/types.ts` and `apps/api/src/bedrock/bedrock-client.ts`: optional retrieval-filter input while retaining `RetrieveAndGenerate`.
- `apps/api/src/routes/readings.ts`: disabled/enabled branch, dependency injection, safe 400/503 flow, and response metadata.
- `apps/api/src/readings/contracts.ts`, `response-mapper.ts`, and persistence contracts/store tests: additive aggregate composer metadata only.
- `apps/api/src/errors.ts`: safe composer error mapping.

### Durable documentation

- `docs/deterministic-composer-runtime.md`: resulting public architecture, rollout, operations, privacy, and rollback.
- `README.md`, `apps/api/README.md`, `apps/infra/README.md`: discoverability and current-state summaries.
- `docs/private-corpus-artifact-boundary.md`, `docs/bedrock_corpus_operations.md`, `docs/bedrock_rag_api_integration.md`: implemented handoff and operational contract.
- `.agents/bedrock-rag-api-reference.md`, `.agents/bedrock-rag-change-checklist.md`: agent-facing current state.

---

## Checkpoint 1: Pure Public Consumer and Deterministic Composition

### Task 1: Define the sanitized public contract and errors

**Files:**
- Create: `apps/api/src/composer/constants.ts`
- Create: `apps/api/src/composer/contracts.ts`
- Create: `apps/api/src/composer/errors.ts`
- Create: `apps/api/src/composer/test-fixture.ts`
- Test: `apps/api/src/composer/contracts.test.ts`

**Interfaces:**
- Produces: `ComposerBundle`, `ComposerCard`, `ComposerSpread`, `CorpusPredicate`, `RelationshipRule`, `ComposedReadingContext`, `ComposerDomainError`, and `ComposerUnavailableError`.
- Consumes: existing `ReadingRequest` from `apps/api/src/readings/contracts.ts`.

- [ ] **Step 1: Write the failing contract tests**

Create a sanitized fixture containing two invented cards, one invented two-position spread, invented correspondence/theme text, one named edge, and one rule of each supported whole-spread type. Assert that the fixture satisfies `ComposerBundle`, contains no real tarot names, and that both error classes expose only stable public fields:

```ts
expect(sanitizedComposerBundle.schemaVersion).toBe(1);
expect(JSON.stringify(sanitizedComposerBundle)).not.toMatch(/Fool|Celtic|Wands/);
expect(new ComposerDomainError('INVALID_CARD_SELECTION').status).toBe(400);
expect(new ComposerUnavailableError('INVALID_COMPOSER_ARTIFACT').retryable).toBe(true);
```

- [ ] **Step 2: Run the focused test and confirm the missing-module failure**

Run: `yarn workspace api test --run src/composer/contracts.test.ts`

Expected: FAIL because the composer contract, fixture, and error modules do not exist.

- [ ] **Step 3: Define exact public constants and contract types**

Use reusable constants rather than inline strings:

```ts
export const COMPOSER_SCHEMA_VERSION = 1 as const;
export const CORPUS_SCHEMA_VERSION = 1 as const;
export const MAX_THEMES_PER_CARD = 2;
export const MAX_NAMED_PAIR_RESULTS = 4;
export const MAX_WHOLE_SPREAD_RESULTS = 3;
export const SUPPORTED_PREDICATE_OPERATORS = ['eq', 'in', 'all', 'any', 'not'] as const;
export const SUPPORTED_RELATIONSHIP_TYPES = [
    'element-dominance',
    'suit-dominance',
    'major-arcana-weight',
    'number-repetition',
    'orientation-balance',
    'named-position-edge'
] as const;
```

Define the narrow structural projection from the approved spec. `ComposerBundle` must contain `schemaVersion`, `corpusVersion`, `cardsById`, `spreadsById`, `correspondencesById`, `approvedThemeFragments`, `relationshipRules`, and `legacyPositionMeaningsByKey`. Do not include compiler provenance beyond the `sourceIds` arrays already present in the transport contract, and never return those arrays from composition.

Define the composed output exactly:

```ts
export type ComposedReadingContext = {
    corpusVersion: string;
    spreadMode: 'single-card' | 'celtic-cross';
    cards: ComposedCardContext[];
    namedPairResults: RelationshipResult[];
    wholeSpreadResults: RelationshipResult[];
};
```

`RelationshipResult` contains `id`, `ruleId`, `priority`, `fact`, and `supports`; `ruleId` and `fact` are internal-only and must not appear in response contracts.

Define the neighboring pure interfaces in the same contract module so later tasks use one vocabulary:

```ts
export type PredicateValue = string | number | boolean;

export type CardPredicateInput = {
    card: ComposerCard;
    correspondencesById: Record<string, ComposerCorrespondence>;
    orientation: 'upright' | 'reversed';
};

export type NormalizedComposerCard = {
    card: ComposerCard;
    orientation: 'upright' | 'reversed';
    presentationPosition: string;
    position?: SpreadPosition;
};

export type NormalizedComposerRequest = {
    spreadMode: 'single-card' | 'celtic-cross';
    spread?: ComposerSpread;
    cards: NormalizedComposerCard[];
};
```

- [ ] **Step 4: Add safe typed errors**

```ts
export class ComposerDomainError extends Error {
    readonly status = 400;
    constructor(readonly code: 'INVALID_CARD_SELECTION' | 'INVALID_COMPOSER_SPREAD') {
        super('The reading selection is not supported by the active tarot corpus.');
        this.name = 'ComposerDomainError';
    }
}

export class ComposerUnavailableError extends Error {
    readonly code = 'COMPOSER_UNAVAILABLE';
    readonly retryable = true;
    readonly status = 503;
    constructor(readonly reason: string, options?: ErrorOptions) {
        super('Tarot reading context is temporarily unavailable.', options);
        this.name = 'ComposerUnavailableError';
    }
}
```

The `reason` is for in-process classification and tests only; do not log or return private values with it.

- [ ] **Step 5: Run contract tests and the API type build**

Run:

```sh
yarn workspace api test --run src/composer/contracts.test.ts
yarn workspace api build-types
```

Expected: PASS with the invented fixture compiling against the public projection.

### Task 2: Implement the recursive predicate evaluator

**Files:**
- Create: `apps/api/src/composer/predicate-evaluator.ts`
- Test: `apps/api/src/composer/predicate-evaluator.test.ts`

**Interfaces:**
- Consumes: `ComposerCard`, `ComposerCorrespondence`, `CorpusPredicate`, orientation.
- Produces: `matchesCardPredicate(input: CardPredicateInput): boolean`.

- [ ] **Step 1: Write table-driven failing tests for every operator and field boundary**

Cover `eq`, `in`, nested `all`, nested `any`, `not`, explicit card identity, primitive attributes, correspondence-kind resolution, unknown fields, arbitrary nested paths, malformed operands, and deterministic repeated evaluation. Representative assertions:

```ts
expect(matchesCardPredicate(input({ eq: [{ field: 'card.arcana' }, 'invented'] }))).toBe(true);
expect(matchesCardPredicate(input({ in: [{ field: 'card.element' }, ['ember', 'mist']] }))).toBe(true);
expect(matchesCardPredicate(input({ eq: [{ field: 'card.__proto__' }, 'x'] }))).toBe(false);
expect(matchesCardPredicate(input({ eq: [{ field: 'request.question' }, 'x'] }))).toBe(false);
```

- [ ] **Step 2: Run the test and confirm it fails because the evaluator is absent**

Run: `yarn workspace api test --run src/composer/predicate-evaluator.test.ts`

Expected: FAIL with a missing import.

- [ ] **Step 3: Implement closed field resolution and recursive evaluation**

Use an explicit switch, never arbitrary path traversal:

```ts
const valueFor = (field: string, input: CardPredicateInput): PredicateValue | undefined => {
    if (!/^card\.[A-Za-z][A-Za-z0-9]*$/.test(field)) return undefined;
    const attributeName = field.slice('card.'.length);
    switch (field) {
        case 'card.id': return input.card.id;
        case 'card.index': return input.card.index;
        case 'card.name': return input.card.name;
        case 'card.title': return input.card.title;
        case 'card.arcana': return input.card.arcana;
        case 'card.orientation': return input.orientation;
        case 'card.element':
        case 'card.suit':
        case 'card.number':
        case 'card.path':
        case 'card.alphabet':
        case 'card.sephiroth':
            return correspondenceValueFor(field.slice('card.'.length), input);
        default:
            return Object.hasOwn(input.card.attributes, attributeName)
                ? input.card.attributes[attributeName]
                : undefined;
    }
};
```

The namespace pattern permits exactly one `card.*` segment and prevents arbitrary traversal. The fallback reads only an own primitive attribute; arrays, records, unknown fields, and unsupported correspondence kinds do not match. Return `false` for unknown shapes or values. Implement recursion without mutation.

- [ ] **Step 4: Run evaluator tests, all composer tests, and type build**

Run:

```sh
yarn workspace api test --run src/composer/predicate-evaluator.test.ts
yarn workspace api test --run src/composer
yarn workspace api build-types
```

Expected: PASS.

### Task 3: Normalize supported requests and compose card-local context

**Files:**
- Create: `apps/api/src/composer/reading-normalizer.ts`
- Create: `apps/api/src/composer/card-composer.ts`
- Test: `apps/api/src/composer/reading-normalizer.test.ts`
- Test: `apps/api/src/composer/card-composer.test.ts`

**Interfaces:**
- Produces: `normalizeComposerRequest(request, bundle): NormalizedComposerRequest`.
- Produces: `composeCardContexts(normalized, bundle): ComposedCardContext[]`.

- [ ] **Step 1: Write failing normalization tests**

Cover:

- `single_card` requires exactly one card, resolves by index, requires exact canonical name, preserves presentation position, and emits no canonical position.
- `celtic_cross` maps to bundle spread `celtic-cross`, requires the bundle's exact item count and ordered positions, and rejects missing, duplicate, unknown, or out-of-order positions.
- Unsupported spread, unknown index, and name/index mismatch throw `ComposerDomainError` without including bundle content in the message.

- [ ] **Step 2: Run the normalization tests and confirm the missing implementation**

Run: `yarn workspace api test --run src/composer/reading-normalizer.test.ts`

Expected: FAIL with a missing module.

- [ ] **Step 3: Implement exact normalization**

Index cards once per call using bundle values, reject duplicate card indexes in the bundle, and compare names with strict equality after transport trimming. Do not fuzzy-match names or positions. Use the bundle's position array sorted by `order` only after verifying the declared orders are unique consecutive integers.

- [ ] **Step 4: Write failing card-composition tests**

Assert canonical card identity/description, selected orientation keyword array, optional Celtic Cross position definition, exact meaning lookup, missing-meaning fallback, predicate-selected approved themes, subject-order ranking, theme-ID tiebreak, and cap of two.

The exact meaning key is constructed by a helper:

```ts
export const positionMeaningKeyFor = (
    spreadId: string,
    positionId: string,
    cardId: string,
    orientation: 'upright' | 'reversed'
): string => `${spreadId}:${positionId}:${cardId}:${orientation}`;
```

- [ ] **Step 5: Implement card-local composition**

Filter themes to `kind === 'correspondence-theme'` and `status === 'approved'`, require a matching subject referenced by the card, then call `matchesCardPredicate`. Sort by the earliest matching subject's index in `card.correspondenceIds`, then `theme.id`, and take `MAX_THEMES_PER_CARD`. Omit absent optional fields instead of inventing text.

- [ ] **Step 6: Run focused and aggregate composer tests**

Run:

```sh
yarn workspace api test --run src/composer/reading-normalizer.test.ts src/composer/card-composer.test.ts
yarn workspace api test --run src/composer
yarn workspace api build-types
```

Expected: PASS.

### Task 4: Compose declared relationships and the complete pure result

**Files:**
- Create: `apps/api/src/composer/relationship-composer.ts`
- Create: `apps/api/src/composer/compose-reading.ts`
- Test: `apps/api/src/composer/relationship-composer.test.ts`
- Test: `apps/api/src/composer/compose-reading.test.ts`

**Interfaces:**
- Produces: `composeRelationshipResults(normalized, bundle): Pick<ComposedReadingContext, 'namedPairResults' | 'wholeSpreadResults'>`.
- Produces: `composeReadingContext(request, bundle): ComposedReadingContext`.

- [ ] **Step 1: Write failing named-pair tests**

Assert that only bundle-declared narrative edges are considered, only `named-position-edge` rules with the same edge ID match, supports identify the declared from/to positions and card IDs, priority sorts descending, stable ID breaks ties, and results cap at four. Assert that undeclared card pairs are never compared.

- [ ] **Step 2: Write failing whole-spread tests**

Use invented values to cover:

- element and suit dominance with condition `minimumCount`
- Major Arcana weight
- repeated number correspondence
- upright and reversed orientation balance
- value-qualified IDs for multi-value matches
- priority and stable-ID ordering
- cap of three
- no relationship results for single-card mode

- [ ] **Step 3: Run the relationship tests and confirm failure**

Run: `yarn workspace api test --run src/composer/relationship-composer.test.ts`

Expected: FAIL because the relationship composer does not exist.

- [ ] **Step 4: Implement closed relationship dispatch**

Dispatch by `rule.ruleType` and require the condition `type` to agree. Ignore unsupported or mismatched pairs rather than interpreting them. Use explicit grouping maps populated in normalized card order. Stable result IDs use public structural identities only:

```ts
const stableResultId = (ruleId: string, qualifier?: string): string =>
    qualifier ? `${ruleId}:${qualifier}` : ruleId;

const byPriorityThenId = (left: RelationshipResult, right: RelationshipResult): number =>
    right.priority - left.priority || left.id.localeCompare(right.id);
```

- [ ] **Step 5: Implement the pure composition entry point**

```ts
export function composeReadingContext(
    request: ReadingRequest,
    bundle: ComposerBundle
): ComposedReadingContext {
    const normalized = normalizeComposerRequest(request, bundle);
    const relationships = composeRelationshipResults(normalized, bundle);
    return {
        corpusVersion: bundle.corpusVersion,
        spreadMode: normalized.spreadMode,
        cards: composeCardContexts(normalized, bundle),
        ...relationships
    };
}
```

- [ ] **Step 6: Verify deterministic output and all API tests**

Run:

```sh
yarn workspace api test --run src/composer
yarn workspace api test
yarn workspace api build-types
yarn lint
```

Expected: PASS; repeated composition of the same request and fixture is deeply equal.

### Checkpoint 1 manual gate

Review only the new `apps/api/src/composer/` pure domain modules and tests. Confirm that fixtures and snapshots contain invented content, the evaluators use closed dispatch/allowlists, single-card and Celtic Cross behavior match the spec, arbitrary pairs are not evaluated, and no AWS or environment access appears in pure modules.

Leave all checkpoint files uncommitted. Stop. The user validates and commits them, then confirms the commit and authorizes Checkpoint 2.

---

## Checkpoint 2: Active-Bundle Loader, Cache, Configuration, and IAM

### Task 5: Validate the active pointer, manifest, and bundle projection

**Files:**
- Modify: `apps/api/src/composer/constants.ts`
- Create: `apps/api/src/composer/artifact-validator.ts`
- Test: `apps/api/src/composer/artifact-validator.test.ts`

**Interfaces:**
- Produces: `parseActiveReleaseState`, `parseReleaseManifest`, and `parseComposerBundle`.
- Produces constants `ACTIVE_RELEASE_KEY`, `COMPOSER_BUNDLE_PATH`, `MAX_COMPOSER_BUNDLE_BYTES`, and `CORPUS_VERSION_PATTERN`.

- [ ] **Step 1: Write failing validator tests**

Cover exact schema versions; `dev`; lowercase 64-character SHA; `releases/<version>/`; configured Knowledge Base/data-source equality; non-empty job ID; valid ISO timestamp; safe relative artifact paths; matching manifest/bundle versions; exactly one runtime object named `composer-bundle.json`; JSON composer role/media type; positive byte size no greater than 2 MiB; lowercase checksum; required maps/arrays/primitives; allowlisted predicate operators and relationship types; and rejection of functions/executable values.

Use only invented fixture data. For every invalid case, assert `ComposerUnavailableError` and the same safe public message.

- [ ] **Step 2: Run the tests and confirm failure**

Run: `yarn workspace api test --run src/composer/artifact-validator.test.ts`

Expected: FAIL with missing validator exports.

- [ ] **Step 3: Implement defensive record readers and exact validation**

Do not cast parsed JSON directly. Build small helpers such as `expectRecord`, `expectString`, `expectArray`, `expectExactKeys`, and `expectSafeRelativePath`. Reject leading slash, backslash, empty segments, `.`/`..`, and percent-encoded traversal. Validate only the consumer projection; do not reproduce private compiler validation.

- [ ] **Step 4: Run validator and composer regression tests**

Run:

```sh
yarn workspace api test --run src/composer/artifact-validator.test.ts
yarn workspace api test --run src/composer
yarn workspace api build-types
```

Expected: PASS.

### Task 6: Implement bounded S3 reads and one-entry cache

**Files:**
- Create: `apps/api/src/composer/s3-artifact-reader.ts`
- Create: `apps/api/src/composer/bundle-loader.ts`
- Test: `apps/api/src/composer/s3-artifact-reader.test.ts`
- Test: `apps/api/src/composer/bundle-loader.test.ts`

**Interfaces:**
- Produces: `ComposerArtifactReader.readObject(key, maximumBytes): Promise<Uint8Array>`.
- Produces: `createComposerBundleLoader(options).loadActiveBundle(): Promise<LoadedComposerBundle>`.
- `LoadedComposerBundle = { bundle: ComposerBundle; pointer: ActiveReleaseState }`.

- [ ] **Step 1: Write failing bounded-reader tests**

Inject `Pick<S3Client, 'send'>`. Assert exact bucket/key, missing body mapping, `ContentLength` early rejection, streamed size rejection, and successful byte preservation. Never log or return a body.

- [ ] **Step 2: Implement the S3 reader**

Use `GetObjectCommand`; read bytes with an explicit accumulating bound and convert all SDK/read errors to `ComposerUnavailableError` with a causal error. The reader exposes no list/write operation.

- [ ] **Step 3: Write failing loader/cache tests**

Assert:

- every call reads `state/dev/active-release.json`
- first pointer reads manifest then bundle
- byte size and SHA-256 are checked before JSON parse
- matching pointer returns the same validated snapshot without immutable rereads
- changed pointer fully loads before replacing cache
- a failed changed pointer never returns the old bundle
- concurrent same-pointer misses share one manifest/bundle promise
- different pointer identities do not share in-flight work
- the loader checks configured Knowledge Base and data source
- S3, parse, checksum, size, and compatibility failures become retryable 503 errors

- [ ] **Step 4: Implement the loader**

Keep cache and in-flight state inside the factory closure:

```ts
export type ComposerBundleLoader = {
    loadActiveBundle(): Promise<LoadedComposerBundle>;
};

export type ComposerBundleLoaderOptions = {
    dataSourceId: string;
    knowledgeBaseId: string;
    reader: ComposerArtifactReader;
};

export function createComposerBundleLoader(options: ComposerBundleLoaderOptions): ComposerBundleLoader {
    let cached: { identity: string; value: LoadedComposerBundle } | undefined;
    const inFlight = new Map<string, Promise<LoadedComposerBundle>>();

    return {
        async loadActiveBundle(): Promise<LoadedComposerBundle> {
            const pointerBytes = await options.reader.readObject(
                ACTIVE_RELEASE_KEY,
                MAX_COMPOSER_BUNDLE_BYTES
            );
            const pointer = parseActiveReleaseState(JSON.parse(decode(pointerBytes)), {
                dataSourceId: options.dataSourceId,
                knowledgeBaseId: options.knowledgeBaseId
            });
            const identity = stablePointerIdentity(pointer);
            if (cached?.identity === identity) return cached.value;

            const existing = inFlight.get(identity);
            if (existing) return existing;

            const pending = loadImmutableRelease(options.reader, pointer)
                .then(value => {
                    cached = { identity, value };
                    return value;
                })
                .finally(() => inFlight.delete(identity));
            inFlight.set(identity, pending);
            return pending;
        }
    };
}
```

Define `decode(bytes)` with a fatal UTF-8 `TextDecoder`, `stablePointerIdentity(pointer)` by serializing all eight validated pointer fields in declared order, and `loadImmutableRelease(reader, pointer)` in the same module. That function reads `${pointer.releasePrefix}manifest.json`, validates it, locates its single composer entry, reads `${pointer.releasePrefix}composer-bundle.json` with the entry's 2 MiB-or-lower byte bound, checks exact byte length and `node:crypto` SHA-256, then parses and validates the bundle. Wrap UTF-8 decoding, JSON parsing, hashing, and reader failures at the loader boundary so any non-`ComposerUnavailableError` becomes one with a safe reason enum and causal error. Replace `cached` only after all those operations pass.

- [ ] **Step 5: Run loader tests and all API tests**

Run:

```sh
yarn workspace api test --run src/composer/s3-artifact-reader.test.ts src/composer/bundle-loader.test.ts
yarn workspace api test
yarn workspace api build-types
```

Expected: PASS.

### Task 7: Add composer runtime configuration

**Files:**
- Modify: `apps/api/src/config.ts`
- Modify: `apps/api/src/config.test.ts`

**Interfaces:**
- Produces: `ComposerRuntimeConfig = { mode: 'disabled' } | { mode: 'enabled'; bucketName: string; dataSourceId: string }` on `ApiConfig.composer`.

- [ ] **Step 1: Write failing config tests**

Assert local Bedrock mode always produces composer disabled and needs no composer variables; Bedrock mode defaults disabled; explicit disabled ignores bucket/data-source values; enabled requires `BEDROCK_CORPUS_BUCKET` and `BEDROCK_DATA_SOURCE_ID`; and any other `COMPOSER_RUNTIME_MODE` value throws a safe startup configuration error.

- [ ] **Step 2: Run config tests and confirm expected failure**

Run: `yarn workspace api test --run src/config.test.ts`

Expected: FAIL because `ApiConfig` has no composer field.

- [ ] **Step 3: Implement config parsing after Bedrock parsing**

```ts
const getComposerRuntimeConfig = (
    env: typeof process.env,
    bedrock: BedrockRuntimeConfig
): ComposerRuntimeConfig => {
    if (bedrock.mode === 'local' || env.COMPOSER_RUNTIME_MODE === undefined || env.COMPOSER_RUNTIME_MODE === 'disabled') {
        return { mode: 'disabled' };
    }
    if (env.COMPOSER_RUNTIME_MODE !== 'enabled') {
        throw new Error(`Invalid COMPOSER_RUNTIME_MODE value "${env.COMPOSER_RUNTIME_MODE}".`);
    }
    const bucketName = nonEmpty(env.BEDROCK_CORPUS_BUCKET);
    const dataSourceId = nonEmpty(env.BEDROCK_DATA_SOURCE_ID);
    const missing = [
        bucketName ? undefined : 'BEDROCK_CORPUS_BUCKET',
        dataSourceId ? undefined : 'BEDROCK_DATA_SOURCE_ID'
    ].filter((value): value is string => value !== undefined);
    if (missing.length > 0) {
        throw new Error(`Missing composer runtime environment variables: ${missing.join(', ')}`);
    }
    if (!bucketName || !dataSourceId) {
        throw new Error('Invalid composer runtime configuration.');
    }
    return { bucketName, dataSourceId, mode: 'enabled' };
};
```

Return `{ ... , bedrock, composer: getComposerRuntimeConfig(env, bedrock) }` from one parsed Bedrock value; do not read `process.env` from composer domain modules.

- [ ] **Step 4: Run configuration, API, and type tests**

Run:

```sh
yarn workspace api test --run src/config.test.ts
yarn workspace api test
yarn workspace api build-types
```

Expected: PASS.

### Task 8: Wire development-only identities and least-privilege IAM

**Files:**
- Modify: `apps/infra/lib/bedrock-rag-stack.ts`
- Modify: `apps/infra/lib/api-stack.ts`
- Modify: `apps/infra/lib/simple-tarot-stage.ts`
- Modify: `apps/infra/test/api-stack.test.ts`
- Modify: `apps/infra/test/simple-tarot-stage.test.ts`
- Modify: `apps/infra/test/bedrock-rag-stack.test.ts`

**Interfaces:**
- `BedrockRagStack` produces public readonly `corpusBucket` and `dataSource` constructs.
- `ApiStackProps` consumes `corpusBucket` and `dataSource` from the same stage.

- [ ] **Step 1: Write failing development/production infrastructure assertions**

For development, assert Lambda variables:

```ts
expect(variables.COMPOSER_RUNTIME_MODE).toBe('enabled');
expect(JSON.stringify(variables.BEDROCK_CORPUS_BUCKET)).toContain('SimpleTarotBedrockRag-dev');
expect(JSON.stringify(variables.BEDROCK_DATA_SOURCE_ID)).toContain('SimpleTarotBedrockRag-dev');
```

Assert IAM contains only `s3:GetObject` resources ending in:

```text
/state/dev/active-release.json
/releases/*/manifest.json
/releases/*/composer-bundle.json
```

Assert no `s3:ListBucket`, `s3:PutObject`, `s3:DeleteObject`, or `s3:CopyObject` is granted for the corpus bucket. For production, assert `COMPOSER_RUNTIME_MODE=disabled`, no bucket/data-source variables, and no composer S3 statement.

- [ ] **Step 2: Run focused infrastructure tests and confirm failure**

Run: `yarn workspace infra test --runInBand api-stack.test.ts simple-tarot-stage.test.ts bedrock-rag-stack.test.ts`

Expected: FAIL because composer identities and grants are absent.

- [ ] **Step 3: Expose same-stage constructs and wire strong references**

Assign the existing corpus bucket and data source to readonly stack properties. Pass both through `SimpleTarotStage`. In `ApiStack`, construct environment variables conditionally from `props.config.environmentName` and add a direct policy statement only in development:

```ts
apiFunction.addToRolePolicy(new iam.PolicyStatement({
    actions: ['s3:GetObject'],
    resources: [
        props.corpusBucket.arnForObjects('state/dev/active-release.json'),
        props.corpusBucket.arnForObjects('releases/*/manifest.json'),
        props.corpusBucket.arnForObjects('releases/*/composer-bundle.json')
    ]
}));
```

Do not call `grantRead`, because the contract forbids accidentally adding list or broader read permissions.

- [ ] **Step 4: Run infrastructure tests, builds, and exact no-deploy synthesis checks**

Run:

```sh
yarn workspace infra test --runInBand
yarn workspace infra build-types
yarn workspace api build-types
yarn lint
```

Expected: PASS. No deployment occurs in this checkpoint.

### Checkpoint 2 manual gate

Review loader failure behavior, exact per-request pointer read semantics, checksum-before-parse, one-entry/single-flight cache, environment parsing, strong same-stage references, development-only variables, and the exact three-object-pattern `s3:GetObject` policy. Confirm production has no composer identities or read grant.

Leave all checkpoint files uncommitted. Stop. The user validates and commits them, then confirms the commit and authorizes Checkpoint 3.

---

## Checkpoint 3: Prompt, Route, Filter, Metadata, and Rollback Path

### Task 9: Render the precedence-ordered composed prompt

**Files:**
- Create: `apps/api/src/composer/prompt-builder.ts`
- Test: `apps/api/src/composer/prompt-builder.test.ts`
- Preserve: `apps/api/src/readings/prompt-builder.ts`

**Interfaces:**
- Produces: `buildComposedReadingPrompt(request, context): string`.
- Keeps: `buildReadingPrompt(request): string` byte-for-byte behavior for disabled rollback.

- [ ] **Step 1: Write failing prompt tests**

Assert section order: authority/non-contradiction, corpus/spread, ordered cards, named pairs, whole spread, user intent, response shape. Assert plain controlled text, no `JSON.stringify`, omission of empty optional sections, deterministic repeated output, and no `sourceIds`/private rule IDs. Snapshot only invented fixture content.

- [ ] **Step 2: Run the test and confirm missing builder failure**

Run: `yarn workspace api test --run src/composer/prompt-builder.test.ts`

Expected: FAIL with a missing import.

- [ ] **Step 3: Implement explicit section renderers**

Use focused pure functions such as `renderCard`, `renderRelationship`, and `nonEmptySections`. Begin with an authority statement that exact composed facts override retrieved prose; end with the current mobile response-shape instructions. Do not modify the legacy builder.

- [ ] **Step 4: Verify both prompt builders**

Run: `yarn workspace api test --run src/composer/prompt-builder.test.ts src/readings/prompt-builder.test.ts`

Expected: PASS, including unchanged legacy snapshots/assertions.

### Task 10: Add the exact active-version Bedrock filter

**Files:**
- Create: `apps/api/src/bedrock/retrieval-filter.ts`
- Test: `apps/api/src/bedrock/retrieval-filter.test.ts`
- Modify: `apps/api/src/bedrock/types.ts`
- Modify: `apps/api/src/bedrock/bedrock-client.ts`
- Modify: `apps/api/src/bedrock/bedrock-client.test.ts`

**Interfaces:**
- Produces: `activeCorpusFilterFor(corpusVersion): RetrievalFilter`.
- Changes: `generateReading(prompt, options?: { retrievalFilter?: RetrievalFilter }): Promise<GeneratedReading>`.

- [ ] **Step 1: Write failing exact-filter tests**

Assert the SDK structure is exactly one `andAll` with equality filters for `corpusVersion`, `status = approved`, and `documentKind = correspondence-theme`. Assert lowercase SHA validation happens before filter construction.

- [ ] **Step 2: Extend Bedrock client tests before implementation**

Add one test proving supplied filter appears at `retrievalConfiguration.vectorSearchConfiguration.filter`, and one proving omitted options preserve the existing unfiltered `RetrieveAndGenerateCommand` shape.

- [ ] **Step 3: Run focused tests and confirm failure**

Run: `yarn workspace api test --run src/bedrock/retrieval-filter.test.ts src/bedrock/bedrock-client.test.ts`

Expected: FAIL because the filter helper/options do not exist.

- [ ] **Step 4: Implement optional filter plumbing without replacing the Bedrock call**

```ts
vectorSearchConfiguration: {
    numberOfResults: config.retrievalResults,
    ...(options.retrievalFilter ? { filter: options.retrievalFilter } : {})
}
```

Keep `RetrieveAndGenerateCommand`, citation mapping, retries, and model configuration unchanged.

- [ ] **Step 5: Run Bedrock tests and API build**

Run:

```sh
yarn workspace api test --run src/bedrock
yarn workspace api build-types
```

Expected: PASS.

### Task 11: Add enabled runtime orchestration and safe error mapping

**Files:**
- Create: `apps/api/src/composer/runtime.ts`
- Test: `apps/api/src/composer/runtime.test.ts`
- Modify: `apps/api/src/errors.ts`
- Modify: `apps/api/src/errors.test.ts`
- Modify: `apps/api/src/routes/readings.ts`
- Modify: `apps/api/src/routes/readings.test.ts`

**Interfaces:**
- Produces: `ComposerRuntime.compose(request, requestId?): Promise<ComposedReadingContext>`.
- Adds injected route option `composerRuntime?: ComposerRuntime`.
- Extends generation input with optional retrieval filter.

- [ ] **Step 1: Write failing runtime tests**

Assert load then pure compose, one bundle snapshot per request, and safe logs containing only request ID, mode, corpus version, cache phase/hit, load duration, card count, aggregate relationship counts, and prompt length. Spy on logger calls and assert they exclude question, card names, themes, facts, rule IDs, prompts, object bodies, and non-contract paths.

- [ ] **Step 2: Write failing error-mapping tests**

Assert `ComposerDomainError` maps to:

```json
{"code":"INVALID_COMPOSER_REQUEST","message":"The reading selection is not supported by the active tarot corpus."}
```

with status 400, and `ComposerUnavailableError` maps to:

```json
{"code":"COMPOSER_UNAVAILABLE","message":"Tarot reading context is temporarily unavailable.","retryable":true}
```

with status 503. The response must not contain `reason`, cause, object key, checksum, facts, or rule IDs.

- [ ] **Step 3: Write route integration tests before changing the handler**

Cover:

- disabled mode calls the existing prompt builder and unfiltered generator, with no composer call
- enabled mode composes before generation, uses composed prompt and exact active filter
- domain invalid maps to 400 and does not call Bedrock
- loader unavailable maps to 503 and does not call Bedrock
- local mode remains disabled and does not create an S3 client
- enabled mode never falls back to the legacy prompt after an error

- [ ] **Step 4: Run focused tests and confirm failures**

Run: `yarn workspace api test --run src/composer/runtime.test.ts src/errors.test.ts src/routes/readings.test.ts`

Expected: FAIL on missing orchestration and new expectations.

- [ ] **Step 5: Implement default runtime construction only for enabled Bedrock config**

In `defaultOptions`, create `S3Client`, reader, loader, and runtime only when `config.bedrock.mode === 'bedrock' && config.composer.mode === 'enabled'`. Pass the loaded corpus version to `activeCorpusFilterFor`. In disabled mode, retain `buildReadingPrompt` and omit generator options.

Keep transport validation before loading. Catch composer domain and availability failures through the shared Express error mapping; never expose the bundle.

- [ ] **Step 6: Run route, error, composer, and API tests**

Run:

```sh
yarn workspace api test --run src/composer src/errors.test.ts src/routes/readings.test.ts
yarn workspace api test
yarn workspace api build-types
```

Expected: PASS.

### Task 12: Add aggregate response and persistence metadata

**Files:**
- Modify: `apps/api/src/readings/contracts.ts`
- Modify: `apps/api/src/readings/response-mapper.ts`
- Modify: `apps/api/src/readings/response-mapper.test.ts`
- Modify: `apps/api/src/readings/persistence/contracts.ts`
- Modify: `apps/api/src/readings/persistence/reading-history-store.ts`
- Modify: `apps/api/src/readings/persistence/reading-history-store.test.ts`
- Modify: `apps/api/src/routes/readings.ts`
- Modify: `apps/api/src/routes/readings.test.ts`

**Interfaces:**
- Produces: `ComposerResponseMetadata` with `composerMode`, optional `corpusVersion`, optional `namedPairCount`, and optional `wholeSpreadCount`.
- Extends `ReadingResponse.metadata` and `GenerationMetadata` additively.

- [ ] **Step 1: Write failing mapper and persistence tests**

Assert disabled responses contain `composerMode: 'disabled'` and no version/count fields. Enabled responses/history contain only aggregate values. Assert serialized records and list responses contain no composed card context, prompt, theme, fact, support, source ID, or rule ID.

- [ ] **Step 2: Run focused tests and confirm failure**

Run: `yarn workspace api test --run src/readings/response-mapper.test.ts src/readings/persistence/reading-history-store.test.ts src/routes/readings.test.ts`

Expected: FAIL because metadata contracts have not been extended.

- [ ] **Step 3: Implement additive metadata**

```ts
export type ComposerResponseMetadata = {
    composerMode: 'disabled' | 'enabled';
    corpusVersion?: string;
    namedPairCount?: number;
    wholeSpreadCount?: number;
};
```

Build it from the aggregate `ComposedReadingContext` only. Pass the same aggregate values to response mapping and failed/successful persistence metadata; do not pass the full context to persistence helpers.

- [ ] **Step 4: Run all API and repository static verification**

Run:

```sh
yarn workspace api test
yarn workspace api build-types
yarn workspace infra test --runInBand
yarn workspace infra build-types
yarn lint
git diff --check
```

Expected: PASS. No AWS deployment occurs in this checkpoint.

### Checkpoint 3 manual gate

Review the composed prompt ordering, exact `andAll` filter, continued use of `RetrieveAndGenerate`, unchanged disabled prompt behavior, no-S3 local path, 400/503 behavior, safe logs, and aggregate-only response/history metadata. Exercise local disabled mode manually and confirm its reading response remains functional.

Leave all checkpoint files uncommitted. Stop. The user validates and commits them, then confirms the commit and authorizes Checkpoint 4. Do not deploy yet.

---

## Checkpoint 4: Authorized Development Verification and Durable Documentation

### Task 13: Produce and review the exact development CDK diff

**Files:**
- No source changes expected.

**Interfaces:**
- Consumes the user-committed Checkpoint 3 implementation.
- Produces an exact development-only deployment proposal.

- [ ] **Step 1: Re-run the deployment gate**

Run:

```sh
yarn workspace api test
yarn workspace api build-types
yarn workspace infra test --runInBand
yarn workspace infra build-types
yarn lint
git status --short
```

Expected: all checks PASS and the working tree is clean before infrastructure inspection.

- [ ] **Step 2: Generate the exact development diff without deploying**

Run the repository's existing development CDK diff command for `SimpleTarotApi-dev` and its strong Bedrock dependency. Expected changes are limited to:

- development API Lambda composer environment variables
- exact three-pattern `s3:GetObject` IAM
- Lambda asset/code update
- cross-stack references required for bucket/data-source identities

Expected unchanged resources: production stacks, corpus bucket, vector bucket/index, Knowledge Base, data source, generation profile, Cognito, and user-data table.

- [ ] **Step 3: Stop for exact-target deployment authorization**

Present the diff summary and exact stack target. Do not deploy until the user explicitly authorizes the corrected development activation/deployment target.

### Task 14: Deploy development and run safe saved cases

**Files:**
- No public artifact or corpus files are created.

**Interfaces:**
- Produces live verification evidence containing identifiers and aggregate counts only.

- [ ] **Step 1: Deploy only the authorized development stack target**

Use the established CDK deployment command for the exact reviewed `SimpleTarotApi-dev` target. Do not deploy production or mutate the active corpus release.

- [ ] **Step 2: Verify deployed environment and IAM read-only scope**

Use CloudFormation/Lambda/IAM read-only inspection. Confirm `COMPOSER_RUNTIME_MODE=enabled`, same-stage bucket/data-source/Knowledge Base identities, and only the three approved `s3:GetObject` patterns. Do not print secret environment values or artifact bodies.

- [ ] **Step 3: Run live single-card and Celtic Cross cases**

Send authenticated valid requests through the existing API contract. Record only status, request ID, `composerMode`, corpus version, item count, aggregate relationship counts, citation count, and response-shape validity. Confirm response corpus version equals the active state without copying the active artifact body into project files.

- [ ] **Step 4: Run failure and privacy cases**

Confirm a mismatched card/name or invalid Celtic Cross ordering returns safe 400; simulate or use dependency injection for artifact failure proof if deliberately breaking development state would be unsafe; verify logs exclude question, selections, prompt, theme/fact text, rule IDs, and bodies.

- [ ] **Step 5: Prove rollback and restore enabled mode**

Generate the exact disabled-mode development template/diff and prove it removes composer identities/read grants and retains the legacy prompt path. If the user authorizes a live rollback deployment, deploy disabled, run one valid reading, then obtain authorization before restoring enabled. Otherwise, use CDK template plus automated route tests as rollback proof and leave development enabled.

- [ ] **Step 6: Confirm Bedrock architecture boundary**

Inspect the deployed code/config and test evidence to confirm it still calls `RetrieveAndGenerate`; there is no explicit `Retrieve`, separate model invocation, reranker, harness, or production enablement.

### Task 15: Replace planning-state docs with durable current-state documentation

**Files:**
- Create: `docs/deterministic-composer-runtime.md`
- Modify: `README.md`
- Modify: `apps/api/README.md`
- Modify: `apps/infra/README.md`
- Modify: `docs/private-corpus-artifact-boundary.md`
- Modify: `docs/bedrock_corpus_operations.md`
- Modify: `docs/bedrock_rag_api_integration.md`
- Modify: `.agents/bedrock-rag-api-reference.md`
- Modify: `.agents/bedrock-rag-change-checklist.md`
- Coordinate: private artifact contract status in the private corpus repository, without copying its source/rules into public Git.

**Interfaces:**
- Produces durable public architecture/operations guidance; the design spec and plan remain historical records.

- [ ] **Step 1: Write the durable runtime document**

Document implemented ownership, request flow, public consumer compatibility, S3 pointer/cache behavior, development/prod configuration, exact IAM scope, prompt precedence, aggregate metadata, safe errors/logging, operational checks, and rollback. Include no real artifact example, corpus text, rule definition, private path, or private construction command.

- [ ] **Step 2: Reconcile every existing current-state reference**

Replace “future,” “deferred,” and “not implemented” statements for composer loading with links to `docs/deterministic-composer-runtime.md`. Keep explicit retrieval/generation clearly future work. Link the durable architecture under root `README.md#architecture`; keep the spec and this plan under `README.md#planning` as historical design/plan records.

- [ ] **Step 3: Coordinate the private contract status update**

Update only the private repository's artifact-contract status and consumer handoff description. Do not add public repository paths, commands, content, or rule examples. Treat the public and private documentation edits as separate user-owned commits in their respective repositories.

- [ ] **Step 4: Validate documentation and complete regression checks**

Run:

```sh
rg -n "composer|RetrieveAndGenerate|explicit retrieval|runtime loading|deferred|not implemented" README.md apps docs .agents
rg -n "/Users[/]|corpus[-]source[.]json|yarn corpus[:]" README.md apps docs .agents
git diff --check
yarn workspace api test
yarn workspace api build-types
yarn workspace infra test --runInBand
yarn workspace infra build-types
yarn lint
```

Expected: current-state references agree, the private-path/content scan has no new matches, and all code checks PASS.

### Checkpoint 4 manual gate

Review the live development evidence without private content, verify valid readings and safe failure behavior, confirm production was untouched, and review both public and private documentation for a clear ownership boundary and accurate “implemented now vs later” status.

Leave documentation changes uncommitted in both repositories. Stop. The user validates and commits each repository's checkpoint files, then confirms both commits before branch completion or integration work begins.

---

## Final Completion Criteria

- Exact card/spread context and allowlisted relationships are deterministic and covered by sanitized tests.
- The enabled API reads the active pointer per request and never mixes composer and retrieval corpus versions.
- Immutable artifacts are size/checksum/schema validated before use; cache replacement is atomic and same-pointer misses are single-flight.
- Development is enabled with exact read-only IAM; production is disabled with no composer artifact permission.
- Disabled/local behavior retains the legacy prompt and performs no composer S3 reads.
- Enabled retrieval uses the exact active-version/status/document-kind filter while retaining `RetrieveAndGenerate`.
- Public responses/history contain aggregate metadata only; logs/errors contain no private content.
- Live development cases and rollback proof pass.
- Durable public and private documentation describes the resulting boundary without stale or proprietary details.
