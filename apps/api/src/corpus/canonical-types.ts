import {
    CANONICAL_SCHEMA_VERSION,
    RELATIONSHIP_SCOPES,
    THEME_STATUSES
} from './corpus-constants';

export type CanonicalSchemaVersion = typeof CANONICAL_SCHEMA_VERSION;

export type CanonicalCollection<T> = {
    schemaVersion: CanonicalSchemaVersion;
    items: T[];
};

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

export type ThemeStatus = (typeof THEME_STATUSES)[number];

export type ThemeFragment = {
    id: string;
    kind: 'correspondence-theme';
    subjects: SubjectReference[];
    theme: string;
    when: CorpusPredicate;
    polarity: 'contextual' | 'reinforcing' | 'challenging';
    status: ThemeStatus;
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

export type RelationshipScope = (typeof RELATIONSHIP_SCOPES)[number];

export type RelationshipRuleType =
    | 'element-dominance'
    | 'major-arcana-weight'
    | 'named-position-edge'
    | 'number-repetition'
    | 'orientation-balance'
    | 'suit-dominance';

export type RelationshipRule = {
    id: string;
    scope: RelationshipScope;
    ruleType: RelationshipRuleType;
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

export type CanonicalCorpus = {
    cards: CanonicalCollection<CanonicalCard>;
    spreads: CanonicalCollection<CanonicalSpread>;
    correspondences: CanonicalCollection<CanonicalCorrespondence>;
    themeFragments: CanonicalCollection<ThemeFragment>;
    relationshipRules: CanonicalCollection<RelationshipRule>;
    legacyPositionMeanings: CanonicalCollection<LegacyPositionMeaning>;
    sources: CanonicalCollection<CorpusSource>;
};

