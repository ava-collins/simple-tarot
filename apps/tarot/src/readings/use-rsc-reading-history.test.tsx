import TestRenderer, { act } from 'react-test-renderer';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import {
    useRscReadingHistory,
    type UseRscReadingHistoryResult
} from './use-rsc-reading-history';
import type { ReadingHistoryResponse, ReadingResponse } from './reading-contracts';

const historyResponse: ReadingHistoryResponse = {
    readings: [
        {
            createdAt: '2026-07-02T14:00:00.000Z',
            metadata: {
                itemCount: 1,
                mode: 'local',
                modelId: 'local-test-variant-1'
            },
            question: 'What should I notice today?',
            readingId: 'local-single_card-0',
            spread: 'single_card',
            summary: 'Local test reading variant 1: one clear card anchors the moment.'
        }
    ]
};

const readingResponse: ReadingResponse = {
    citations: [],
    metadata: {
        itemCount: 1,
        mode: 'local',
        modelId: 'local-test-variant-1'
    },
    positions: [],
    readingId: 'local-single_card-0',
    spread: 'single_card',
    summary: 'Local test reading variant 1: one clear card anchors the moment.'
};

function HookProbe({
    accessToken,
    createOneCardReading,
    listReadings,
    onRender
}: {
    accessToken: string | null;
    createOneCardReading: (input: {
        accessToken: string;
        question?: string;
    }) => Promise<ReadingResponse>;
    listReadings: (accessToken: string) => Promise<ReadingHistoryResponse>;
    onRender: (result: UseRscReadingHistoryResult) => void;
}) {
    onRender(
        useRscReadingHistory({
            accessToken,
            createOneCardReading,
            listReadings
        })
    );

    return null;
}

describe('useRscReadingHistory', () => {
    beforeEach(() => {
        (
            globalThis as typeof globalThis & {
                IS_REACT_ACT_ENVIRONMENT: boolean;
            }
        ).IS_REACT_ACT_ENVIRONMENT = true;
        const consoleError = console.error;

        vi.spyOn(console, 'error').mockImplementation((message?: unknown, ...args) => {
            const text = typeof message === 'string' ? message : '';

            if (
                text.includes('react-test-renderer is deprecated') ||
                text.includes(
                    'The current testing environment is not configured to support act'
                )
            ) {
                return;
            }

            consoleError(message, ...args);
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('loads successful readings for signed-in users', async () => {
        const listReadings = vi.fn().mockResolvedValue(historyResponse);
        const createOneCardReading = vi.fn().mockResolvedValue(readingResponse);
        let result: UseRscReadingHistoryResult | undefined;

        await act(async () => {
            TestRenderer.create(
                <HookProbe
                    accessToken="access-token"
                    createOneCardReading={createOneCardReading}
                    listReadings={listReadings}
                    onRender={nextResult => {
                        result = nextResult;
                    }}
                />
            );
        });

        expect(listReadings).toHaveBeenCalledWith('access-token');
        expect(result?.readings).toEqual(historyResponse.readings);
        expect(result?.error).toBeNull();
    });

    it('generates a reading through the server function and refreshes history', async () => {
        const listReadings = vi.fn().mockResolvedValue(historyResponse);
        const createOneCardReading = vi.fn().mockResolvedValue(readingResponse);
        let result: UseRscReadingHistoryResult | undefined;

        await act(async () => {
            TestRenderer.create(
                <HookProbe
                    accessToken="access-token"
                    createOneCardReading={createOneCardReading}
                    listReadings={listReadings}
                    onRender={nextResult => {
                        result = nextResult;
                    }}
                />
            );
        });

        await act(async () => {
            await result?.createTestReading('What should I notice today?');
        });

        expect(createOneCardReading).toHaveBeenCalledWith({
            accessToken: 'access-token',
            question: 'What should I notice today?'
        });
        expect(listReadings).toHaveBeenCalledTimes(2);
        expect(result?.latestReading).toEqual(readingResponse);
    });

    it('does not call server functions without an access token', async () => {
        const listReadings = vi.fn().mockResolvedValue(historyResponse);
        const createOneCardReading = vi.fn().mockResolvedValue(readingResponse);

        await act(async () => {
            TestRenderer.create(
                <HookProbe
                    accessToken={null}
                    createOneCardReading={createOneCardReading}
                    listReadings={listReadings}
                    onRender={() => undefined}
                />
            );
        });

        expect(listReadings).not.toHaveBeenCalled();
        expect(createOneCardReading).not.toHaveBeenCalled();
    });
});
