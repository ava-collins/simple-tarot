import type { ReadingRequest } from './reading-contracts';

export type CreateOneCardReadingInput = {
    accessToken: string;
    question?: string;
};

export const SINGLE_CARD_SPREAD = 'single_card';
export const GUIDANCE_POSITION = 'guidance';
const DEFAULT_SINGLE_CARD_ITEM = {
    cardIndex: 0,
    cardName: 'Fool',
    position: GUIDANCE_POSITION,
    reversed: false
} as const;

export function createOneCardReadingRequest(question?: string): ReadingRequest {
    const trimmedQuestion = question?.trim();

    return {
        spread: SINGLE_CARD_SPREAD,
        ...(trimmedQuestion ? { question: trimmedQuestion } : {}),
        items: [DEFAULT_SINGLE_CARD_ITEM]
    };
}
