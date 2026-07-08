import TestRenderer, { act } from 'react-test-renderer';
import type { ReactNode } from 'react';
import { Component, Suspense } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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
    initialReadingsResource,
    listReadings,
    onRender
}: {
    accessToken: string | null;
    createOneCardReading: (input: {
        accessToken: string;
        question?: string;
    }) => Promise<ReadingResponse>;
    initialReadingsResource?: Promise<ReadingHistoryResponse>;
    listReadings: (accessToken: string) => Promise<ReadingHistoryResponse>;
    onRender: (result: UseRscReadingHistoryResult) => void;
}) {
    onRender(
        useRscReadingHistory({
            accessToken,
            createOneCardReading,
            initialReadingsResource,
            listReadings
        })
    );

    return null;
}

class ErrorBoundary extends Component<
    { children: ReactNode; onError: (error: Error) => void },
    { hasError: boolean }
> {
    state = { hasError: false };

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error: Error) {
        this.props.onError(error);
    }

    render() {
        return this.state.hasError ? null : this.props.children;
    }
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
            const text = [message, ...args]
                .map(item =>
                    item instanceof Error
                        ? item.message
                        : typeof item === 'string'
                          ? item
                          : ''
                )
                .join(' ');

            if (
                text.includes('Initial readings failed.') ||
                text.includes('The above error occurred') ||
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

    it('seeds readings from a fulfilled initial resource without loading first', async () => {
        const listReadings = vi.fn().mockResolvedValue({ readings: [] });
        const createOneCardReading = vi.fn().mockResolvedValue(readingResponse);
        let result: UseRscReadingHistoryResult | undefined;

        await act(async () => {
            TestRenderer.create(
                <Suspense fallback={null}>
                    <HookProbe
                        accessToken="access-token"
                        createOneCardReading={createOneCardReading}
                        initialReadingsResource={Promise.resolve(historyResponse)}
                        listReadings={listReadings}
                        onRender={nextResult => {
                            result = nextResult;
                        }}
                    />
                </Suspense>
            );
        });

        expect(result?.readings).toEqual(historyResponse.readings);
        expect(result?.isLoading).toBe(false);
    });

    it('suspends while the initial readings resource is pending', async () => {
        const listReadings = vi.fn().mockResolvedValue(historyResponse);
        const createOneCardReading = vi.fn().mockResolvedValue(readingResponse);
        let result: UseRscReadingHistoryResult | undefined;

        let resolveResource: (value: ReadingHistoryResponse) => void = () => undefined;
        const initialReadingsResource = new Promise<ReadingHistoryResponse>(resolve => {
            resolveResource = resolve;
        });

        let renderer: TestRenderer.ReactTestRenderer | undefined;

        await act(async () => {
            renderer = TestRenderer.create(
                <Suspense fallback="Loading readings">
                    <HookProbe
                        accessToken="access-token"
                        createOneCardReading={createOneCardReading}
                        initialReadingsResource={initialReadingsResource}
                        listReadings={listReadings}
                        onRender={nextResult => {
                            result = nextResult;
                        }}
                    />
                </Suspense>
            );
        });

        expect(renderer?.toJSON()).toBe('Loading readings');
        expect(result).toBeUndefined();

        await act(async () => {
            resolveResource(historyResponse);
            await initialReadingsResource;
        });

        expect(result?.readings).toEqual(historyResponse.readings);
    });

    it('bubbles rejected initial readings resources to an error boundary', async () => {
        const listReadings = vi.fn().mockResolvedValue(historyResponse);
        const createOneCardReading = vi.fn().mockResolvedValue(readingResponse);
        const resourceError = new Error('Initial readings failed.');
        const onError = vi.fn();

        await act(async () => {
            TestRenderer.create(
                <ErrorBoundary onError={onError}>
                    <Suspense fallback={null}>
                        <HookProbe
                            accessToken="access-token"
                            createOneCardReading={createOneCardReading}
                            initialReadingsResource={Promise.reject(resourceError)}
                            listReadings={listReadings}
                            onRender={() => undefined}
                        />
                    </Suspense>
                </ErrorBoundary>
            );
        });

        expect(onError).toHaveBeenCalledWith(resourceError);
    });

    it('manual refresh still works after the initial readings resource resolves', async () => {
        const refreshedResponse: ReadingHistoryResponse = {
            readings: [
                {
                    ...historyResponse.readings[0],
                    readingId: 'refreshed-reading',
                    summary: 'A refreshed reading summary.'
                }
            ]
        };
        const listReadings = vi.fn().mockResolvedValue(refreshedResponse);
        const createOneCardReading = vi.fn().mockResolvedValue(readingResponse);
        let result: UseRscReadingHistoryResult | undefined;

        await act(async () => {
            TestRenderer.create(
                <Suspense fallback={null}>
                    <HookProbe
                        accessToken="access-token"
                        createOneCardReading={createOneCardReading}
                        initialReadingsResource={Promise.resolve(historyResponse)}
                        listReadings={listReadings}
                        onRender={nextResult => {
                            result = nextResult;
                        }}
                    />
                </Suspense>
            );
        });

        await act(async () => {
            await result?.refresh();
        });

        expect(result?.readings).toEqual(refreshedResponse.readings);
        expect(listReadings).toHaveBeenCalledWith('access-token');
    });
});
