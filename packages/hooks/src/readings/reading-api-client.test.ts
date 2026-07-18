import { afterEach, describe, expect, it, vi } from 'vitest';

import {
    createOneCardReadingRequest,
    createTarotApiClient,
    type ReadingRequest
} from '../../index';

const readingRequest: ReadingRequest = {
    spread: 'single_card',
    question: 'What should I notice today?',
    items: [
        {
            cardIndex: 0,
            cardName: 'Fool',
            position: 'guidance',
            reversed: false
        }
    ]
};

const readingResponse = {
    citations: [],
    metadata: {
        itemCount: 1,
        mode: 'local' as const,
        modelId: 'local-test-variant-1'
    },
    positions: [],
    readingId: 'local-single_card-0',
    spread: 'single_card',
    summary: 'Local test reading variant 1: one clear card anchors the moment.'
};

const jsonResponse = (body: unknown, ok = true, status = 200) => ({
    headers: {
        get: vi.fn((name: string) =>
            name.toLowerCase() === 'content-type' ? 'application/json' : null
        )
    },
    ok,
    status,
    text: vi.fn().mockResolvedValue(JSON.stringify(body))
});

describe('createOneCardReadingRequest', () => {
    it('creates a single-card reading request with a trimmed question', () => {
        expect(createOneCardReadingRequest('  What should I notice today?  ')).toEqual(
            readingRequest
        );
    });

    it('omits the question when it is blank', () => {
        expect(createOneCardReadingRequest('   ')).toEqual({
            spread: 'single_card',
            items: [
                {
                    cardIndex: 0,
                    cardName: 'Fool',
                    position: 'guidance',
                    reversed: false
                }
            ]
        });
    });
});

describe('createTarotApiClient', () => {
    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    it('posts readings with the Cognito access token', async () => {
        const fetchMock = vi.fn().mockResolvedValue(jsonResponse(readingResponse));
        vi.stubGlobal('fetch', fetchMock);

        const client = createTarotApiClient({
            accessToken: 'access-token',
            baseUrl: 'https://api.example.com/dev/'
        });

        await expect(client.createReading(readingRequest)).resolves.toEqual(
            readingResponse
        );
        expect(fetchMock).toHaveBeenCalledWith('https://api.example.com/dev/readings', {
            body: JSON.stringify(readingRequest),
            headers: {
                Authorization: 'Bearer access-token',
                'Content-Type': 'application/json'
            },
            method: 'POST'
        });
    });

    it('fetches reading history with the Cognito access token', async () => {
        const historyResponse = {
            readings: [
                {
                    createdAt: '2026-07-02T14:00:00.000Z',
                    metadata: readingResponse.metadata,
                    question: 'What should I notice today?',
                    readingId: 'local-single_card-0',
                    spread: 'single_card',
                    summary:
                        'Local test reading variant 1: one clear card anchors the moment.'
                }
            ]
        };
        const fetchMock = vi.fn().mockResolvedValue(jsonResponse(historyResponse));
        vi.stubGlobal('fetch', fetchMock);

        const client = createTarotApiClient({
            accessToken: 'access-token',
            baseUrl: 'https://api.example.com/dev'
        });

        await expect(client.listReadings()).resolves.toEqual(historyResponse);
        expect(fetchMock).toHaveBeenCalledWith(
            'https://api.example.com/dev/readings',
            {
                headers: {
                    Authorization: 'Bearer access-token'
                },
                method: 'GET'
            }
        );
    });

    it('surfaces API error messages when reading requests fail', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn().mockResolvedValue(
                jsonResponse(
                    {
                        message: 'Authentication is required.'
                    },
                    false,
                    401
                )
            )
        );

        const client = createTarotApiClient({
            accessToken: 'access-token',
            baseUrl: 'https://api.example.com/dev'
        });

        await expect(client.listReadings()).rejects.toThrow(
            'Authentication is required.'
        );
    });

    it('logs response diagnostics when the API returns non-JSON content', async () => {
        const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        vi.stubGlobal(
            'fetch',
            vi.fn().mockResolvedValue({
                headers: {
                    get: vi.fn((name: string) =>
                        name.toLowerCase() === 'content-type'
                            ? 'text/html; charset=utf-8'
                            : null
                    )
                },
                ok: false,
                status: 404,
                text: vi.fn().mockResolvedValue('<html>Not Found</html>')
            })
        );

        const client = createTarotApiClient({
            accessToken: 'access-token',
            baseUrl: 'https://api.example.com'
        });

        await expect(client.listReadings()).rejects.toThrow(
            'API returned text/html; charset=utf-8 for GET https://api.example.com/readings with status 404.'
        );
        expect(consoleWarn).toHaveBeenCalledWith('[tarot-api] non-json response', {
            bodyPreview: '<html>Not Found</html>',
            contentType: 'text/html; charset=utf-8',
            method: 'GET',
            status: 404,
            url: 'https://api.example.com/readings'
        });
    });
});
