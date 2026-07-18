import { describe, expect, it } from 'vitest';
import { CardPredicateInput, CorpusPredicate } from './contracts';
import { matchesCardPredicate } from './predicate-evaluator';
import { sanitizedComposerBundle } from './test-fixture';

const input = (): CardPredicateInput => ({
    card: sanitizedComposerBundle.cardsById['dawn-keeper'],
    correspondencesById: sanitizedComposerBundle.correspondencesById,
    orientation: 'upright'
});

describe('matchesCardPredicate', () => {
    it.each([
        [{ eq: [{ field: 'card.arcana' }, 'major'] }, true],
        [{ eq: [{ field: 'card.orientation' }, 'reversed'] }, false],
        [{ eq: [{ field: 'card.path' }, 'opening'] }, true],
        [{ eq: [{ field: 'card.element' }, 'ember'] }, true],
        [{ in: [{ field: 'card.suit' }, ['mirror', 'lantern']] }, true],
        [{ in: [{ field: 'card.index' }, [1, 2]] }, false]
    ] as const)('evaluates scalar predicate %j as %s', (predicate, expected) => {
        expect(matchesCardPredicate(predicate, input())).toBe(expected);
    });

    it('evaluates nested all, any, and not operators recursively', () => {
        const predicate: CorpusPredicate = {
            all: [
                { eq: [{ field: 'card.id' }, 'dawn-keeper'] },
                {
                    any: [
                        { eq: [{ field: 'card.orientation' }, 'reversed'] },
                        { not: { eq: [{ field: 'card.number' }, 'nine'] } }
                    ]
                }
            ]
        };

        expect(matchesCardPredicate(predicate, input())).toBe(true);
    });

    it.each([
        { eq: [{ field: 'request.question' }, 'private'] },
        { eq: [{ field: 'card.path.value' }, 'opening'] },
        { eq: [{ field: 'card.__proto__' }, 'opening'] },
        { eq: [{ field: 'card.unknown' }, 'opening'] },
        { unknown: [] },
        { all: 'not-an-array' },
        { eq: [{ nope: 'card.id' }, 'dawn-keeper'] },
        { eq: [{ field: 'card.id' }, { nested: true }] },
        { not: { unknown: [] } },
        { not: { all: [{ unknown: [] }] } }
    ])('returns false for unsupported or malformed predicate %j', predicate => {
        expect(
            matchesCardPredicate(predicate as unknown as CorpusPredicate, input())
        ).toBe(false);
    });

    it('returns the same result across repeated evaluations without mutation', () => {
        const predicate: CorpusPredicate = {
            any: [
                { eq: [{ field: 'card.element' }, 'ember'] },
                { eq: [{ field: 'card.element' }, 'mist'] }
            ]
        };
        const before = structuredClone(input());

        expect(matchesCardPredicate(predicate, input())).toBe(true);
        expect(matchesCardPredicate(predicate, input())).toBe(true);
        expect(input()).toEqual(before);
    });
});
