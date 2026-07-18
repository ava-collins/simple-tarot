import {
    BedrockAgentRuntimeClient,
    RetrieveCommand,
    type RetrieveCommandOutput
} from '@aws-sdk/client-bedrock-agent-runtime';
import type { AppLogger } from '../logger';
import { logger } from '../logger';
import {
    BedrockRetrievalUnavailableError,
    BedrockThrottledError
} from './errors';
import type {
    ExplicitBedrockConfig,
    KnowledgeBaseRetriever
} from './explicit-rag-types';

type RetrieveSender = {
    send(command: RetrieveCommand): Promise<RetrieveCommandOutput>;
};

type RetrieverOptions = {
    logError?: AppLogger['logError'];
    logInfo?: AppLogger['logInfo'];
    now?: () => number;
};

const isThrottling = (error: unknown): boolean =>
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    error.name === 'ThrottlingException';

export function createKnowledgeBaseRetriever(
    config: ExplicitBedrockConfig,
    sender: RetrieveSender = new BedrockAgentRuntimeClient({
        maxAttempts: config.maxAttempts,
        region: config.region
    }),
    options: RetrieverOptions = {}
): KnowledgeBaseRetriever {
    const logError = options.logError ?? logger.logError;
    const logInfo = options.logInfo ?? logger.logInfo;
    const now = options.now ?? Date.now;

    return {
        async retrieve(input) {
            const startedAt = now();

            try {
                const output = await sender.send(
                    new RetrieveCommand({
                        knowledgeBaseId: config.knowledgeBaseId,
                        retrievalConfiguration: {
                            vectorSearchConfiguration: {
                                filter: input.filter,
                                numberOfResults: config.retrievalResults
                            }
                        },
                        retrievalQuery: { text: input.query }
                    })
                );
                const results = (output.retrievalResults ?? []).map(result => ({
                    text: result.content?.text
                }));

                logInfo('Bedrock retrieval completed.', {
                    durationMs: Math.max(0, now() - startedAt),
                    knowledgeBaseId: config.knowledgeBaseId,
                    requestId: input.requestId,
                    requestedResultCount: config.retrievalResults,
                    resultCount: results.length,
                    zeroResults: results.length === 0
                });

                return results;
            } catch (error) {
                const safeError = isThrottling(error)
                    ? new BedrockThrottledError()
                    : new BedrockRetrievalUnavailableError({ cause: error });

                logError('Bedrock retrieval failed.', safeError, {
                    durationMs: Math.max(0, now() - startedAt),
                    knowledgeBaseId: config.knowledgeBaseId,
                    requestId: input.requestId
                });
                throw safeError;
            }
        }
    };
}
