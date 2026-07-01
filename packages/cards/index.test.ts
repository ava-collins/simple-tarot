import * as CardsIndex from './index';

import { describe, expect, it } from 'vitest';

describe('cards package exports', () => {
    it('loads the package entrypoint', () => {
        expect(CardsIndex).toBeDefined();
    });

    it('exports useSvgCards', () => {
        expect(CardsIndex.useSvgCards).toBeDefined();
        expect(typeof CardsIndex.useSvgCards).toBe('function');
    });
});
