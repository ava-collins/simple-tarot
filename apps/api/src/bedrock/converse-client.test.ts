import { describe, expect, it } from 'vitest';
import { createConverseGenerator } from './converse-client';
import {
    BedrockGenerationUnavailableError,
    BedrockThrottledError
} from './errors';
import type {
    ExplicitBedrockConfig,
    GenerationPrompt
} from './explicit-rag-types';

const config: ExplicitBedrockConfig = {
    knowledgeBaseId: 'KB123',
    maxAttempts: 5,
    modelArn: 'global.anthropic.claude-sonnet-4-5-20250929-v1:0',
    region: 'us-east-1',
    retrievalResults: 5
};

const prompt: GenerationPrompt = {
    system: 'private-system-prompt-marker',
    user: 'private-user-prompt-marker'
};

describe('createConverseGenerator', () => {
    it('sends one Converse command and joins text output blocks', async () => {
        const sentInputs: unknown[] = [];
        let now = 10;
        const generator = createConverseGenerator(
            config,
            {
                send: async command => {
                    sentInputs.push(command.input);

                    return {
                        output: {
                            message: {
                                content: [
                                    { text: 'Overall reading.' },
                                    { text: 'Card interpretation.' }
                                ],
                                role: 'assistant'
                            }
                        },
                        stopReason: 'end_turn',
                        usage: {
                            inputTokens: 42,
                            outputTokens: 7,
                            totalTokens: 49
                        }
                    };
                }
            },
            {
                logError: () => {},
                logInfo: () => {},
                now: () => {
                    now += 5;
                    return now;
                }
            }
        );

        await expect(generator.generate(prompt, 'request-123')).resolves.toEqual({
            generated: {
                citations: [],
                mode: 'bedrock',
                modelId: config.modelArn,
                text: 'Overall reading.\nCard interpretation.'
            },
            trace: {
                durationMs: 5,
                inputTokens: 42,
                modelId: config.modelArn,
                outputCharacterCount: 37,
                outputTokens: 7,
                stopReason: 'end_turn'
            }
        });
        expect(sentInputs).toEqual([
            {
                inferenceConfig: {
                    maxTokens: 3_072,
                    temperature: 0.7
                },
                messages: [
                    {
                        role: 'user',
                        content: [{ text: 'private-user-prompt-marker' }]
                    }
                ],
                modelId: config.modelArn,
                system: [{ text: 'private-system-prompt-marker' }]
            }
        ]);
    });

    it('logs only safe Converse boundary metadata', async () => {
        const logs: unknown[] = [];
        let now = 10;
        const generator = createConverseGenerator(
            config,
            {
                send: async () => ({
                    output: {
                        message: {
                            content: [{ text: 'private-output-marker' }],
                            role: 'assistant'
                        }
                    },
                    stopReason: 'end_turn',
                    usage: {
                        inputTokens: 42,
                        outputTokens: 7,
                        totalTokens: 49
                    }
                })
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

        await generator.generate(prompt, 'request-123');

        expect(logs).toEqual([
            {
                context: {
                    durationMs: 5,
                    inputTokens: 42,
                    modelArn: config.modelArn,
                    outputLength: 21,
                    outputTokens: 7,
                    requestId: 'request-123',
                    stopReason: 'end_turn',
                    systemLength: 28,
                    userLength: 26
                },
                message: 'Bedrock Converse completed.'
            }
        ]);
        expect(JSON.stringify(logs)).not.toMatch(
            /private-system-prompt-marker|private-user-prompt-marker|private-output-marker/
        );
    });

    it('rejects whitespace and non-text output safely', async () => {
        const generator = createConverseGenerator(
            config,
            {
                send: async () => ({
                    output: {
                        message: {
                            content: [
                                { text: '   ' },
                                { image: { format: 'png', source: { bytes: 'x' } } }
                            ],
                            role: 'assistant'
                        }
                    },
                    stopReason: 'end_turn'
                })
            },
            {
                logError: () => {},
                logInfo: () => {},
                now: () => 100
            }
        );

        await expect(generator.generate(prompt)).rejects.toBeInstanceOf(
            BedrockGenerationUnavailableError
        );
    });

    it('rejects truncated max-token output safely', async () => {
        const generator = createConverseGenerator(
            config,
            {
                send: async () => ({
                    output: {
                        message: {
                            content: [{ text: 'private-truncated-output-marker' }],
                            role: 'assistant'
                        }
                    },
                    stopReason: 'max_tokens'
                })
            },
            {
                logError: () => {},
                logInfo: () => {},
                now: () => 100
            }
        );

        await expect(generator.generate(prompt)).rejects.toBeInstanceOf(
            BedrockGenerationUnavailableError
        );
    });

    it('converts throttling to the safe throttling boundary error', async () => {
        const generator = createConverseGenerator(
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

        await expect(generator.generate(prompt)).rejects.toBeInstanceOf(
            BedrockThrottledError
        );
    });

    it('wraps other failures without logging prompts, output, or raw errors', async () => {
        const logs: unknown[] = [];
        const generator = createConverseGenerator(
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

        await expect(
            generator.generate(prompt, 'request-123')
        ).rejects.toBeInstanceOf(BedrockGenerationUnavailableError);
        expect(JSON.stringify(logs)).not.toMatch(
            /private-system-prompt-marker|private-user-prompt-marker|private-output-marker|private-raw-error-marker/
        );
    });
});
