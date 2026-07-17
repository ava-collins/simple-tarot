import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { validateCanonicalCorpus } from './canonical-validation';
import {
    migrateFirestoreCorpus,
    writeCanonicalCorpus
} from './migrate-firestore-corpus';

const fixture = {
    __collections__: {
        cards: {
            'Ace of Coins': {
                arcana: 'minor',
                celtic_cross: {
                    reversed: {
                        challenge: 'A material opportunity is blocked.'
                    }
                },
                description: 'A hand offers a coin.',
                element: 'ether',
                image: 'images/tarot/coins/1.gif',
                index: 64,
                keywords: 'opportunity, resources',
                name: 'Ace of Coins',
                number: 'I',
                path: 'Kether',
                reversedKeywords: 'delay, greed',
                title: 'Root Powers of Earth',
                type: 'coins'
            },
            Fool: {
                arcana: 'major',
                celtic_cross: {
                    upright: {
                        situation: 'A new opening is available.'
                    }
                },
                decan: 'aleph',
                description: 'A traveler begins a new path.',
                element: 'air',
                index: 0,
                keywords: 'beginnings, innocence',
                name: 'The Fool',
                number: '0',
                reversedKeywords: 'recklessness, hesitation',
                title: 'The Fool',
                type: 'elemental'
            }
        },
        spreads: {
            legacySpreadId: {
                displayName: 'The Celtic Cross',
                name: 'celtic_cross',
                positions: [
                    {
                        displayName: 'Present Situation',
                        name: 'situation',
                        description: 'The heart of the matter.'
                    },
                    {
                        displayName: 'Challenge',
                        name: 'challenge',
                        description: 'The obstacle to address.'
                    }
                ]
            }
        },
        elements: {
            air: {
                energy: 'masculine',
                keywords: 'knowledge, action, perspective'
            }
        },
        suits: {
            coins: {
                dominant: 'Seeking insight into material matters.',
                element: 'earth',
                keywords: 'work, money, property',
                zodiac: 'taurus, virgo, capricorn'
            }
        },
        sephiroth: {
            Kether: {
                index: 1,
                meaning: 'The first emanation.',
                represents: 'Potential before form.',
                title: 'Crown'
            }
        },
        alphabet: {
            aleph: {
                letter: 'A',
                name: 'Ox',
                number: 1
            }
        }
    }
};

describe('migrateFirestoreCorpus', () => {
    it('mechanically migrates entities in deterministic order', () => {
        const migrated = migrateFirestoreCorpus(fixture);

        expect(migrated.cards.items.map(card => card.id)).toEqual([
            'the-fool',
            'ace-of-coins'
        ]);
        expect(migrated.spreads.items[0]?.positions.map(position => position.order)).toEqual([
            0,
            1
        ]);
        expect(migrated.legacyPositionMeanings.items).toHaveLength(2);
        expect(migrated.sources.items).toContainEqual(
            expect.objectContaining({ id: 'legacy-corpus-source' })
        );
        expect(validateCanonicalCorpus(migrated).ok).toBe(true);
    });

    it('preserves unknown optional attributes without creating broken references', () => {
        const migrated = migrateFirestoreCorpus(fixture);
        const ace = migrated.cards.items.find(card => card.id === 'ace-of-coins');
        const validation = validateCanonicalCorpus(migrated);

        expect(ace?.attributes.element).toBe('ether');
        expect(ace?.correspondenceIds).not.toContain('element-ether');
        expect(ace?.correspondenceIds).toContain('suit-coins');
        expect(validation.ok).toBe(true);
        if (validation.ok) {
            expect(validation.warnings).toContainEqual(
                expect.objectContaining({
                    code: 'missing_optional_correspondence',
                    path: expect.stringContaining('attributes.element')
                })
            );
        }
    });

    it('creates themes only from existing descriptive correspondence fields', () => {
        const migrated = migrateFirestoreCorpus(fixture);

        expect(migrated.themeFragments.items.map(theme => theme.id)).toEqual([
            'element-air-theme',
            'sephiroth-kether-theme',
            'suit-coins-theme'
        ]);
        expect(migrated.themeFragments.items).not.toEqual(
            expect.arrayContaining([
                expect.objectContaining({ id: expect.stringContaining('alphabet-aleph') })
            ])
        );
    });

    it('seeds only narrative edges whose positions exist in the source spread', () => {
        const migrated = migrateFirestoreCorpus(fixture);

        expect(migrated.spreads.items[0]?.narrativeEdges).toEqual([
            {
                id: 'challenge-modifies-situation',
                fromPositionId: 'challenge',
                toPositionId: 'situation',
                relationship: 'modifies'
            }
        ]);
        expect(
            migrated.relationshipRules.items.filter(
                rule => rule.ruleType === 'named-position-edge'
            )
        ).toHaveLength(1);
    });

    it('is byte-deterministic and does not mutate the legacy input', () => {
        const inputBefore = JSON.stringify(fixture);

        const first = JSON.stringify(migrateFirestoreCorpus(fixture));
        const second = JSON.stringify(migrateFirestoreCorpus(fixture));

        expect(first).toBe(second);
        expect(JSON.stringify(fixture)).toBe(inputBefore);
    });
});

describe('writeCanonicalCorpus', () => {
    it('writes the seven canonical files with stable JSON formatting', () => {
        const outputDirectory = mkdtempSync(join(tmpdir(), 'simple-tarot-canonical-'));

        const paths = writeCanonicalCorpus(
            migrateFirestoreCorpus(fixture),
            outputDirectory
        );

        expect(paths.map(path => path.split('/').at(-1))).toEqual([
            'cards.json',
            'correspondences.json',
            'legacy-position-meanings.json',
            'relationship-rules.json',
            'sources.json',
            'spreads.json',
            'theme-fragments.json'
        ]);
        paths.forEach(path => {
            const contents = readFileSync(path, 'utf8');
            expect(contents.endsWith('\n')).toBe(true);
            expect(() => JSON.parse(contents)).not.toThrow();
        });
    });
});
