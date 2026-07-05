import { PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { describe, expect, it, vi } from 'vitest';
import { ReadingRequest, ReadingResponse, GeneratedReading } from '../contracts';
import {
    createDynamoDbReadingHistoryStore,
    toFailedReadingAttemptItem,
    toSuccessfulReadingItem
} from './dynamodb-reading-history-store';

const request: ReadingRequest = {
    spread: 'past-present-future',
    question: 'What should I understand about this project?',
    items: [
        {
            cardIndex: 0,
            cardName: 'The Magician',
            position: 'Past',
            reversed: false
        }
    ]
};

const readingResponse: ReadingResponse = {
    citations: [
        {
            metadata: {
                corpus: 'local'
            },
            sourceId: 'source-1',
            text: 'Source text'
        }
    ],
    metadata: {
        itemCount: 1,
        mode: 'local',
        modelId: 'local-test-variant-1'
    },
    positions: [
        {
            cardIndex: 0,
            cardName: 'The Magician',
            position: 'Past',
            reversed: false,
            text: 'A focused beginning shapes the situation.'
        }
    ],
    readingId: 'reading-123',
    spread: 'past-present-future',
    summary: 'Focus the tools already at hand.'
};

const generatedReading: GeneratedReading = {
    citations: readingResponse.citations,
    modelId: 'local-test-variant-1',
    text: 'Focus the tools already at hand.'
};

describe('toSuccessfulReadingItem', () => {
    it('serializes successful readings with user-owned keys and full reading payloads', () => {
        expect(
            toSuccessfulReadingItem({
                createdAt: '2026-07-02T14:00:00.000Z',
                generatedReading,
                readingResponse,
                request,
                requestId: 'request-123',
                userId: 'user-sub-123'
            })
        ).toEqual({
            createdAt: '2026-07-02T14:00:00.000Z',
            entityType: 'reading',
            generatedReading,
            generationMetadata: {
                itemCount: 1,
                mode: 'local',
                modelId: 'local-test-variant-1'
            },
            pk: 'USER#user-sub-123',
            question: 'What should I understand about this project?',
            readingId: 'reading-123',
            readingResponse,
            request,
            requestId: 'request-123',
            schemaVersion: 1,
            sk: 'READING#2026-07-02T14:00:00.000Z#reading-123',
            spread: 'past-present-future',
            updatedAt: '2026-07-02T14:00:00.000Z',
            userId: 'user-sub-123'
        });
    });

    it('omits optional fields when the request and generated reading do not provide them', () => {
        const item = toSuccessfulReadingItem({
            createdAt: '2026-07-02T14:00:00.000Z',
            generatedReading: {
                citations: [],
                text: 'A simple local reading.'
            },
            readingResponse: {
                ...readingResponse,
                metadata: {
                    itemCount: 1,
                    mode: 'local'
                }
            },
            request: {
                items: request.items,
                spread: request.spread
            },
            userId: 'user-sub-123'
        });

        expect(item).not.toHaveProperty('question');
        expect(item).not.toHaveProperty('requestId');
        expect(item.generationMetadata).not.toHaveProperty('modelId');
    });
});

describe('toFailedReadingAttemptItem', () => {
    it('serializes failed attempts separately from user-facing reading history', () => {
        expect(
            toFailedReadingAttemptItem({
                createdAt: '2026-07-02T14:01:00.000Z',
                failure: {
                    code: 'BEDROCK_THROTTLED',
                    message: 'Bedrock is throttling reading generation.',
                    service: 'bedrock',
                    statusCode: 429
                },
                generationMetadata: {
                    itemCount: 1,
                    mode: 'local',
                    modelId: 'local-test-variant-1'
                },
                request,
                requestId: 'request-456',
                userId: 'user-sub-123'
            })
        ).toEqual({
            createdAt: '2026-07-02T14:01:00.000Z',
            entityType: 'readingAttempt',
            failure: {
                code: 'BEDROCK_THROTTLED',
                message: 'Bedrock is throttling reading generation.',
                service: 'bedrock',
                statusCode: 429
            },
            generationMetadata: {
                itemCount: 1,
                mode: 'local',
                modelId: 'local-test-variant-1'
            },
            pk: 'USER#user-sub-123',
            question: 'What should I understand about this project?',
            request,
            requestId: 'request-456',
            schemaVersion: 1,
            sk: 'READING_ATTEMPT#2026-07-02T14:01:00.000Z#request-456',
            spread: 'past-present-future',
            status: 'failed',
            updatedAt: '2026-07-02T14:01:00.000Z',
            userId: 'user-sub-123'
        });
    });
});

describe('createDynamoDbReadingHistoryStore', () => {
    it('puts successful reading items into the configured table', async () => {
        const send = vi.fn().mockResolvedValue({});
        const store = createDynamoDbReadingHistoryStore({
            client: {
                send
            },
            tableName: 'simple-tarot-dev-user-data'
        });

        await store.saveSuccessfulReading({
            createdAt: '2026-07-02T14:00:00.000Z',
            generatedReading,
            readingResponse,
            request,
            userId: 'user-sub-123'
        });

        expect(send).toHaveBeenCalledWith(expect.any(PutCommand));
        expect(send.mock.calls[0][0].input).toMatchObject({
            TableName: 'simple-tarot-dev-user-data',
            Item: {
                pk: 'USER#user-sub-123',
                sk: 'READING#2026-07-02T14:00:00.000Z#reading-123'
            }
        });
    });

    it('puts failed reading attempts into the configured table', async () => {
        const send = vi.fn().mockResolvedValue({});
        const store = createDynamoDbReadingHistoryStore({
            client: {
                send
            },
            tableName: 'simple-tarot-dev-user-data'
        });

        await store.saveFailedReadingAttempt({
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
            request,
            requestId: 'request-456',
            userId: 'user-sub-123'
        });

        expect(send).toHaveBeenCalledWith(expect.any(PutCommand));
        expect(send.mock.calls[0][0].input).toMatchObject({
            TableName: 'simple-tarot-dev-user-data',
            Item: {
                entityType: 'readingAttempt',
                pk: 'USER#user-sub-123',
                sk: 'READING_ATTEMPT#2026-07-02T14:01:00.000Z#request-456',
                status: 'failed'
            }
        });
    });

    it('queries newest-first successful readings without returning failed attempts', async () => {
        const item = toSuccessfulReadingItem({
            createdAt: '2026-07-02T14:00:00.000Z',
            generatedReading,
            readingResponse,
            request,
            userId: 'user-sub-123'
        });
        const send = vi.fn().mockResolvedValue({
            Items: [item]
        });
        const store = createDynamoDbReadingHistoryStore({
            client: {
                send
            },
            tableName: 'simple-tarot-dev-user-data'
        });

        await expect(
            store.listSuccessfulReadingsByUser({
                limit: 25,
                userId: 'user-sub-123'
            })
        ).resolves.toEqual([item]);

        expect(send).toHaveBeenCalledWith(expect.any(QueryCommand));
        expect(send.mock.calls[0][0].input).toEqual({
            ExpressionAttributeValues: {
                ':pk': 'USER#user-sub-123',
                ':skPrefix': 'READING#'
            },
            KeyConditionExpression: 'pk = :pk AND begins_with(sk, :skPrefix)',
            Limit: 25,
            ScanIndexForward: false,
            TableName: 'simple-tarot-dev-user-data'
        });
    });
});
