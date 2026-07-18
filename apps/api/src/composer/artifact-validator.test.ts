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
    sanitizedComposerBundle
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

const manifest = () => ({
    manifestSchemaVersion: 1,
    corpusSchemaVersion: 1,
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
    it('accepts the compatible consumer projection and returns its composer entry', () => {
        const parsed = parseReleaseManifest(manifest(), SANITIZED_CORPUS_VERSION);

        expect(parsed.composerArtifact).toEqual(manifest().artifacts[0]);
        expect(parsed.manifest.corpusVersion).toBe(SANITIZED_CORPUS_VERSION);
    });

    it.each([
        ['manifest schema', { manifestSchemaVersion: 2 }],
        ['corpus schema', { corpusSchemaVersion: 2 }],
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
    it('accepts the complete sanitized consumer bundle', () => {
        expect(
            parseComposerBundle(
                structuredClone(sanitizedComposerBundle),
                SANITIZED_CORPUS_VERSION
            )
        ).toEqual(sanitizedComposerBundle);
    });

    it.each([
        ['schema', { schemaVersion: 2 }],
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
                SANITIZED_CORPUS_VERSION
            )
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
            parseComposerBundle(bundle, SANITIZED_CORPUS_VERSION)
        );
    });
});
