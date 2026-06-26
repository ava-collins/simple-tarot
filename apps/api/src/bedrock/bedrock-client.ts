import {
    BedrockAgentRuntimeClient,
    RetrieveAndGenerateCommand,
    RetrieveAndGenerateCommandOutput
} from '@aws-sdk/client-bedrock-agent-runtime';
import { GeneratedReading, ReadingCitation } from '../readings/contracts';
import { BedrockReadingGenerator, BedrockReadingGeneratorConfig } from './types';

type BedrockRuntimeSender = {
    send(command: RetrieveAndGenerateCommand): Promise<RetrieveAndGenerateCommandOutput>;
};

const sourceIdFor = (
    reference: NonNullable<
        NonNullable<RetrieveAndGenerateCommandOutput['citations']>[number]['retrievedReferences']
    >[number]
): string => {
    const location = reference.location;

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
    })
): BedrockReadingGenerator {
    return {
        async generateReading(prompt: string): Promise<GeneratedReading> {
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

            return {
                citations: mapCitations(output),
                modelId: config.modelArn,
                text: output.output?.text ?? ''
            };
        }
    };
}
