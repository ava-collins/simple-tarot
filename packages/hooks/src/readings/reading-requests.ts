import type { ReadingRequest } from './reading-contracts';

export const SINGLE_CARD_SPREAD = 'single_card';
export const GUIDANCE_POSITION = 'guidance';
export const TEST_READING_CARD = {
    cardIndex: 0,
    cardName: 'The Fool',
    position: GUIDANCE_POSITION,
    reversed: false
} as const;

export function createOneCardReadingRequest(question?: string): ReadingRequest {
    const trimmedQuestion = question?.trim();

    return {
        spread: SINGLE_CARD_SPREAD,
        ...(trimmedQuestion ? { question: trimmedQuestion } : {}),
        items: [TEST_READING_CARD]
    };
}
