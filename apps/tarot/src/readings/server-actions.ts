'use server';

import 'server-only';

import { createTarotApiClient, getTarotApiConfig } from '@/api/tarot-api';
import type {
    ReadingHistoryResponse,
    ReadingRequest,
    ReadingResponse
} from './reading-contracts';

export type CreateOneCardReadingInput = {
    accessToken: string;
    question?: string;
};

const createServerClient = (accessToken: string) =>
    createTarotApiClient({
        ...getTarotApiConfig(),
        accessToken
    });

const oneCardReadingRequest = (question?: string): ReadingRequest => {
    const trimmedQuestion = question?.trim();

    return {
        spread: 'single_card',
        ...(trimmedQuestion ? { question: trimmedQuestion } : {}),
        items: [
            {
                cardIndex: 0,
                cardName: 'The Fool',
                position: 'guidance',
                reversed: false
            }
        ]
    };
};

export async function listReadingsOnServer(
    accessToken: string
): Promise<ReadingHistoryResponse> {
    return createServerClient(accessToken).listReadings();
}

export async function createOneCardReadingOnServer({
    accessToken,
    question
}: CreateOneCardReadingInput): Promise<ReadingResponse> {
    return createServerClient(accessToken).createReading(
        oneCardReadingRequest(question)
    );
}
