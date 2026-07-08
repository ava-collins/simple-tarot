import {
    TAROT_API_ENV_KEYS,
    type ReadingCitation,
    type ReadingHistoryItem,
    type ReadingHistoryResponse,
    type ReadingItem,
    type ReadingPositionResponse,
    type ReadingRequest,
    type ReadingResponse,
    type TarotApiConfig,
    type TarotApiClient,
    createTarotApiClient as createSharedTarotApiClient
} from '@simpletarot/hooks';

export type {
    ReadingCitation,
    ReadingHistoryItem,
    ReadingHistoryResponse,
    ReadingItem,
    ReadingPositionResponse,
    ReadingRequest,
    ReadingResponse,
    TarotApiClient,
    TarotApiConfig
};

const readRequiredEnv = (key: typeof TAROT_API_ENV_KEYS.apiUrl) => {
    const value = process.env[key]?.trim();

    if (!value) {
        throw new Error(`Missing required Expo public API config: ${key}`);
    }

    return value;
};

const trimTrailingSlashes = (value: string) => value.replace(/\/+$/, '');

export function getTarotApiConfig(): TarotApiConfig {
    return {
        baseUrl: trimTrailingSlashes(readRequiredEnv(TAROT_API_ENV_KEYS.apiUrl))
    };
}

export const createTarotApiClient = createSharedTarotApiClient;
