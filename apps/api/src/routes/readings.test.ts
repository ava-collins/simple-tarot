import { describe, expect, it, vi } from 'vitest';
import { AuthenticatedUser } from '../auth/auth-context';
import { composeReadingContext } from '../composer/compose-reading';
import {
    ComposerDomainError,
    ComposerUnavailableError
} from '../composer/errors';
import {
    sanitizedComposerBundle,
    sanitizedComposerBundleV2,
    sanitizedSingleCardRequest
} from '../composer/test-fixture';
import { GeneratedReading, ReadingRequest } from '../readings/contracts';
import { ReadingHistoryRecord, ReadingHistoryStore } from '../readings/persistence/contracts';
import {
    ReadingExecutionError,
    type ReadingExecution,
    type ReadingExecutor
} from '../readings/reading-executor';
import { mapGeneratedReadingResponse } from '../readings/response-mapper';
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
    mode: 'local',
    modelId: 'local-test-variant-1',
    text: [
        'Local test reading variant 1: one clear card anchors the moment.',
        'guidance: The Star upright highlights a simple next step.'
    ].join('\n')
};

const disabledExecution: ReadingExecution = {
    composerMetadata: { composerMode: 'disabled' },
    generated: generatedReading,
    reading: mapGeneratedReadingResponse(requestBody, generatedReading)
};

const createExecutor = (
    result: ReadingExecution | Error = disabledExecution
): ReadingExecutor => ({
    execute:
        result instanceof Error
            ? vi.fn().mockRejectedValue(result)
            : vi.fn().mockResolvedValue(result)
});

const authenticatedUser: AuthenticatedUser = {
    claims: {
        iss: 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_example',
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

const createResponseForUser = (userId: string) => {
    const response = createResponse();

    response.locals.authenticatedUser = {
        claims: {
            sub: userId
        },
        userId
    };

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
    it('delegates one validated request and request ID to the executor', async () => {
        const executor = createExecutor();
        const handler = createPostReadingHandler({ executor });

        await handler(createRequest(), createResponse() as never, vi.fn());

        expect(executor.execute).toHaveBeenCalledWith(requestBody, 'request-123');
    });

    it('persists the enabled reading but neither trace nor resolved context', async () => {
        const context = composeReadingContext(
            sanitizedSingleCardRequest,
            sanitizedComposerBundle
        );
        const composerMetadata = {
            composerMode: 'enabled' as const,
            corpusVersion: context.corpusVersion,
            namedPairCount: 0,
            wholeSpreadCount: 0
        };
        const executor = createExecutor({
            composerMetadata,
            context,
            generated: generatedReading,
            reading: mapGeneratedReadingResponse(
                sanitizedSingleCardRequest,
                generatedReading,
                composerMetadata
            ),
            trace: {
                generation: {
                    durationMs: 1,
                    modelId: 'private-model-marker',
                    outputCharacterCount: generatedReading.text.length
                },
                prompt: {
                    system: 'private-system-marker',
                    user: 'private-user-marker'
                },
                retrieval: {
                    durationMs: 1,
                    filter: {
                        corpusVersion: context.corpusVersion,
                        documentKind: 'correspondence-theme',
                        status: 'approved'
                    },
                    query: 'private-query-marker',
                    requestedResultCount: 5,
                    results: [],
                    returnedResultCount: 0,
                    totalEvidenceCharacters: 0,
                    usableResultCount: 0
                }
            }
        });
        const store = createStore();
        const apiLogSink = { write: vi.fn().mockResolvedValue(undefined) };
        const handler = createPostReadingHandler({
            apiLogSink,
            executor,
            readingHistoryStore: store
        });

        const response = createResponse();

        await handler(
            createRequest(sanitizedSingleCardRequest),
            response as never,
            vi.fn()
        );

        expect(response.json).toHaveBeenCalledWith(
            expect.objectContaining({
                metadata: expect.objectContaining({
                    composerMode: 'enabled',
                    corpusVersion: context.corpusVersion,
                    namedPairCount: 0,
                    wholeSpreadCount: 0
                })
            })
        );
        expect(
            JSON.stringify(
                vi.mocked(store.saveSuccessfulReading).mock.calls[0]?.[0]
            )
        ).not.toMatch(
            /private-system-marker|private-user-marker|private-query-marker|resolvedContext|retrieval|prompt|trace/
        );
        expect(JSON.stringify(apiLogSink.write.mock.calls)).not.toMatch(
            /private-system-marker|private-user-marker|private-query-marker|resolvedContext|retrieval|prompt|trace/
        );
    });

    it('keeps deterministic single-card context and prompts internal', async () => {
        const context = composeReadingContext(
            sanitizedSingleCardRequest,
            sanitizedComposerBundleV2
        );
        const composerMetadata = {
            composerMode: 'enabled' as const,
            corpusVersion: context.corpusVersion,
            namedPairCount: 0,
            wholeSpreadCount: 0
        };
        const executor = createExecutor({
            composerMetadata,
            context,
            generated: generatedReading,
            reading: mapGeneratedReadingResponse(
                sanitizedSingleCardRequest,
                generatedReading,
                composerMetadata
            ),
            trace: {
                mode: 'deterministic',
                generation: {
                    durationMs: 1,
                    modelId: 'private-model-marker',
                    outputCharacterCount: generatedReading.text.length
                },
                prompt: {
                    system: 'private-system-marker',
                    user: 'private-theme-marker'
                }
            }
        });
        const store = createStore();
        const apiLogSink = { write: vi.fn().mockResolvedValue(undefined) };
        const handler = createPostReadingHandler({
            apiLogSink,
            executor,
            readingHistoryStore: store
        });
        const response = createResponse();

        await handler(
            createRequest(sanitizedSingleCardRequest),
            response as never,
            vi.fn()
        );

        const serializedResponse = JSON.stringify(response.json.mock.calls);
        const serializedPersistence = JSON.stringify(
            vi.mocked(store.saveSuccessfulReading).mock.calls
        );
        const serializedLogs = JSON.stringify(apiLogSink.write.mock.calls);

        expect(serializedResponse).not.toMatch(
            /private-system-marker|private-theme-marker|resolvedContext|prompt|trace|orientationKeywords|singleCardThemes|sourceIds|ruleIds/
        );
        expect(serializedPersistence).not.toMatch(
            /private-system-marker|private-theme-marker|resolvedContext|prompt|trace|orientationKeywords|singleCardThemes|sourceIds|ruleIds/
        );
        expect(serializedLogs).not.toMatch(
            /private-system-marker|private-theme-marker|resolvedContext|prompt|trace|orientationKeywords|singleCardThemes|sourceIds|ruleIds/
        );
    });

    it.each([
        new ComposerDomainError('INVALID_CARD_SELECTION'),
        new ComposerUnavailableError('PRIVATE_REASON_MARKER')
    ])('fails closed when enabled composition rejects', async error => {
        const handler = createPostReadingHandler({
            executor: createExecutor(
                new ReadingExecutionError(error, { composerMode: 'enabled' })
            )
        });
        const next = vi.fn();

        await handler(createRequest(), createResponse() as never, next);

        expect(next).toHaveBeenCalledWith(error);
    });

    it('persists only aggregate composer metadata when enabled generation fails', async () => {
        const context = composeReadingContext(
            sanitizedSingleCardRequest,
            sanitizedComposerBundle
        );
        const store = createStore();
        const error = new Error('generation failed');
        const handler = createPostReadingHandler({
            executor: createExecutor(
                new ReadingExecutionError(error, {
                    composerMode: 'enabled',
                    corpusVersion: context.corpusVersion,
                    namedPairCount: 0,
                    wholeSpreadCount: 0
                })
            ),
            generationMode: 'bedrock',
            readingHistoryStore: store
        });

        await handler(
            createRequest(sanitizedSingleCardRequest),
            createResponse() as never,
            vi.fn()
        );

        expect(store.saveFailedReadingAttempt).toHaveBeenCalledWith(
            expect.objectContaining({
                generationMetadata: {
                    composerMode: 'enabled',
                    corpusVersion: context.corpusVersion,
                    itemCount: 1,
                    mode: 'bedrock',
                    namedPairCount: 0,
                    wholeSpreadCount: 0
                }
            })
        );
        expect(
            JSON.stringify(
                vi.mocked(store.saveFailedReadingAttempt).mock.calls[0]?.[0]
                    .generationMetadata
            )
        ).not.toMatch(/prompt|theme|fact|support|sourceId|ruleId|cardName/);
    });

    it('persists successful authenticated readings and emits an API log event', async () => {
        const store = createStore();
        const apiLogSink = {
            write: vi.fn().mockResolvedValue(undefined)
        };
        const handler = createPostReadingHandler({
            apiLogSink,
            executor: createExecutor(),
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
                composerMode: 'disabled',
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
            cognitoIssuer: 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_example',
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
            executor: createExecutor(
                new ReadingExecutionError(error, {
                    composerMode: 'disabled'
                })
            ),
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
                composerMode: 'disabled',
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

    it('records Bedrock mode for failed Bedrock generation attempts', async () => {
        const store = createStore();
        const error = Object.assign(new Error('Bedrock throttled'), {
            name: 'ThrottlingException',
            $metadata: {
                httpStatusCode: 429
            }
        });
        const handler = createPostReadingHandler({
            executor: createExecutor(
                new ReadingExecutionError(error, {
                    composerMode: 'disabled'
                })
            ),
            generationMode: 'bedrock',
            now: vi.fn().mockReturnValue(new Date('2026-07-15T18:00:00.000Z')),
            readingHistoryStore: store
        });

        await handler(createRequest(), createResponse() as never, vi.fn());

        expect(store.saveFailedReadingAttempt).toHaveBeenCalledWith(
            expect.objectContaining({
                generationMetadata: {
                    composerMode: 'disabled',
                    itemCount: 1,
                    mode: 'bedrock'
                }
            })
        );
    });
});

describe('createListReadingsHandler', () => {
    it('returns newest-first successful history for the authenticated user', async () => {
        const record: ReadingHistoryRecord = {
            createdAt: '2026-07-02T14:00:00.000Z',
            entityType: 'reading',
            generatedReading,
            generationMetadata: {
                composerMode: 'disabled',
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
                    composerMode: 'disabled',
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
                        composerMode: 'disabled',
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

    it('keeps two authenticated users reading histories isolated by Cognito subject', async () => {
        const recordFor = (userId: string): ReadingHistoryRecord => ({
            createdAt: '2026-07-14T18:00:00.000Z',
            entityType: 'reading',
            generatedReading,
            generationMetadata: {
                composerMode: 'disabled',
                itemCount: 1,
                mode: 'local'
            },
            pk: `USER#${userId}`,
            question: `private-question-${userId}`,
            readingId: `reading-${userId}`,
            readingResponse: {
                citations: [],
                metadata: {
                    composerMode: 'disabled',
                    itemCount: 1,
                    mode: 'local'
                },
                positions: [],
                readingId: `reading-${userId}`,
                spread: 'single_card',
                summary: `private-summary-${userId}`
            },
            request: {
                ...requestBody,
                question: `private-question-${userId}`
            },
            schemaVersion: 1,
            sk: `READING#2026-07-14T18:00:00.000Z#reading-${userId}`,
            spread: 'single_card',
            updatedAt: '2026-07-14T18:00:00.000Z',
            userId
        });
        const store = createStore();
        vi.mocked(store.listSuccessfulReadingsByUser).mockImplementation(
            async ({ userId }) => [recordFor(userId)]
        );
        const handler = createListReadingsHandler({
            readingHistoryStore: store
        });
        const userAResponse = createResponseForUser('user-a');
        const userBResponse = createResponseForUser('user-b');
        const next = vi.fn();
        const request = {
            method: 'GET',
            originalUrl: '/readings',
            query: {}
        } as never;

        await handler(request, userAResponse as never, next);
        await handler(request, userBResponse as never, next);

        expect(store.listSuccessfulReadingsByUser).toHaveBeenNthCalledWith(1, {
            limit: undefined,
            userId: 'user-a'
        });
        expect(store.listSuccessfulReadingsByUser).toHaveBeenNthCalledWith(2, {
            limit: undefined,
            userId: 'user-b'
        });
        expect(userAResponse.json).toHaveBeenCalledWith({
            readings: [
                expect.objectContaining({
                    question: 'private-question-user-a',
                    readingId: 'reading-user-a'
                })
            ]
        });
        expect(userBResponse.json).toHaveBeenCalledWith({
            readings: [
                expect.objectContaining({
                    question: 'private-question-user-b',
                    readingId: 'reading-user-b'
                })
            ]
        });
        expect(JSON.stringify(userAResponse.json.mock.calls)).not.toContain(
            'private-question-user-b'
        );
        expect(JSON.stringify(userBResponse.json.mock.calls)).not.toContain(
            'private-question-user-a'
        );
        expect(next).not.toHaveBeenCalled();
    });
});
