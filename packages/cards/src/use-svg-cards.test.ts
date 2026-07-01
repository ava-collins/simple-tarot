import { describe, expect, it } from 'vitest';

import useSvgCards from './use-svg-cards';

describe('useSvgCards', () => {
    const defaultProps = { width: 100, height: 100 };

    it('returns all 78 card components', () => {
        for (let card = 0; card <= 77; card++) {
            const result = useSvgCards(card, defaultProps);

            expect(result).toBeTruthy();
            expect(result?.type).toBeDefined();
        }
    });

    it('passes through props and allows overriding default svg props', () => {
        const result = useSvgCards(0, {
            fill: 'red',
            height: 300,
            strokeWidth: '2',
            width: 200
        });

        expect(result?.props).toMatchObject({
            fill: 'red',
            height: 300,
            strokeWidth: '2',
            width: 200
        });
    });

    it('applies default strokeWidth and fill props', () => {
        const result = useSvgCards(10, defaultProps);

        expect(result?.props).toMatchObject({
            fill: 'black',
            strokeWidth: '1',
            ...defaultProps
        });
    });

    it('returns null for invalid card numbers', () => {
        expect(useSvgCards(-1, defaultProps)).toBeNull();
        expect(useSvgCards(78, defaultProps)).toBeNull();
        expect(useSvgCards(100, defaultProps)).toBeNull();
    });

    it('has the expected suit distribution', () => {
        const majorArcana = [];
        const wands = [];
        const cups = [];
        const swords = [];
        const coins = [];

        for (let i = 0; i <= 21; i++) majorArcana.push(useSvgCards(i, defaultProps));
        for (let i = 22; i <= 35; i++) wands.push(useSvgCards(i, defaultProps));
        for (let i = 36; i <= 49; i++) cups.push(useSvgCards(i, defaultProps));
        for (let i = 50; i <= 63; i++) swords.push(useSvgCards(i, defaultProps));
        for (let i = 64; i <= 77; i++) coins.push(useSvgCards(i, defaultProps));

        expect(majorArcana).toHaveLength(22);
        expect(wands).toHaveLength(14);
        expect(cups).toHaveLength(14);
        expect(swords).toHaveLength(14);
        expect(coins).toHaveLength(14);
    });
});
