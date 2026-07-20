import { describe, expect, it } from 'vitest';
import type { ExplicitBedrockConfig } from './explicit-rag-types';
import { BedrockRetrievalUnavailableError, BedrockThrottledError } from './errors';
import { createKnowledgeBaseRetriever } from './knowledge-base-retriever';

const config: ExplicitBedrockConfig = {
    knowledgeBaseId: 'KB123',
    maxAttempts: 5,
    modelArn: 'global.anthropic.claude-sonnet-4-5-20250929-v1:0',
    region: 'us-east-1',
    retrievalResults: 5
};

const retrievalFilter = {
    equals: {
        key: 'corpusVersion',
        value: 'a'.repeat(64)
    }
} as const;

describe('createKnowledgeBaseRetriever', () => {
    it('returns ranked text, scores, and normalized S3 document IDs', async () => {
        const logs: unknown[] = [];
        const sentInputs: unknown[] = [];
        const retriever = createKnowledgeBaseRetriever(
            config,
            {
                send: async command => {
                    sentInputs.push(command.input);

                    return {
                        retrievalResults: [
                            {
                                content: {
                                    text: 'private-content-marker-first',
                                    type: 'TEXT'
                                },
                                location: {
                                    s3Location: {
                                        uri: 's3://private-location-marker/corpus/active/document-first.txt'
                                    },
                                    type: 'S3'
                                },
                                metadata: {
                                    privateMetadata: 'private-metadata-marker'
                                },
                                score: 0.991234
                            },
                            {
                                content: {
                                    text: 'private-content-marker-second',
                                    type: 'TEXT'
                                },
                                location: {
                                    type: 'WEB',
                                    webLocation: {
                                        url: 'https://private-location-marker/document-second.txt'
                                    }
                                },
                                score: 0.5
                            },
                            {
                                content: {
                                    text: 'private-content-marker-third',
                                    type: 'TEXT'
                                },
                                location: {
                                    s3Location: {
                                        uri: 's3://private-location-marker/corpus/active/not-text.json'
                                    },
                                    type: 'S3'
                                }
                            }
                        ]
                    };
                }
            },
            {
                logError: () => {},
                logInfo: (message, context) => logs.push({ context, message }),
                now: () => 100
            }
        );

        await expect(
            retriever.retrieve({
                filter: retrievalFilter,
                query: 'User intent: General tarot reading.',
                requestId: 'request-123'
            })
        ).resolves.toEqual({
            durationMs: 0,
            requestedResultCount: 5,
            results: [
                {
                    documentId: 'document-first',
                    score: 0.991234,
                    text: 'private-content-marker-first'
                },
                { score: 0.5, text: 'private-content-marker-second' },
                { text: 'private-content-marker-third' }
            ]
        });
        expect(sentInputs).toEqual([
            {
                knowledgeBaseId: 'KB123',
                retrievalConfiguration: {
                    vectorSearchConfiguration: {
                        filter: retrievalFilter,
                        numberOfResults: 5
                    }
                },
                retrievalQuery: {
                    text: 'User intent: General tarot reading.'
                }
            }
        ]);
        expect(logs).toEqual([
            {
                context: {
                    durationMs: 0,
                    knowledgeBaseId: 'KB123',
                    requestId: 'request-123',
                    requestedResultCount: 5,
                    resultCount: 3,
                    zeroResults: false
                },
                message: 'Bedrock retrieval completed.'
            }
        ]);
        expect(JSON.stringify(logs)).not.toMatch(
            /private-content-marker|0\.991234|private-location-marker|private-metadata-marker/
        );
    });

    it('logs only safe retrieval boundary metadata for results and zero results', async () => {
        const logs: unknown[] = [];
        let now = 10;
        const retriever = createKnowledgeBaseRetriever(
            config,
            {
                send: async () => ({ retrievalResults: [] })
            },
            {
                logError: () => {},
                logInfo: (message, context) => logs.push({ context, message }),
                now: () => {
                    now += 5;
                    return now;
                }
            }
        );

        await expect(
            retriever.retrieve({
                filter: retrievalFilter,
                query: 'private-query-marker',
                requestId: 'request-123'
            })
        ).resolves.toEqual({
            durationMs: 5,
            requestedResultCount: 5,
            results: []
        });
        expect(logs).toEqual([
            {
                context: {
                    durationMs: 5,
                    knowledgeBaseId: 'KB123',
                    requestId: 'request-123',
                    requestedResultCount: 5,
                    resultCount: 0,
                    zeroResults: true
                },
                message: 'Bedrock retrieval completed.'
            }
        ]);
        expect(JSON.stringify(logs)).not.toMatch(
            /private-query-marker|private-location-marker|private-metadata-marker/
        );
    });

    it('converts throttling to the safe throttling boundary error', async () => {
        const retriever = createKnowledgeBaseRetriever(
            config,
            {
                send: async () => {
                    throw Object.assign(new Error('private-throttle-marker'), {
                        name: 'ThrottlingException'
                    });
                }
            },
            {
                logError: () => {},
                logInfo: () => {},
                now: () => 100
            }
        );

        const promise = retriever.retrieve({
            filter: retrievalFilter,
            query: 'private-query-marker'
        });

        await expect(promise).rejects.toBeInstanceOf(BedrockThrottledError);
        await expect(promise).rejects.not.toThrow('private-throttle-marker');
    });

    it('wraps other failures without exposing query, evidence, or raw error markers', async () => {
        const logs: unknown[] = [];
        const retriever = createKnowledgeBaseRetriever(
            config,
            {
                send: async () => {
                    throw new Error('private-raw-error-marker');
                }
            },
            {
                logError: (message, error, context) =>
                    logs.push({ context, error, message }),
                logInfo: () => {},
                now: () => 100
            }
        );

        const promise = retriever.retrieve({
            filter: retrievalFilter,
            query: 'private-query-marker',
            requestId: 'request-123'
        });

        await expect(promise).rejects.toBeInstanceOf(
            BedrockRetrievalUnavailableError
        );
        expect(JSON.stringify(logs)).not.toMatch(
            /private-query-marker|private-content-marker|private-score-marker|private-location-marker|private-metadata-marker|private-raw-error-marker/
        );
    });
});
