import {
    BedrockAgentRuntimeClient,
    RetrieveAndGenerateCommand,
    RetrieveAndGenerateCommandOutput
} from '@aws-sdk/client-bedrock-agent-runtime';
import { AppLogger, logger } from '../logger';
import { GeneratedReading, ReadingCitation } from '../readings/contracts';
import { BedrockReadingGenerator, BedrockReadingGeneratorConfig } from './types';

type BedrockRuntimeSender = {
    send(command: RetrieveAndGenerateCommand): Promise<RetrieveAndGenerateCommandOutput>;
};

type BedrockReadingGeneratorOptions = {
    logError?: AppLogger['logError'];
    logInfo?: AppLogger['logInfo'];
    requestId?: string;
};

const sourceIdFor = (
    reference: NonNullable<
        NonNullable<RetrieveAndGenerateCommandOutput['citations']>[number]['retrievedReferences']
    >[number]
): string => {
    const { location } = reference;

    return (
        location?.s3Location?.uri ??
        location?.webLocation?.url ??
        location?.confluenceLocation?.url ??
        location?.salesforceLocation?.url ??
        location?.sharePointLocation?.url ??
        location?.type ??
        'bedrock-reference'
    );
};

const mapCitations = (
    output: RetrieveAndGenerateCommandOutput
): ReadingCitation[] =>
    (output.citations ?? []).flatMap(citation =>
        (citation.retrievedReferences ?? []).map(reference => ({
            sourceId: sourceIdFor(reference),
            text: reference.content?.text ?? '',
            metadata: reference.metadata ?? {}
        }))
    );

export function createBedrockReadingGenerator(
    config: BedrockReadingGeneratorConfig,
    sender: BedrockRuntimeSender = new BedrockAgentRuntimeClient({
        maxAttempts: config.maxAttempts,
        region: config.region
    }),
    options: BedrockReadingGeneratorOptions = {}
): BedrockReadingGenerator {
    const logInfo = options.logInfo ?? logger.logInfo;
    const logError = options.logError ?? logger.logError;

    return {
        async generateReading(prompt: string): Promise<GeneratedReading> {
            logInfo('Bedrock RetrieveAndGenerate request started.', {
                knowledgeBaseId: config.knowledgeBaseId,
                modelArn: config.modelArn,
                promptLength: prompt.length,
                requestId: options.requestId,
                retrievalResults: config.retrievalResults
            });

            try {
                const output = await sender.send(
                    new RetrieveAndGenerateCommand({
                        input: {
                            text: prompt
                        },
                        retrieveAndGenerateConfiguration: {
                            knowledgeBaseConfiguration: {
                                knowledgeBaseId: config.knowledgeBaseId,
                                modelArn: config.modelArn,
                                retrievalConfiguration: {
                                    vectorSearchConfiguration: {
                                        numberOfResults: config.retrievalResults
                                    }
                                }
                            },
                            type: 'KNOWLEDGE_BASE'
                        }
                    })
                );
                const citations = mapCitations(output);
                const text = output.output?.text ?? '';

                logInfo('Bedrock RetrieveAndGenerate request completed.', {
                    citationCount: citations.length,
                    modelArn: config.modelArn,
                    requestId: options.requestId,
                    textLength: text.length
                });

                return {
                    citations,
                    modelId: config.modelArn,
                    text
                };
            } catch (error) {
                logError('Bedrock RetrieveAndGenerate request failed.', error, {
                    knowledgeBaseId: config.knowledgeBaseId,
                    modelArn: config.modelArn,
                    requestId: options.requestId,
                    retrievalResults: config.retrievalResults
                });
                throw error;
            }
        }
    };
}
