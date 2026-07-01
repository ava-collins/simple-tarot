import { describe, expect, it } from 'vitest';
import { createBedrockReadingGenerator } from './bedrock-client';

describe('createBedrockReadingGenerator', () => {
    it('sends RetrieveAndGenerate input and maps citations to GeneratedReading', async () => {
        const sentInputs: unknown[] = [];
        const generator = createBedrockReadingGenerator(
            {
                knowledgeBaseId: 'KB123',
                modelArn:
                    'global.anthropic.claude-sonnet-4-5-20250929-v1:0',
                maxAttempts: 5,
                region: 'us-east-1',
                retrievalResults: 3
            },
            {
                send: async command => {
                    sentInputs.push(command.input);

                    return {
                        output: {
                            text: 'Generated reading text.'
                        },
                        citations: [
                            {
                                retrievedReferences: [
                                    {
                                        content: {
                                            text: 'A new opening is available.'
                                        },
                                        location: {
                                            s3Location: {
                                                uri: 's3://bucket/corpus/fool.json'
                                            },
                                            type: 'S3'
                                        },
                                        metadata: {
                                            cardName: 'The Fool',
                                            position: 'situation'
                                        }
                                    }
                                ]
                            }
                        ]
                    };
                }
            },
            {
                logError: () => {},
                logInfo: () => {}
            }
        );

        await expect(generator.generateReading('Prompt text')).resolves.toEqual({
            citations: [
                {
                    sourceId: 's3://bucket/corpus/fool.json',
                    text: 'A new opening is available.',
                    metadata: {
                        cardName: 'The Fool',
                        position: 'situation'
                    }
                }
            ],
            modelId: 'global.anthropic.claude-sonnet-4-5-20250929-v1:0',
            text: 'Generated reading text.'
        });

        expect(sentInputs).toEqual([
            {
                input: {
                    text: 'Prompt text'
                },
                retrieveAndGenerateConfiguration: {
                    knowledgeBaseConfiguration: {
                        knowledgeBaseId: 'KB123',
                        modelArn:
                            'global.anthropic.claude-sonnet-4-5-20250929-v1:0',
                        retrievalConfiguration: {
                            vectorSearchConfiguration: {
                                numberOfResults: 3
                            }
                        }
                    },
                    type: 'KNOWLEDGE_BASE'
                }
            }
        ]);
    });

    it('logs Bedrock request boundaries without logging the full prompt', async () => {
        const logs: unknown[] = [];
        const generator = createBedrockReadingGenerator(
            {
                knowledgeBaseId: 'KB123',
                modelArn:
                    'global.anthropic.claude-sonnet-4-5-20250929-v1:0',
                maxAttempts: 5,
                region: 'us-east-1',
                retrievalResults: 3
            },
            {
                send: async () => ({
                    output: {
                        text: 'Generated reading text.'
                    }
                })
            },
            {
                logInfo: (_message, context) => logs.push(context),
                requestId: 'req-123'
            }
        );

        await generator.generateReading('Prompt text that should not be logged');

        expect(logs).toEqual([
            {
                knowledgeBaseId: 'KB123',
                modelArn:
                    'global.anthropic.claude-sonnet-4-5-20250929-v1:0',
                promptLength: 37,
                requestId: 'req-123',
                retrievalResults: 3
            },
            {
                citationCount: 0,
                modelArn:
                    'global.anthropic.claude-sonnet-4-5-20250929-v1:0',
                requestId: 'req-123',
                textLength: 23
            }
        ]);
    });
});
