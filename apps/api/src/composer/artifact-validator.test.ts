import { describe, expect, it } from 'vitest';
import {
    parseActiveReleaseState,
    parseComposerBundle,
    parseReleaseManifest
} from './artifact-validator';
import { MAX_COMPOSER_BUNDLE_BYTES } from './constants';
import { ComposerUnavailableError } from './errors';
import {
    SANITIZED_CORPUS_VERSION,
    sanitizedComposerBundle,
    sanitizedComposerBundleV2
} from './test-fixture';

const EXPECTED_IDENTITIES = {
    dataSourceId: 'DS1234567890',
    knowledgeBaseId: 'KB1234567890'
};

const activeState = () => ({
    stateSchemaVersion: 1,
    environment: 'dev',
    corpusVersion: SANITIZED_CORPUS_VERSION,
    releasePrefix: `releases/${SANITIZED_CORPUS_VERSION}/`,
    knowledgeBaseId: EXPECTED_IDENTITIES.knowledgeBaseId,
    dataSourceId: EXPECTED_IDENTITIES.dataSourceId,
    ingestionJobId: 'JOB123',
    completedAt: '2026-07-18T12:00:00.000Z'
});

const manifest = (corpusSchemaVersion: 1 | 2 = 1) => ({
    manifestSchemaVersion: 1,
    corpusSchemaVersion,
    corpusVersion: SANITIZED_CORPUS_VERSION,
    artifacts: [
        {
            path: 'composer-bundle.json',
            role: 'composer',
            mediaType: 'application/json',
            byteSize: 1024,
            sha256: 'b'.repeat(64)
        },
        {
            path: 'rag/invented-theme.txt',
            role: 'rag-document',
            mediaType: 'text/plain',
            byteSize: 64,
            sha256: 'c'.repeat(64)
        }
    ],
    runtimeObjects: ['composer-bundle.json'],
    coverageObjects: [],
    ingestibleObjects: ['rag/invented-theme.txt']
});

const expectUnavailable = (operation: () => unknown) => {
    expect(operation).toThrow(ComposerUnavailableError);
    expect(operation).toThrow('Tarot reading context is temporarily unavailable.');
};

describe('parseActiveReleaseState', () => {
    it('accepts an exact compatible development pointer', () => {
        expect(parseActiveReleaseState(activeState(), EXPECTED_IDENTITIES)).toEqual(
            activeState()
        );
    });

    it.each([
        ['state schema', { stateSchemaVersion: 2 }],
        ['environment', { environment: 'prod' }],
        ['uppercase corpus hash', { corpusVersion: 'A'.repeat(64) }],
        ['short corpus hash', { corpusVersion: 'a'.repeat(63) }],
        ['release prefix', { releasePrefix: 'releases/other/' }],
        ['knowledge base', { knowledgeBaseId: 'OTHER' }],
        ['data source', { dataSourceId: 'OTHER' }],
        ['job id', { ingestionJobId: '' }],
        ['completion timestamp', { completedAt: 'yesterday' }],
        ['extra field', { extra: true }]
    ])('rejects an invalid %s', (_name, change) => {
        expectUnavailable(() =>
            parseActiveReleaseState({ ...activeState(), ...change }, EXPECTED_IDENTITIES)
        );
    });
});

describe('parseReleaseManifest', () => {
    it.each([1, 2] as const)(
        'accepts corpus schema %s and returns its composer entry',
        corpusSchemaVersion => {
            const input = manifest(corpusSchemaVersion);
            const parsed = parseReleaseManifest(input, SANITIZED_CORPUS_VERSION);

            expect(parsed.composerArtifact).toEqual(input.artifacts[0]);
            expect(parsed.manifest.corpusVersion).toBe(SANITIZED_CORPUS_VERSION);
            expect(parsed.manifest.corpusSchemaVersion).toBe(corpusSchemaVersion);
        }
    );

    it.each([
        ['manifest schema', { manifestSchemaVersion: 2 }],
        ['corpus schema', { corpusSchemaVersion: 3 }],
        ['corpus version', { corpusVersion: 'd'.repeat(64) }],
        ['runtime objects', { runtimeObjects: ['other.json'] }],
        [
            'unsafe path',
            {
                artifacts: [
                    { ...manifest().artifacts[0], path: '../composer-bundle.json' }
                ]
            }
        ],
        [
            'encoded unsafe path',
            {
                artifacts: [
                    { ...manifest().artifacts[0], path: '%2e%2e/composer-bundle.json' }
                ]
            }
        ],
        [
            'oversized composer',
            {
                artifacts: [
                    {
                        ...manifest().artifacts[0],
                        byteSize: MAX_COMPOSER_BUNDLE_BYTES + 1
                    }
                ]
            }
        ],
        [
            'uppercase checksum',
            {
                artifacts: [
                    { ...manifest().artifacts[0], sha256: 'B'.repeat(64) }
                ]
            }
        ],
        [
            'wrong composer role',
            {
                artifacts: [
                    { ...manifest().artifacts[0], role: 'coverage' }
                ]
            }
        ]
    ])('rejects an invalid %s', (_name, change) => {
        expectUnavailable(() =>
            parseReleaseManifest(
                { ...manifest(), ...change },
                SANITIZED_CORPUS_VERSION
            )
        );
    });
});

describe('parseComposerBundle', () => {
    it('accepts the complete sanitized v1 consumer bundle', () => {
        expect(
            parseComposerBundle(
                structuredClone(sanitizedComposerBundle),
                SANITIZED_CORPUS_VERSION,
                1
            )
        ).toEqual(sanitizedComposerBundle);
    });

    it('accepts the complete sanitized v2 consumer bundle', () => {
        expect(
            parseComposerBundle(
                structuredClone(sanitizedComposerBundleV2),
                SANITIZED_CORPUS_VERSION,
                2
            )
        ).toEqual(sanitizedComposerBundleV2);
    });

    it.each([
        [sanitizedComposerBundle, 2],
        [sanitizedComposerBundleV2, 1]
    ] as const)('rejects a cross-version bundle', (bundle, expectedSchemaVersion) => {
        expectUnavailable(() =>
            parseComposerBundle(
                structuredClone(bundle),
                SANITIZED_CORPUS_VERSION,
                expectedSchemaVersion
            )
        );
    });

    it('accepts the compiler contract zero-based spread position order', () => {
        const bundle = structuredClone(sanitizedComposerBundle);
        bundle.spreadsById['celtic-cross'].positions.forEach(
            (position, index) => {
                position.order = index;
            }
        );

        expect(
            parseComposerBundle(bundle, SANITIZED_CORPUS_VERSION, 1)
        ).toEqual(bundle);
    });

    it.each([
        ['schema', { schemaVersion: 3 }],
        ['corpus version', { corpusVersion: 'd'.repeat(64) }],
        ['missing cards map', { cardsById: undefined }],
        [
            'unsupported predicate',
            {
                approvedThemeFragments: [
                    {
                        ...sanitizedComposerBundle.approvedThemeFragments[0],
                        when: { greaterThan: [{ field: 'card.index' }, 0] }
                    }
                ]
            }
        ],
        [
            'unsupported relationship type',
            {
                relationshipRules: [
                    {
                        ...sanitizedComposerBundle.relationshipRules[0],
                        ruleType: 'arbitrary-pair'
                    }
                ]
            }
        ]
    ])('rejects an invalid %s', (_name, change) => {
        expectUnavailable(() =>
            parseComposerBundle(
                { ...structuredClone(sanitizedComposerBundle), ...change },
                SANITIZED_CORPUS_VERSION,
                1
            )
        );
    });

    it.each([
        ['an extra Major card key', (card: Record<string, unknown>) => {
            card.extra = true;
        }],
        ['a missing resolved element', (card: Record<string, unknown>) => {
            delete card.element;
        }],
        ['a Major suit', (card: Record<string, unknown>) => {
            card.suit = 'swords';
        }],
        ['an invalid number', (card: Record<string, unknown>) => {
            card.number = 1.5;
        }],
        ['empty keyword provenance', (card: Record<string, unknown>) => {
            card.uprightKeywordSourceIds = [];
        }]
    ])('rejects v2 cards with %s', (_name, mutate) => {
        const bundle = structuredClone(sanitizedComposerBundleV2) as unknown as {
            cardsById: Record<string, Record<string, unknown>>;
        };
        mutate(bundle.cardsById['dawn-keeper']!);

        expectUnavailable(() =>
            parseComposerBundle(bundle, SANITIZED_CORPUS_VERSION, 2)
        );
    });

    it('rejects duplicate approved single-card theme keys', () => {
        const bundle = structuredClone(sanitizedComposerBundleV2) as unknown as {
            approvedSingleCardThemes: Array<Record<string, unknown>>;
        };
        bundle.approvedSingleCardThemes.push({
            ...bundle.approvedSingleCardThemes[0]!,
            id: 'duplicate-arcana-theme'
        });

        expectUnavailable(() =>
            parseComposerBundle(bundle, SANITIZED_CORPUS_VERSION, 2)
        );
    });

    it('rejects malformed schema-2 legacy theme topic tags', () => {
        const bundle = structuredClone(sanitizedComposerBundleV2) as unknown as {
            approvedThemeFragments: Array<Record<string, unknown>>;
        };
        bundle.approvedThemeFragments[0]!.topicTags = ['valid', 7];

        expectUnavailable(() =>
            parseComposerBundle(bundle, SANITIZED_CORPUS_VERSION, 2)
        );
    });

    it('rejects executable attribute values', () => {
        const bundle = structuredClone(sanitizedComposerBundle) as unknown as Record<
            string,
            unknown
        >;
        const cards = bundle.cardsById as Record<
            string,
            { attributes: Record<string, unknown> }
        >;
        cards['dawn-keeper'].attributes.execute = () => 'not allowed';

        expectUnavailable(() =>
            parseComposerBundle(bundle, SANITIZED_CORPUS_VERSION, 1)
        );
    });
});
