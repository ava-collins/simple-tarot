'use server';

import 'server-only';

import { createOneCardReadingRequest } from '@simpletarot/hooks';
import { createTarotApiClient, getTarotApiConfig } from '@/api/tarot-api';
import type { ReadingHistoryResponse, ReadingResponse } from './reading-contracts';

export type CreateOneCardReadingInput = {
    accessToken: string;
    question?: string;
};

const createServerClient = (accessToken: string) =>
    createTarotApiClient({
        ...getTarotApiConfig(),
        accessToken
    });

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
        createOneCardReadingRequest(question)
    );
}
