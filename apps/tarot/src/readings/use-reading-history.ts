import { useCallback, useEffect, useMemo, useState } from 'react';

import {
    createOneCardReadingRequest,
    createTarotApiClient,
    type ReadingHistoryItem,
    type ReadingResponse,
    type TarotApiClient
} from '@simpletarot/hooks/server';

import { getTarotApiConfig } from '@/config/tarot-api-config';

type UseReadingHistoryOptions = {
    accessToken: string | null | undefined;
    createClient?: (accessToken: string) => TarotApiClient;
};

export type UseReadingHistoryResult = {
    createTestReading: (question?: string) => Promise<ReadingResponse | null>;
    error: string | null;
    isGenerating: boolean;
    isLoading: boolean;
    latestReading: ReadingResponse | null;
    readings: ReadingHistoryItem[];
    refresh: () => Promise<void>;
};

const createDefaultClient = (accessToken: string) =>
    createTarotApiClient({
        ...getTarotApiConfig(),
        accessToken
    });

const getErrorMessage = (error: unknown, fallback: string) =>
    error instanceof Error ? error.message : fallback;

export function useReadingHistory({
    accessToken,
    createClient = createDefaultClient
}: UseReadingHistoryOptions): UseReadingHistoryResult {
    const [error, setError] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [latestReading, setLatestReading] = useState<ReadingResponse | null>(null);
    const [readings, setReadings] = useState<ReadingHistoryItem[]>([]);

    const client = useMemo(
        () => (accessToken ? createClient(accessToken) : null),
        [accessToken, createClient]
    );

    const refresh = useCallback(async () => {
        if (!client) {
            setReadings([]);

            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await client.listReadings();

            setReadings(response.readings);
        } catch (refreshError) {
            setError(
                getErrorMessage(refreshError, 'Unable to load reading history.')
            );
        } finally {
            setIsLoading(false);
        }
    }, [client]);

    const createTestReading = useCallback(
        async (question?: string) => {
            if (!client) {
                return null;
            }

            setIsGenerating(true);
            setError(null);

            try {
                const reading = await client.createReading(
                    createOneCardReadingRequest(question)
                );

                setLatestReading(reading);
                await refresh();

                return reading;
            } catch (generationError) {
                setError(
                    getErrorMessage(generationError, 'Unable to generate reading.')
                );

                return null;
            } finally {
                setIsGenerating(false);
            }
        },
        [client, refresh]
    );

    useEffect(() => {
        void refresh();
    }, [refresh]);

    return {
        createTestReading,
        error,
        isGenerating,
        isLoading,
        latestReading,
        readings,
        refresh
    };
}
