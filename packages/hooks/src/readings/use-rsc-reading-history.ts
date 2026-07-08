'use client';

import { use, useCallback, useEffect, useState } from 'react';

import type {
    ReadingHistoryItem,
    ReadingHistoryResponse,
    ReadingResponse
} from './reading-contracts';
import type { ReadingHistoryResource } from './reading-resources';
import type { CreateOneCardReadingInput } from './reading-requests';

export type UseRscReadingHistoryOptions = {
    accessToken: string | null | undefined;
    createOneCardReading: (
        input: CreateOneCardReadingInput
    ) => Promise<ReadingResponse>;
    initialReadingsResource?: ReadingHistoryResource;
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

const getErrorMessage = (error: unknown, fallback: string) =>
    error instanceof Error ? error.message : fallback;

export function useRscReadingHistory({
    accessToken,
    createOneCardReading,
    initialReadingsResource,
    listReadings
}: UseRscReadingHistoryOptions): UseRscReadingHistoryResult {
    const initialReadings = initialReadingsResource
        ? use(initialReadingsResource).readings
        : [];
    const [error, setError] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [latestReading, setLatestReading] = useState<ReadingResponse | null>(null);
    const [readings, setReadings] = useState<ReadingHistoryItem[]>(initialReadings);

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
        if (initialReadingsResource) {
            return;
        }

        void refresh();
    }, [initialReadingsResource, refresh]);

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
