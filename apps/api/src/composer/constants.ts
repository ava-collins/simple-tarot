export const COMPOSER_SCHEMA_VERSION = 2 as const;
export const CORPUS_SCHEMA_VERSION = 2 as const;
export const SUPPORTED_COMPOSER_SCHEMA_VERSIONS = [1, 2] as const;
export const SUPPORTED_CORPUS_SCHEMA_VERSIONS = [1, 2] as const;

export const SINGLE_CARD_REQUEST_SPREAD = 'single_card' as const;
export const CELTIC_CROSS_REQUEST_SPREAD = 'celtic_cross' as const;
export const CELTIC_CROSS_BUNDLE_SPREAD = 'celtic-cross' as const;

export const MAX_THEMES_PER_CARD = 2;
export const MAX_NAMED_PAIR_RESULTS = 4;
export const MAX_WHOLE_SPREAD_RESULTS = 3;

export const ACTIVE_RELEASE_KEY = 'state/dev/active-release.json' as const;
export const COMPOSER_BUNDLE_PATH = 'composer-bundle.json' as const;
export const RELEASE_MANIFEST_PATH = 'manifest.json' as const;
export const MAX_COMPOSER_BUNDLE_BYTES = 2 * 1024 * 1024;
export const CORPUS_VERSION_PATTERN = /^[a-f0-9]{64}$/;

export const SUPPORTED_PREDICATE_OPERATORS = [
    'eq',
    'in',
    'all',
    'any',
    'not'
] as const;

export const SUPPORTED_RELATIONSHIP_TYPES = [
    'element-dominance',
    'suit-dominance',
    'major-arcana-weight',
    'number-repetition',
    'orientation-balance',
    'named-position-edge'
] as const;
