import TestRenderer, { act } from 'react-test-renderer';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
    useReadingHistory,
    type UseReadingHistoryResult
} from './use-reading-history';
import type {
    ReadingHistoryResponse,
    ReadingResponse,
    TarotApiClient
} from '@simpletarot/hooks/server';

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

const createClient = (): TarotApiClient => ({
    createReading: vi.fn().mockResolvedValue(readingResponse),
    listReadings: vi.fn().mockResolvedValue(historyResponse)
});

function HookProbe({
    accessToken,
    client,
    onRender
}: {
    accessToken: string | null;
    client: TarotApiClient;
    onRender: (result: UseReadingHistoryResult) => void;
}) {
    onRender(
        useReadingHistory({
            accessToken,
            createClient: () => client
        })
    );

    return null;
}

describe('useReadingHistory', () => {
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
                text.includes('The current testing environment is not configured to support act')
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
        const client = createClient();
        let result: UseReadingHistoryResult | undefined;

        await act(async () => {
            TestRenderer.create(
                <HookProbe
                    accessToken="access-token"
                    client={client}
                    onRender={nextResult => {
                        result = nextResult;
                    }}
                />
            );
        });

        expect(client.listReadings).toHaveBeenCalledOnce();
        expect(result?.readings).toEqual(historyResponse.readings);
        expect(result?.error).toBeNull();
    });

    it('generates the local-test reading request and refreshes history', async () => {
        const client = createClient();
        let result: UseReadingHistoryResult | undefined;

        await act(async () => {
            TestRenderer.create(
                <HookProbe
                    accessToken="access-token"
                    client={client}
                    onRender={nextResult => {
                        result = nextResult;
                    }}
                />
            );
        });

        await act(async () => {
            await result?.createTestReading('What should I notice today?');
        });

        expect(client.createReading).toHaveBeenCalledWith({
            spread: 'single_card',
            question: 'What should I notice today?',
            items: [
                {
                    cardIndex: 0,
                    cardName: 'The Fool',
                    position: 'guidance',
                    reversed: false
                }
            ]
        });
        expect(client.listReadings).toHaveBeenCalledTimes(2);
        expect(result?.latestReading).toEqual(readingResponse);
    });

    it('does not call the API without an access token', async () => {
        const client = createClient();

        await act(async () => {
            TestRenderer.create(
                <HookProbe
                    accessToken={null}
                    client={client}
                    onRender={() => undefined}
                />
            );
        });

        expect(client.listReadings).not.toHaveBeenCalled();
        expect(client.createReading).not.toHaveBeenCalled();
    });
});
