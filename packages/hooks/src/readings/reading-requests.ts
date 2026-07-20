import { CARD_NAMES } from '@simpletarot/cards/card-names';

import type { ReadingRequest } from './reading-contracts';

export type CreateOneCardReadingInput = {
    accessToken: string;
    question?: string;
};

export const SINGLE_CARD_SPREAD = 'single_card';
export const GUIDANCE_POSITION = 'guidance';

function drawRandomCardIndex(random: () => number): number {
    const index = Math.floor(random() * CARD_NAMES.length);

    return Math.min(Math.max(index, 0), CARD_NAMES.length - 1);
}

function cardNameForIndex(cardIndex: number): string {
    return CARD_NAMES[cardIndex] ?? 'Fool';
}

export function createOneCardReadingRequest(
    question?: string,
    random: () => number = Math.random
): ReadingRequest {
    const trimmedQuestion = question?.trim();
    const cardIndex = drawRandomCardIndex(random);

    return {
        spread: SINGLE_CARD_SPREAD,
        ...(trimmedQuestion ? { question: trimmedQuestion } : {}),
        items: [
            {
                cardIndex,
                cardName: cardNameForIndex(cardIndex),
                position: GUIDANCE_POSITION,
                reversed: false
            }
        ]
    };
}
