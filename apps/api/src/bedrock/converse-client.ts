import {
    BedrockRuntimeClient,
    ConverseCommand,
    type ConverseCommandOutput
} from '@aws-sdk/client-bedrock-runtime';
import type { AppLogger } from '../logger';
import { logger } from '../logger';
import {
    GENERATION_TEMPERATURE,
    MAX_GENERATION_TOKENS
} from './constants';
import {
    BedrockGenerationUnavailableError,
    BedrockThrottledError
} from './errors';
import type {
    ConverseGenerator,
    ExplicitBedrockConfig
} from './explicit-rag-types';

type ConverseSender = {
    send(command: ConverseCommand): Promise<ConverseCommandOutput>;
};

type ConverseOptions = {
    logError?: AppLogger['logError'];
    logInfo?: AppLogger['logInfo'];
    now?: () => number;
};

const isThrottling = (error: unknown): boolean =>
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    error.name === 'ThrottlingException';

const safeGenerationErrorFor = (error: unknown): Error => {
    if (error instanceof BedrockGenerationUnavailableError) {
        return error;
    }

    if (isThrottling(error)) {
        return new BedrockThrottledError();
    }

    return new BedrockGenerationUnavailableError({ cause: error });
};

const responseTextFor = (output: ConverseCommandOutput): string =>
    (output.output?.message?.content ?? [])
        .flatMap(block =>
            'text' in block && typeof block.text === 'string'
                ? [block.text.trim()]
                : []
        )
        .filter(text => text.length > 0)
        .join('\n');

export function createConverseGenerator(
    config: ExplicitBedrockConfig,
    sender: ConverseSender = new BedrockRuntimeClient({
        maxAttempts: config.maxAttempts,
        region: config.region
    }),
    options: ConverseOptions = {}
): ConverseGenerator {
    const logError = options.logError ?? logger.logError;
    const logInfo = options.logInfo ?? logger.logInfo;
    const now = options.now ?? Date.now;

    return {
        async generate(prompt, requestId) {
            const startedAt = now();

            try {
                const output = await sender.send(
                    new ConverseCommand({
                        inferenceConfig: {
                            maxTokens: MAX_GENERATION_TOKENS,
                            temperature: GENERATION_TEMPERATURE
                        },
                        messages: [
                            {
                                role: 'user',
                                content: [{ text: prompt.user }]
                            }
                        ],
                        modelId: config.modelArn,
                        system: [{ text: prompt.system }]
                    })
                );
                const text = responseTextFor(output);

                if (output.stopReason === 'max_tokens' || text.length === 0) {
                    throw new BedrockGenerationUnavailableError();
                }

                logInfo('Bedrock Converse completed.', {
                    durationMs: Math.max(0, now() - startedAt),
                    inputTokens: output.usage?.inputTokens,
                    modelArn: config.modelArn,
                    outputLength: text.length,
                    outputTokens: output.usage?.outputTokens,
                    requestId,
                    stopReason: output.stopReason,
                    systemLength: prompt.system.length,
                    userLength: prompt.user.length
                });

                return {
                    citations: [],
                    mode: 'bedrock',
                    modelId: config.modelArn,
                    text
                };
            } catch (error) {
                const safeError = safeGenerationErrorFor(error);

                logError('Bedrock Converse failed.', safeError, {
                    durationMs: Math.max(0, now() - startedAt),
                    modelArn: config.modelArn,
                    requestId
                });
                throw safeError;
            }
        }
    };
}
