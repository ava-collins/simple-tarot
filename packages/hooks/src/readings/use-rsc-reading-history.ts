'use client';

import { useCallback, useEffect, useState } from 'react';

import type {
    ReadingHistoryItem,
    ReadingHistoryResponse,
    ReadingResponse
} from './reading-contracts';

export type CreateOneCardReadingInput = {
    accessToken: string;
    question?: string;
};

export type UseRscReadingHistoryOptions = {
    accessToken: string | null | undefined;
    createOneCardReading: (
        input: CreateOneCardReadingInput
    ) => Promise<ReadingResponse>;
    listReadings: (accessToken: string) => Promise<ReadingHistoryResponse>;
};

export type UseRscReadingHistoryResult = {
    createTestReading: (question?: string) => Promise<ReadingResponse | null>;
    error: string | null;
    isGenerating: boolean;
    isLoading: boolean;
    latestReading: ReadingResponse | null;
    readings: ReadingHistoryItem[];
    refresh: () => Promise<void>;
};

export type ReadingHistoryResource = Promise<ReadingHistoryResponse>;

const getErrorMessage = (error: unknown, fallback: string) =>
    error instanceof Error ? error.message : fallback;

export function createReadingHistoryResource(
    accessToken: string,
    listReadings: (accessToken: string) => Promise<ReadingHistoryResponse>
): ReadingHistoryResource {
    return listReadings(accessToken);
}

export function useRscReadingHistory({
    accessToken,
    createOneCardReading,
    listReadings
}: UseRscReadingHistoryOptions): UseRscReadingHistoryResult {
    const [error, setError] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [latestReading, setLatestReading] = useState<ReadingResponse | null>(null);
    const [readings, setReadings] = useState<ReadingHistoryItem[]>([]);

    const refresh = useCallback(async () => {
        if (!accessToken) {
            setReadings([]);

            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await listReadings(accessToken);

            setReadings(response.readings);
        } catch (refreshError) {
            setError(
                getErrorMessage(refreshError, 'Unable to load reading history.')
            );
        } finally {
            setIsLoading(false);
        }
    }, [accessToken, listReadings]);

    const createTestReading = useCallback(
        async (question?: string) => {
            if (!accessToken) {
                return null;
            }

            setIsGenerating(true);
            setError(null);

            try {
                const reading = await createOneCardReading({
                    accessToken,
                    question
                });

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
        [accessToken, createOneCardReading, refresh]
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
