import {
    JSON_CONTENT_TYPE,
    READINGS_ENDPOINT_PATH
} from '../constants/tarot-api';
import { parseJsonResponse, trimTrailingSlashes } from '../common/api-response';
import type {
    ReadingHistoryResponse,
    ReadingRequest,
    ReadingResponse
} from './reading-contracts';

export type TarotApiConfig = {
    baseUrl: string;
};

export type TarotApiClient = {
    createReading: (request: ReadingRequest) => Promise<ReadingResponse>;
    listReadings: () => Promise<ReadingHistoryResponse>;
};

type CreateTarotApiClientOptions = TarotApiConfig & {
    accessToken: string;
};

export function createTarotApiClient({
    accessToken,
    baseUrl
}: CreateTarotApiClientOptions): TarotApiClient {
    const apiBaseUrl = trimTrailingSlashes(baseUrl);
    const authHeaders = {
        Authorization: `Bearer ${accessToken}`
    };

    return {
        async createReading(request) {
            const url = `${apiBaseUrl}${READINGS_ENDPOINT_PATH}`;
            const method = 'POST';
            const response = await fetch(url, {
                body: JSON.stringify(request),
                headers: {
                    ...authHeaders,
                    'Content-Type': JSON_CONTENT_TYPE
                },
                method
            });

            return parseJsonResponse<ReadingResponse>(response, {
                logPrefix: '[tarot-api]',
                method,
                url
            });
        },
        async listReadings() {
            const url = `${apiBaseUrl}${READINGS_ENDPOINT_PATH}`;
            const method = 'GET';
            const response = await fetch(url, {
                headers: authHeaders,
                method
            });

            return parseJsonResponse<ReadingHistoryResponse>(response, {
                logPrefix: '[tarot-api]',
                method,
                url
            });
        }
    };
}
