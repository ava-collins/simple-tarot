import {
    COMPOSER_BUNDLE_PATH,
    CORPUS_VERSION_PATTERN,
    MAX_COMPOSER_BUNDLE_BYTES,
    SUPPORTED_COMPOSER_SCHEMA_VERSIONS,
    SUPPORTED_CORPUS_SCHEMA_VERSIONS,
    SUPPORTED_RELATIONSHIP_TYPES
} from './constants';
import {
    ActiveReleaseState,
    ComposerBundle,
    ReleaseManifest,
    ReleaseManifestEntry
} from './contracts';
import { ComposerUnavailableError } from './errors';

type ExpectedBedrockIdentities = {
    dataSourceId: string;
    knowledgeBaseId: string;
};

type ParsedReleaseManifest = {
    composerArtifact: ReleaseManifestEntry;
    manifest: ReleaseManifest;
};

const SUBJECT_KINDS = [
    'alphabet',
    'arcana',
    'card',
    'element',
    'number',
    'sephiroth',
    'suit'
] as const;
const RELATIONSHIP_SCOPES = ['card-local', 'named-pair', 'whole-spread'] as const;
const EDGE_RELATIONSHIPS = [
    'colors',
    'explains',
    'informs',
    'meets',
    'modifies'
] as const;
const ARTIFACT_ROLES = [
    'composer',
    'coverage',
    'rag-document',
    'rag-metadata'
] as const;
const ORIENTATIONS = ['upright', 'reversed'] as const;
const POLARITIES = ['contextual', 'reinforcing', 'challenging'] as const;

const invalid = (reason = 'INVALID_COMPOSER_ARTIFACT'): never => {
    throw new ComposerUnavailableError(reason);
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

const expectRecord = (value: unknown): Record<string, unknown> =>
    isRecord(value) ? value : invalid();

const expectExactKeys = (
    value: Record<string, unknown>,
    expected: readonly string[]
): void => {
    const actual = Object.keys(value).sort();
    const wanted = [...expected].sort();
    if (actual.length !== wanted.length || actual.some((key, index) => key !== wanted[index])) {
        invalid();
    }
};

const expectString = (value: unknown): string =>
    typeof value === 'string' && value.length > 0 ? value : invalid();

const expectStringArray = (value: unknown): string[] => {
    if (!Array.isArray(value) || !value.every(item => typeof item === 'string')) {
        return invalid();
    }

    return value;
};

const expectNonEmptyStringArray = (value: unknown): string[] => {
    const values = expectStringArray(value);
    if (values.length === 0 || values.some(item => item.length === 0)) {
        invalid();
    }

    return values;
};

const expectArray = (value: unknown): unknown[] =>
    Array.isArray(value) ? value : invalid();

const expectInteger = (value: unknown, positive = false): number => {
    if (!Number.isInteger(value) || (positive && Number(value) <= 0)) {
        return invalid();
    }

    return value as number;
};

const expectEnum = <T extends string>(
    value: unknown,
    allowed: readonly T[]
): T =>
    typeof value === 'string' && allowed.includes(value as T)
        ? (value as T)
        : invalid();

const expectHash = (value: unknown): string => {
    const hash = expectString(value);

    return CORPUS_VERSION_PATTERN.test(hash) ? hash : invalid();
};

const expectSafeRelativePath = (value: unknown): string => {
    const path = expectString(value);
    if (
        path.startsWith('/') ||
        path.includes('\\') ||
        path.includes('%') ||
        !/^[A-Za-z0-9._/-]+$/.test(path) ||
        path.split('/').some(segment => segment.length === 0 || segment === '.' || segment === '..')
    ) {
        return invalid();
    }

    return path;
};

const expectIsoTimestamp = (value: unknown): string => {
    const timestamp = expectString(value);
    const parsed = new Date(timestamp);

    return !Number.isNaN(parsed.getTime()) && parsed.toISOString() === timestamp
        ? timestamp
        : invalid();
};

const expectUniqueIds = (values: Array<Record<string, unknown>>): void => {
    const ids = values.map(value => expectString(value.id));
    if (new Set(ids).size !== ids.length) {
        invalid();
    }
};

export function parseActiveReleaseState(
    value: unknown,
    expected: ExpectedBedrockIdentities
): ActiveReleaseState {
    const state = expectRecord(value);
    expectExactKeys(state, [
        'stateSchemaVersion',
        'environment',
        'corpusVersion',
        'releasePrefix',
        'knowledgeBaseId',
        'dataSourceId',
        'ingestionJobId',
        'completedAt'
    ]);

    if (state.stateSchemaVersion !== 1 || state.environment !== 'dev') {
        invalid();
    }
    const corpusVersion = expectHash(state.corpusVersion);
    const releasePrefix = expectString(state.releasePrefix);
    const knowledgeBaseId = expectString(state.knowledgeBaseId);
    const dataSourceId = expectString(state.dataSourceId);
    if (
        releasePrefix !== `releases/${corpusVersion}/` ||
        knowledgeBaseId !== expected.knowledgeBaseId ||
        dataSourceId !== expected.dataSourceId
    ) {
        invalid();
    }

    return {
        stateSchemaVersion: 1,
        environment: 'dev',
        corpusVersion,
        releasePrefix,
        knowledgeBaseId,
        dataSourceId,
        ingestionJobId: expectString(state.ingestionJobId),
        completedAt: expectIsoTimestamp(state.completedAt)
    };
}

const parseManifestEntry = (value: unknown): ReleaseManifestEntry => {
    const entry = expectRecord(value);
    expectExactKeys(entry, ['path', 'role', 'mediaType', 'byteSize', 'sha256']);

    return {
        path: expectSafeRelativePath(entry.path),
        role: expectEnum(entry.role, ARTIFACT_ROLES),
        mediaType: expectString(entry.mediaType),
        byteSize: expectInteger(entry.byteSize, true),
        sha256: expectHash(entry.sha256)
    };
};

const expectManifestPathList = (value: unknown): string[] =>
    expectStringArray(value).map(expectSafeRelativePath);

export function parseReleaseManifest(
    value: unknown,
    expectedCorpusVersion: string
): ParsedReleaseManifest {
    const input = expectRecord(value);
    expectExactKeys(input, [
        'manifestSchemaVersion',
        'corpusSchemaVersion',
        'corpusVersion',
        'artifacts',
        'runtimeObjects',
        'coverageObjects',
        'ingestibleObjects'
    ]);
    if (
        input.manifestSchemaVersion !== 1 ||
        !(SUPPORTED_CORPUS_SCHEMA_VERSIONS as readonly unknown[]).includes(
            input.corpusSchemaVersion
        ) ||
        input.corpusVersion !== expectedCorpusVersion
    ) {
        invalid();
    }

    const artifacts = expectArray(input.artifacts).map(parseManifestEntry);
    const artifactPaths = artifacts.map(entry => entry.path);
    if (new Set(artifactPaths).size !== artifactPaths.length) {
        invalid();
    }
    const runtimeObjects = expectManifestPathList(input.runtimeObjects);
    const coverageObjects = expectManifestPathList(input.coverageObjects);
    const ingestibleObjects = expectManifestPathList(input.ingestibleObjects);
    if (
        runtimeObjects.length !== 1 ||
        runtimeObjects[0] !== COMPOSER_BUNDLE_PATH ||
        [...runtimeObjects, ...coverageObjects, ...ingestibleObjects].some(
            path => !artifactPaths.includes(path)
        )
    ) {
        invalid();
    }

    const composerArtifact =
        artifacts.find(entry => entry.path === COMPOSER_BUNDLE_PATH) ?? invalid();
    if (
        composerArtifact.role !== 'composer' ||
        composerArtifact.mediaType !== 'application/json' ||
        composerArtifact.byteSize > MAX_COMPOSER_BUNDLE_BYTES
    ) {
        invalid();
    }

    return {
        composerArtifact,
        manifest: {
            manifestSchemaVersion: 1,
            corpusSchemaVersion: input.corpusSchemaVersion as 1 | 2,
            corpusVersion: expectedCorpusVersion,
            artifacts,
            runtimeObjects,
            coverageObjects,
            ingestibleObjects
        }
    };
}

const validatePrimitiveAttributes = (
    value: unknown,
    allowStringArrays: boolean
): void => {
    const attributes = expectRecord(value);
    for (const attribute of Object.values(attributes)) {
        if (
            typeof attribute === 'string' ||
            typeof attribute === 'number' ||
            (allowStringArrays &&
                Array.isArray(attribute) &&
                attribute.every(item => typeof item === 'string'))
        ) {
            continue;
        }
        invalid();
    }
};

const validateSubject = (value: unknown): void => {
    const subject = expectRecord(value);
    expectExactKeys(subject, ['type', 'id']);
    expectEnum(subject.type, SUBJECT_KINDS);
    expectString(subject.id);
};

const validatePredicate = (value: unknown): void => {
    const predicate = expectRecord(value);
    const keys = Object.keys(predicate);
    const operator = expectString(keys[0]);
    if (keys.length !== 1) {
        invalid();
    }
    const operand = predicate[operator];

    if (operator === 'eq' || operator === 'in') {
        const binaryOperand = expectArray(operand);
        if (binaryOperand.length !== 2) {
            invalid();
        }
        const field = expectRecord(binaryOperand[0]);
        expectExactKeys(field, ['field']);
        if (!/^card\.[A-Za-z][A-Za-z0-9]*$/.test(expectString(field.field))) {
            invalid();
        }
        const expected = binaryOperand[1];
        if (operator === 'eq') {
            if (
                typeof expected !== 'string' &&
                typeof expected !== 'number' &&
                typeof expected !== 'boolean'
            ) {
                invalid();
            }

return;
        }
        if (
            !Array.isArray(expected) ||
            !expected.every(item => typeof item === 'string' || typeof item === 'number')
        ) {
            invalid();
        }

return;
    }

    if (operator === 'all' || operator === 'any') {
        expectArray(operand).forEach(validatePredicate);

return;
    }

    if (operator === 'not') {
        validatePredicate(operand);

return;
    }

    invalid();
};

const validateCardsV1 = (value: unknown): void => {
    const cards = expectRecord(value);
    for (const [key, rawCard] of Object.entries(cards)) {
        const card = expectRecord(rawCard);
        expectExactKeys(card, [
            'id',
            'index',
            'name',
            'title',
            'arcana',
            'description',
            'uprightKeywords',
            'reversedKeywords',
            'correspondenceIds',
            'attributes'
        ]);
        if (expectString(card.id) !== key) invalid();
        expectInteger(card.index);
        expectString(card.name);
        expectString(card.title);
        expectEnum(card.arcana, ['major', 'minor'] as const);
        expectString(card.description);
        expectStringArray(card.uprightKeywords);
        expectStringArray(card.reversedKeywords);
        expectStringArray(card.correspondenceIds);
        validatePrimitiveAttributes(card.attributes, false);
    }
};

const validateCardsV2 = (value: unknown): void => {
    const cards = expectRecord(value);
    for (const [key, rawCard] of Object.entries(cards)) {
        const card = expectRecord(rawCard);
        const arcana = expectEnum(card.arcana, ['major', 'minor'] as const);
        expectExactKeys(card, [
            'id',
            'index',
            'name',
            'title',
            'arcana',
            'description',
            'number',
            ...(arcana === 'minor' ? ['suit'] : []),
            'element',
            'uprightKeywords',
            'uprightKeywordSourceIds',
            'reversedKeywords',
            'reversedKeywordSourceIds',
            'correspondenceIds',
            'attributes'
        ]);
        if (expectString(card.id) !== key) invalid();
        expectInteger(card.index);
        expectString(card.name);
        expectString(card.title);
        expectString(card.description);
        const number = expectInteger(card.number);
        if (
            (arcana === 'major' && (number < 0 || number > 21)) ||
            (arcana === 'minor' && (number < 1 || number > 14))
        ) {
            invalid();
        }
        if (arcana === 'minor') {
            expectEnum(card.suit, ['swords', 'wands', 'cups', 'coins'] as const);
        }
        expectEnum(card.element, ['air', 'fire', 'water', 'earth'] as const);
        expectNonEmptyStringArray(card.uprightKeywords);
        expectNonEmptyStringArray(card.uprightKeywordSourceIds);
        expectNonEmptyStringArray(card.reversedKeywords);
        expectNonEmptyStringArray(card.reversedKeywordSourceIds);
        expectStringArray(card.correspondenceIds);
        validatePrimitiveAttributes(card.attributes, false);
    }
};

const validateSingleCardThemes = (value: unknown): void => {
    const themes = expectArray(value).map(expectRecord);
    expectUniqueIds(themes);
    const approvedKeys = new Set<string>();

    for (const theme of themes) {
        expectExactKeys(theme, [
            'id',
            'dimension',
            'value',
            'theme',
            'status',
            'sourceIds'
        ]);
        expectString(theme.id);
        const dimension = expectEnum(
            theme.dimension,
            ['arcana', 'suit', 'number', 'element'] as const
        );
        if (dimension === 'arcana') {
            expectEnum(theme.value, ['major', 'minor'] as const);
        } else if (dimension === 'suit') {
            expectEnum(theme.value, ['swords', 'wands', 'cups', 'coins'] as const);
        } else if (dimension === 'number') {
            const number = expectInteger(theme.value);
            if (number < 0 || number > 21) invalid();
        } else {
            expectEnum(theme.value, ['air', 'fire', 'water', 'earth'] as const);
        }
        expectString(theme.theme);
        if (theme.status !== 'approved') invalid();
        expectNonEmptyStringArray(theme.sourceIds);

        const key = `${dimension}:${String(theme.value)}`;
        if (approvedKeys.has(key)) invalid();
        approvedKeys.add(key);
    }
};

const validateSpreads = (value: unknown): void => {
    const spreads = expectRecord(value);
    for (const [key, rawSpread] of Object.entries(spreads)) {
        const spread = expectRecord(rawSpread);
        expectExactKeys(spread, ['id', 'displayName', 'positions', 'narrativeEdges']);
        if (expectString(spread.id) !== key) invalid();
        expectString(spread.displayName);
        const positions = expectArray(spread.positions).map(expectRecord);
        expectUniqueIds(positions);
        for (const [positionIndex, position] of positions.entries()) {
            expectExactKeys(position, [
                'id',
                'displayName',
                'description',
                'lens',
                'order'
            ]);
            expectString(position.id);
            expectString(position.displayName);
            expectString(position.description);
            expectString(position.lens);
            if (expectInteger(position.order) !== positionIndex) invalid();
        }
        const edges = expectArray(spread.narrativeEdges).map(expectRecord);
        expectUniqueIds(edges);
        for (const edge of edges) {
            expectExactKeys(edge, [
                'id',
                'fromPositionId',
                'toPositionId',
                'relationship'
            ]);
            expectString(edge.id);
            expectString(edge.fromPositionId);
            expectString(edge.toPositionId);
            expectEnum(edge.relationship, EDGE_RELATIONSHIPS);
        }
    }
};

const validateCorrespondences = (value: unknown): void => {
    const correspondences = expectRecord(value);
    for (const [key, rawCorrespondence] of Object.entries(correspondences)) {
        const correspondence = expectRecord(rawCorrespondence);
        expectExactKeys(correspondence, ['id', 'kind', 'name', 'attributes', 'sourceIds']);
        if (expectString(correspondence.id) !== key) invalid();
        expectEnum(correspondence.kind, SUBJECT_KINDS);
        expectString(correspondence.name);
        validatePrimitiveAttributes(correspondence.attributes, true);
        expectStringArray(correspondence.sourceIds);
    }
};

const validateThemes = (
    value: unknown,
    schemaVersion: 1 | 2
): void => {
    const themes = expectArray(value).map(expectRecord);
    expectUniqueIds(themes);
    for (const theme of themes) {
        expectExactKeys(theme, [
            'id',
            'kind',
            'subjects',
            'theme',
            'when',
            'polarity',
            'status',
            'sourceIds',
            ...(schemaVersion === 2 ? ['topicTags'] : [])
        ]);
        expectString(theme.id);
        if (theme.kind !== 'correspondence-theme' || theme.status !== 'approved') invalid();
        expectArray(theme.subjects).forEach(validateSubject);
        expectString(theme.theme);
        validatePredicate(theme.when);
        expectEnum(theme.polarity, POLARITIES);
        expectStringArray(theme.sourceIds);
        if (schemaVersion === 2) {
            expectStringArray(theme.topicTags);
        }
    }
};

const validateRelationshipCondition = (
    ruleType: string,
    value: unknown
): void => {
    const condition = expectRecord(value);
    switch (ruleType) {
        case 'named-position-edge':
            expectExactKeys(condition, ['type', 'edgeId']);
            if (condition.type !== 'named-position-edge') invalid();
            expectString(condition.edgeId);

return;
        case 'element-dominance':
        case 'suit-dominance':
            expectExactKeys(condition, ['type', 'subject', 'minimumCount']);
            if (
                condition.type !== 'dominance' ||
                condition.subject !==
                    (ruleType === 'element-dominance' ? 'element' : 'suit')
            ) invalid();
            expectInteger(condition.minimumCount, true);

return;
        case 'major-arcana-weight':
        case 'number-repetition':
            expectExactKeys(condition, ['type', 'minimumCount']);
            if (condition.type !== ruleType) invalid();
            expectInteger(condition.minimumCount, true);

return;
        case 'orientation-balance':
            expectExactKeys(condition, ['type', 'orientation', 'minimumCount']);
            if (condition.type !== 'orientation-balance') invalid();
            expectEnum(condition.orientation, ORIENTATIONS);
            expectInteger(condition.minimumCount, true);

return;
        default:
            invalid();
    }
};

const validateRelationshipRules = (value: unknown): void => {
    const rules = expectArray(value).map(expectRecord);
    expectUniqueIds(rules);
    for (const rule of rules) {
        expectExactKeys(rule, [
            'id',
            'scope',
            'ruleType',
            'priority',
            'condition',
            'fact',
            'sourceIds'
        ]);
        expectString(rule.id);
        expectEnum(rule.scope, RELATIONSHIP_SCOPES);
        const ruleType = expectEnum(rule.ruleType, SUPPORTED_RELATIONSHIP_TYPES);
        expectInteger(rule.priority);
        validateRelationshipCondition(ruleType, rule.condition);
        expectString(rule.fact);
        expectStringArray(rule.sourceIds);
    }
};

const validatePositionMeanings = (value: unknown): void => {
    const meanings = expectRecord(value);
    for (const [key, rawMeaning] of Object.entries(meanings)) {
        const meaning = expectRecord(rawMeaning);
        expectExactKeys(meaning, [
            'id',
            'spreadId',
            'positionId',
            'cardId',
            'orientation',
            'meaning',
            'sourceIds',
            'status'
        ]);
        expectString(meaning.id);
        const spreadId = expectString(meaning.spreadId);
        const positionId = expectString(meaning.positionId);
        const cardId = expectString(meaning.cardId);
        const orientation = expectEnum(meaning.orientation, ORIENTATIONS);
        if (
            meaning.status !== 'approved' ||
            key !== `${spreadId}:${positionId}:${cardId}:${orientation}`
        ) invalid();
        expectString(meaning.meaning);
        expectStringArray(meaning.sourceIds);
    }
};

export function parseComposerBundle(
    value: unknown,
    expectedCorpusVersion: string,
    expectedSchemaVersion: 1 | 2
): ComposerBundle {
    const bundle = expectRecord(value);
    if (
        !(SUPPORTED_COMPOSER_SCHEMA_VERSIONS as readonly unknown[]).includes(
            expectedSchemaVersion
        )
    ) {
        invalid();
    }
    expectExactKeys(bundle, [
        'schemaVersion',
        'corpusVersion',
        'cardsById',
        ...(expectedSchemaVersion === 2 ? ['approvedSingleCardThemes'] : []),
        'spreadsById',
        'correspondencesById',
        'approvedThemeFragments',
        'relationshipRules',
        'legacyPositionMeaningsByKey'
    ]);
    if (
        bundle.schemaVersion !== expectedSchemaVersion ||
        bundle.corpusVersion !== expectedCorpusVersion
    ) invalid();

    if (expectedSchemaVersion === 1) {
        validateCardsV1(bundle.cardsById);
    } else {
        validateCardsV2(bundle.cardsById);
        validateSingleCardThemes(bundle.approvedSingleCardThemes);
    }
    validateSpreads(bundle.spreadsById);
    validateCorrespondences(bundle.correspondencesById);
    validateThemes(bundle.approvedThemeFragments, expectedSchemaVersion);
    validateRelationshipRules(bundle.relationshipRules);
    validatePositionMeanings(bundle.legacyPositionMeaningsByKey);

    return bundle as unknown as ComposerBundle;
}
