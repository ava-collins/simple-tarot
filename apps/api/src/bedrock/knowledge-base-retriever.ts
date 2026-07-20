import {
    BedrockAgentRuntimeClient,
    RetrieveCommand,
    type RetrieveCommandOutput,
    type RetrievalResultLocation
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

const documentIdFor = (
    location: RetrievalResultLocation | undefined
): string | undefined => {
    if (location?.type !== 'S3' || !location.s3Location?.uri) {
        return undefined;
    }

    try {
        const filename = new URL(location.s3Location.uri).pathname.split('/').pop();

        return filename?.endsWith('.txt') ? filename.slice(0, -4) : undefined;
    } catch {
        return undefined;
    }
};

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
                const results = (output.retrievalResults ?? []).map(result => {
                    const documentId = documentIdFor(result.location);

                    return {
                        ...(documentId === undefined ? {} : { documentId }),
                        ...(result.score === undefined
                            ? {}
                            : { score: result.score }),
                        ...(result.content?.text === undefined
                            ? {}
                            : { text: result.content.text })
                    };
                });
                const durationMs = Math.max(0, now() - startedAt);

                logInfo('Bedrock retrieval completed.', {
                    durationMs,
                    knowledgeBaseId: config.knowledgeBaseId,
                    requestId: input.requestId,
                    requestedResultCount: config.retrievalResults,
                    resultCount: results.length,
                    zeroResults: results.length === 0
                });

                return {
                    durationMs,
                    requestedResultCount: config.retrievalResults,
                    results
                };
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
