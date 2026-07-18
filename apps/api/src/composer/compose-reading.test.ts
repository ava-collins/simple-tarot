import { describe, expect, it } from 'vitest';
import { composeReadingContext } from './compose-reading';
import {
    sanitizedCelticCrossRequest,
    sanitizedComposerBundle,
    sanitizedSingleCardRequest
} from './test-fixture';

describe('composeReadingContext', () => {
    it('assembles a complete single-card context without relationships', () => {
        expect(
            composeReadingContext(
                sanitizedSingleCardRequest,
                sanitizedComposerBundle
            )
        ).toMatchObject({
            corpusVersion: sanitizedComposerBundle.corpusVersion,
            spreadMode: 'single-card',
            cards: [{ cardId: 'dawn-keeper', presentationPosition: 'guidance' }],
            namedPairResults: [],
            wholeSpreadResults: []
        });
    });

    it('assembles the exact ordered Celtic Cross context deterministically', () => {
        const requestBefore = structuredClone(sanitizedCelticCrossRequest);
        const bundleBefore = structuredClone(sanitizedComposerBundle);
        const first = composeReadingContext(
            sanitizedCelticCrossRequest,
            sanitizedComposerBundle
        );
        const second = composeReadingContext(
            sanitizedCelticCrossRequest,
            sanitizedComposerBundle
        );

        expect(first).toEqual(second);
        expect(first.cards).toHaveLength(10);
        expect(first.cards.map(card => card.position?.id)).toEqual(
            sanitizedCelticCrossRequest.items.map(item => item.position)
        );
        expect(first.namedPairResults).toHaveLength(1);
        expect(first.wholeSpreadResults).toHaveLength(3);
        expect(sanitizedCelticCrossRequest).toEqual(requestBefore);
        expect(sanitizedComposerBundle).toEqual(bundleBefore);
    });
});
