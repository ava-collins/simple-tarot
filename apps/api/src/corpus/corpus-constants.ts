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
