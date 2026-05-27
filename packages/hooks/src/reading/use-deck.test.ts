import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import useReading from './use-deck';

const sortNumeric = (arr: number[]) => [...arr].sort((a, b) => a - b);

const card = (index: number) => ({
    celtic_cross: {
        reversed: { test: `reversed-${index}` },
        upright: { test: `upright-${index}` }
    },
    description: `desc-${index}`,
    element: `el-${index}`,
    exaltation: `ex-${index}`,
    hex: `hex-${index}`,
    image: `img-${index}`,
    index,
    keywords: `kw-${index}`,
    name: `card-${index}`,
    number: `${index}`,
    path: `path-${index}`,
    reversedKeywords: `rkw-${index}`,
    title: `title-${index}`
});

describe('useReading', () => {
    it('initializes deck and reversals with expected sizes and values', () => {
        const { result } = renderHook(() => useReading());

        expect(result.current.deck).toHaveLength(78);
        expect(new Set(result.current.deck).size).toBe(78);
        expect(sortNumeric(result.current.deck)).toEqual(
            Array.from({ length: 78 }, (_, i) => i)
        );
        expect(result.current.reversals).toHaveLength(78);
        expect(result.current.reversals.every(v => typeof v === 'boolean')).toBe(true);
    });

    it('does not reshuffle on rerender without explicit calls', () => {
        const { result, rerender } = renderHook(() => useReading());
        const firstDeckRef = result.current.deck;
        const firstReversalRef = result.current.reversals;

        rerender();

        expect(result.current.deck).toBe(firstDeckRef);
        expect(result.current.reversals).toBe(firstReversalRef);
    });

    it('shuffleDeck keeps deck as a full permutation', () => {
        const { result } = renderHook(() => useReading());

        act(() => {
            result.current.shuffleDeck();
        });

        expect(result.current.deck).toHaveLength(78);
        expect(new Set(result.current.deck).size).toBe(78);
        expect(sortNumeric(result.current.deck)).toEqual(
            Array.from({ length: 78 }, (_, i) => i)
        );
        expect(result.current.reversals).toHaveLength(78);
    });

    it('cutDeck rotates deck and no-ops on invalid bounds', () => {
        const { result } = renderHook(() => useReading());
        const original = result.current.deck;

        act(() => {
            result.current.cutDeck(0);
        });
        expect(result.current.deck).toBe(original);

        act(() => {
            result.current.cutDeck(original.length);
        });
        expect(result.current.deck).toBe(original);

        act(() => {
            result.current.cutDeck(10);
        });

        const expected = original.slice(10).concat(original.slice(0, 10));
        expect(result.current.deck).toEqual(expected);
    });

    it('deal indexes reversals by card id and safely handles missing cards', () => {
        const { result } = renderHook(() => useReading());
        const reversals = result.current.reversals;

        const cards = [card(77)];
        const spread = {
            positions: [
                { name: 'test', displayName: 'One', description: 'desc-one' },
                { name: 'test', displayName: 'Two', description: 'desc-two' }
            ]
        };

        const dealt = result.current.deal({ cards, spread });

        expect(dealt).toHaveLength(1);
        expect(dealt[0]?.index).toBe(77);
        expect(dealt[0]?.reversed).toBe(Boolean(reversals[77]));
        expect(dealt[0]?.cardReading).toBe(
            reversals[77] ? 'reversed-77' : 'upright-77'
        );
    });
});
