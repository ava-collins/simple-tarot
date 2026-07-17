import { describe, expect, it } from 'vitest';
import { validateCanonicalCorpus } from './canonical-validation';

const validCorpus = () => ({
    cards: {
        schemaVersion: 1,
        items: [
            {
                id: 'the-fool',
                index: 0,
                name: 'The Fool',
                title: 'The Fool',
                arcana: 'major',
                description: 'A traveler begins a new path.',
                uprightKeywords: ['beginnings'],
                reversedKeywords: ['recklessness'],
                correspondenceIds: ['element-air'],
                attributes: {}
            }
        ]
    },
    spreads: {
        schemaVersion: 1,
        items: [
            {
                id: 'celtic-cross',
                displayName: 'The Celtic Cross',
                positions: [
                    {
                        id: 'situation',
                        displayName: 'Present Situation',
                        description: 'The heart of the matter.',
                        lens: 'Read this card as the present situation.',
                        order: 0
                    },
                    {
                        id: 'challenge',
                        displayName: 'Challenge',
                        description: 'The obstacle to address.',
                        lens: 'Read this card as a modifying challenge.',
                        order: 1
                    }
                ],
                narrativeEdges: [
                    {
                        id: 'challenge-modifies-situation',
                        fromPositionId: 'challenge',
                        toPositionId: 'situation',
                        relationship: 'modifies'
                    }
                ]
            }
        ]
    },
    correspondences: {
        schemaVersion: 1,
        items: [
            {
                id: 'element-air',
                kind: 'element',
                name: 'Air',
                attributes: { energy: 'active' },
                sourceIds: ['legacy-corpus-source']
            }
        ]
    },
    themeFragments: {
        schemaVersion: 1,
        items: [
            {
                id: 'element-air-clarity',
                kind: 'correspondence-theme',
                subjects: [{ type: 'element', id: 'element-air' }],
                theme: 'Air brings clarity, motion, and perspective.',
                when: { eq: [{ field: 'card.element' }, 'air'] },
                polarity: 'contextual',
                status: 'approved',
                sourceIds: ['legacy-corpus-source']
            }
        ]
    },
    relationshipRules: {
        schemaVersion: 1,
        items: [
            {
                id: 'challenge-modifies-situation',
                scope: 'named-pair',
                ruleType: 'named-position-edge',
                priority: 100,
                condition: {
                    type: 'named-position-edge',
                    edgeId: 'challenge-modifies-situation'
                },
                fact: 'The challenge modifies the present situation.',
                sourceIds: ['legacy-corpus-source']
            }
        ]
    },
    legacyPositionMeanings: {
        schemaVersion: 1,
        items: [
            {
                id: 'celtic-cross-situation-the-fool-upright',
                spreadId: 'celtic-cross',
                positionId: 'situation',
                cardId: 'the-fool',
                orientation: 'upright',
                meaning: 'A new opening is available.',
                sourceIds: ['legacy-corpus-source'],
                status: 'approved'
            }
        ]
    },
    sources: {
        schemaVersion: 1,
        items: [
            {
                id: 'legacy-corpus-source',
                title: 'Legacy Simple Tarot corpus'
            }
        ]
    }
});

const issueCodes = (issues: Array<{ code: string }>): string[] =>
    issues.map(issue => issue.code);

describe('validateCanonicalCorpus', () => {
    it('accepts a valid corpus with no warnings', () => {
        const corpus = validCorpus();

        expect(validateCanonicalCorpus(corpus)).toEqual({
            ok: true,
            value: corpus,
            warnings: []
        });
    });

    it('rejects malformed input at the untrusted boundary', () => {
        const result = validateCanonicalCorpus(null);

        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(issueCodes(result.errors)).toContain('invalid_structure');
        }
    });

    it('rejects unsupported schema versions', () => {
        const corpus = validCorpus();
        corpus.cards.schemaVersion = 2;

        const result = validateCanonicalCorpus(corpus);

        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(issueCodes(result.errors)).toContain('invalid_schema_version');
        }
    });

    it('rejects duplicate entity ids', () => {
        const corpus = validCorpus();
        corpus.cards.items.push({ ...corpus.cards.items[0]! });

        const result = validateCanonicalCorpus(corpus);

        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(issueCodes(result.errors)).toContain('duplicate_id');
        }
    });

    it('rejects broken canonical references', () => {
        const corpus = validCorpus();
        corpus.cards.items[0]!.correspondenceIds = ['element-unknown'];
        corpus.legacyPositionMeanings.items[0]!.cardId = 'unknown-card';

        const result = validateCanonicalCorpus(corpus);

        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(issueCodes(result.errors)).toContain('invalid_reference');
        }
    });

    it('rejects non-sequential spread position order', () => {
        const corpus = validCorpus();
        corpus.spreads.items[0]!.positions[1]!.order = 3;

        const result = validateCanonicalCorpus(corpus);

        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(issueCodes(result.errors)).toContain('invalid_spread_order');
        }
    });

    it('rejects single-card as a modeled spread', () => {
        const corpus = validCorpus();
        corpus.spreads.items[0]!.id = 'single_card';

        const result = validateCanonicalCorpus(corpus);

        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(issueCodes(result.errors)).toContain('invalid_reference');
        }
    });

    it('rejects narrative edges whose positions do not resolve', () => {
        const corpus = validCorpus();
        corpus.spreads.items[0]!.narrativeEdges[0]!.toPositionId = 'outcome';

        const result = validateCanonicalCorpus(corpus);

        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(issueCodes(result.errors)).toContain('invalid_narrative_edge');
        }
    });

    it('rejects unsupported predicate operators', () => {
        const corpus = validCorpus();
        const theme = corpus.themeFragments.items[0]! as unknown as Record<string, unknown>;
        theme.when = { greaterThan: [{ field: 'card.index' }, 1] };

        const result = validateCanonicalCorpus(corpus);

        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(issueCodes(result.errors)).toContain('unsupported_predicate_operator');
        }
    });

    it('rejects predicate fields outside the allowlist', () => {
        const corpus = validCorpus();
        corpus.themeFragments.items[0]!.when = {
            eq: [{ field: 'process.env.SECRET' }, 'value']
        };

        const result = validateCanonicalCorpus(corpus);

        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(issueCodes(result.errors)).toContain('invalid_predicate_field');
        }
    });

    it('rejects invalid editorial statuses', () => {
        const corpus = validCorpus();
        const theme = corpus.themeFragments.items[0]! as unknown as Record<string, unknown>;
        theme.status = 'pending';

        const result = validateCanonicalCorpus(corpus);

        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(issueCodes(result.errors)).toContain('invalid_editorial_status');
        }
    });

    it('rejects mismatched relationship rule conditions', () => {
        const corpus = validCorpus();
        corpus.relationshipRules.items[0]!.condition = {
            type: 'dominance',
            subject: 'element',
            minimumCount: 0
        };

        const result = validateCanonicalCorpus(corpus);

        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(issueCodes(result.errors)).toContain('invalid_relationship_condition');
        }
    });

    it('warns instead of failing when optional correspondence coverage is absent', () => {
        const corpus = validCorpus();
        corpus.cards.items[0]!.correspondenceIds = [];

        const result = validateCanonicalCorpus(corpus);

        expect(result.ok).toBe(true);
        if (result.ok) {
            expect(issueCodes(result.warnings)).toContain('missing_optional_correspondence');
        }
    });

    it('warns instead of failing when an optional correspondence has no approved theme', () => {
        const corpus = validCorpus();
        corpus.themeFragments.items[0]!.status = 'draft';

        const result = validateCanonicalCorpus(corpus);

        expect(result.ok).toBe(true);
        if (result.ok) {
            expect(issueCodes(result.warnings)).toContain('missing_optional_theme');
        }
    });

    it('returns issues in deterministic path then code order', () => {
        const corpus = validCorpus();
        corpus.cards.items[0]!.correspondenceIds = ['missing-b', 'missing-a'];
        corpus.spreads.items[0]!.positions[1]!.order = 4;

        const result = validateCanonicalCorpus(corpus);

        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.errors).toEqual(
                [...result.errors].sort(
                    (left, right) =>
                        left.path.localeCompare(right.path) || left.code.localeCompare(right.code)
                )
            );
        }
    });
});
