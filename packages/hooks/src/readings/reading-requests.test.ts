import { afterEach, describe, expect, it, vi } from 'vitest';

import { createOneCardReadingRequest } from './reading-requests';

// Builds a deterministic stand-in for the injected `random` param, always returning `value`.
const randomReturning = (value: number) => () => value;

describe('createOneCardReadingRequest', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('creates a single-card reading request with a trimmed question', () => {
        expect(
            createOneCardReadingRequest(
                '  What should I notice today?  ',
                randomReturning(0)
            )
        ).toEqual({
            spread: 'single_card',
            question: 'What should I notice today?',
            items: [
                {
                    cardIndex: 0,
                    cardName: 'Fool',
                    position: 'guidance',
                    reversed: false
                }
            ]
        });
    });

    it('omits the question when it is blank', () => {
        expect(createOneCardReadingRequest('   ', randomReturning(0))).toEqual({
            spread: 'single_card',
            items: [
                {
                    cardIndex: 0,
                    cardName: 'Fool',
                    position: 'guidance',
                    reversed: false
                }
            ]
        });
    });

    it.each([
        [0, 0, 'Fool'],
        [21 / 78, 21, 'Universe'],
        [22 / 78, 22, 'Ace of Wands'],
        [35 / 78, 35, 'King of Wands'],
        [36 / 78, 36, 'Ace of Cups'],
        [49 / 78, 49, 'King of Cups'],
        [50 / 78, 50, 'Ace of Swords'],
        [63 / 78, 63, 'King of Swords'],
        [64 / 78, 64, 'Ace of Coins'],
        [0.999999, 77, 'King of Coins']
    ])(
        'maps random() %f to cardIndex %i (%s)',
        (randomValue, expectedIndex, expectedName) => {
            const request = createOneCardReadingRequest(
                undefined,
                randomReturning(randomValue)
            );

            expect(request.items).toEqual([
                {
                    cardIndex: expectedIndex,
                    cardName: expectedName,
                    position: 'guidance',
                    reversed: false
                }
            ]);
        }
    );

    it('defaults to Math.random when no random function is supplied', () => {
        vi.spyOn(Math, 'random').mockReturnValue(36 / 78);

        const request = createOneCardReadingRequest();

        expect(request.items[0]).toMatchObject({
            cardIndex: 36,
            cardName: 'Ace of Cups'
        });
    });

    it('always uses the guidance position and upright orientation', () => {
        const request = createOneCardReadingRequest(undefined, randomReturning(0.5));

        expect(request.items[0]).toMatchObject({
            position: 'guidance',
            reversed: false
        });
    });
});
