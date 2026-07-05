import { describe, expect, it, vi } from 'vitest';
import { AuthenticatedUser } from '../auth/auth-context';
import { GeneratedReading, ReadingRequest } from '../readings/contracts';
import { ReadingHistoryRecord, ReadingHistoryStore } from '../readings/persistence/contracts';
import {
    createListReadingsHandler,
    createPostReadingHandler
} from './readings';

const requestBody: ReadingRequest = {
    spread: 'single_card',
    question: 'What should I notice today?',
    items: [
        {
            cardIndex: 0,
            cardName: 'The Star',
            position: 'guidance',
            reversed: false
        }
    ]
};

const generatedReading: GeneratedReading = {
    citations: [],
    modelId: 'local-test-variant-1',
    text: [
        'Local test reading variant 1: one clear card anchors the moment.',
        'guidance: The Star upright highlights a simple next step.'
    ].join('\n')
};

const authenticatedUser: AuthenticatedUser = {
    claims: {
        sub: 'user-sub-123'
    },
    userId: 'user-sub-123'
};

const createStore = (): ReadingHistoryStore => ({
    listSuccessfulReadingsByUser: vi.fn(),
    saveFailedReadingAttempt: vi.fn(),
    saveSuccessfulReading: vi.fn()
});

const createResponse = () => {
    const response = {
        locals: {
            authenticatedUser,
            requestId: 'request-123'
        },
        json: vi.fn(),
        status: vi.fn()
    };

    response.status.mockReturnValue(response);

    return response;
};

const createRequest = (body: unknown = requestBody) =>
    ({
        body,
        header: vi.fn((name: string) =>
            name.toLowerCase() === 'user-agent' ? 'SimpleTarot/1.0' : undefined
        ),
        ip: '203.0.113.42',
        method: 'POST',
        originalUrl: '/readings'
    }) as never;

describe('createPostReadingHandler', () => {
    it('persists successful authenticated readings and emits an API log event', async () => {
        const store = createStore();
        const apiLogSink = {
            write: vi.fn().mockResolvedValue(undefined)
        };
        const handler = createPostReadingHandler({
            apiLogSink,
            generateReading: vi.fn().mockResolvedValue(generatedReading),
            now: vi.fn().mockReturnValue(new Date('2026-07-02T14:00:00.000Z')),
            readingHistoryStore: store
        });
        const response = createResponse();
        const next = vi.fn();

        await handler(createRequest(), response as never, next);

        expect(response.status).toHaveBeenCalledWith(200);
        expect(response.json).toHaveBeenCalledWith({
            citations: [],
            metadata: {
                itemCount: 1,
                mode: 'local',
                modelId: 'local-test-variant-1'
            },
            positions: [
                {
                    cardIndex: 0,
                    cardName: 'The Star',
                    position: 'guidance',
                    reversed: false,
                    text: 'guidance: The Star upright highlights a simple next step.'
                }
            ],
            readingId: 'local-single_card-0',
            spread: 'single_card',
            summary: 'Local test reading variant 1: one clear card anchors the moment.'
        });
        expect(store.saveSuccessfulReading).toHaveBeenCalledWith({
            createdAt: '2026-07-02T14:00:00.000Z',
            generatedReading,
            readingResponse: response.json.mock.calls[0][0],
            request: requestBody,
            requestId: 'request-123',
            userId: 'user-sub-123'
        });
        expect(apiLogSink.write).toHaveBeenCalledWith(
            expect.objectContaining({
                cognitoSub: 'user-sub-123',
                hasQuestion: true,
                method: 'POST',
                readingId: 'local-single_card-0',
                requestId: 'request-123',
                route: '/readings',
                sourceIp: '203.0.113.42',
                statusCode: 200,
                timestamp: '2026-07-02T14:00:00.000Z',
                userAgent: 'SimpleTarot/1.0'
            })
        );
        expect(next).not.toHaveBeenCalled();
    });

    it('persists failed generation attempts and excludes them from user-facing responses', async () => {
        const store = createStore();
        const apiLogSink = {
            write: vi.fn().mockResolvedValue(undefined)
        };
        const error = Object.assign(new Error('local fixture failed'), {
            code: 'LOCAL_READING_GENERATION_FAILED',
            status: 500
        });
        const handler = createPostReadingHandler({
            apiLogSink,
            generateReading: vi.fn().mockRejectedValue(error),
            now: vi.fn().mockReturnValue(new Date('2026-07-02T14:01:00.000Z')),
            readingHistoryStore: store
        });
        const response = createResponse();
        const next = vi.fn();

        await handler(createRequest(), response as never, next);

        expect(store.saveFailedReadingAttempt).toHaveBeenCalledWith({
            createdAt: '2026-07-02T14:01:00.000Z',
            failure: {
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Unexpected API error.',
                statusCode: 500
            },
            generationMetadata: {
                itemCount: 1,
                mode: 'local'
            },
            request: requestBody,
            requestId: 'request-123',
            userId: 'user-sub-123'
        });
        expect(response.json).not.toHaveBeenCalled();
        expect(apiLogSink.write).toHaveBeenCalledWith(
            expect.objectContaining({
                errorCode: 'INTERNAL_SERVER_ERROR',
                errorMessage: 'Unexpected API error.',
                hasQuestion: true,
                statusCode: 500
            })
        );
        expect(next).toHaveBeenCalledWith(error);
    });
});

describe('createListReadingsHandler', () => {
    it('returns newest-first successful history for the authenticated user', async () => {
        const record: ReadingHistoryRecord = {
            createdAt: '2026-07-02T14:00:00.000Z',
            entityType: 'reading',
            generatedReading,
            generationMetadata: {
                itemCount: 1,
                mode: 'local',
                modelId: 'local-test-variant-1'
            },
            pk: 'USER#user-sub-123',
            question: 'What should I notice today?',
            readingId: 'local-single_card-0',
            readingResponse: {
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
            },
            request: requestBody,
            schemaVersion: 1,
            sk: 'READING#2026-07-02T14:00:00.000Z#local-single_card-0',
            spread: 'single_card',
            updatedAt: '2026-07-02T14:00:00.000Z',
            userId: 'user-sub-123'
        };
        const store = createStore();
        vi.mocked(store.listSuccessfulReadingsByUser).mockResolvedValue([record]);
        const handler = createListReadingsHandler({
            readingHistoryStore: store
        });
        const response = createResponse();
        const next = vi.fn();

        await handler(
            {
                method: 'GET',
                originalUrl: '/readings',
                query: {
                    limit: '25'
                }
            } as never,
            response as never,
            next
        );

        expect(store.listSuccessfulReadingsByUser).toHaveBeenCalledWith({
            limit: 25,
            userId: 'user-sub-123'
        });
        expect(response.status).toHaveBeenCalledWith(200);
        expect(response.json).toHaveBeenCalledWith({
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
        });
        expect(next).not.toHaveBeenCalled();
    });
});
