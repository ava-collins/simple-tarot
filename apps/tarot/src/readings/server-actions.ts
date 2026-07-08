'use server';

import 'server-only';

import {
    createOneCardReadingRequest,
    createTarotApiClient,
    type CreateOneCardReadingInput,
    type ReadingHistoryResponse,
    type ReadingResponse
} from '@simpletarot/hooks';
import { getTarotApiConfig } from '@/api/tarot-api';

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
