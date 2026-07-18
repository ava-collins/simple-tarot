import type { RetrievalFilter } from '@aws-sdk/client-bedrock-agent-runtime';
import { GeneratedReading } from '../readings/contracts';

export type BedrockReadingGeneratorConfig = {
    knowledgeBaseId: string;
    maxAttempts: number;
    modelArn: string;
    region: string;
    retrievalResults: number;
};

export type BedrockGenerationOptions = {
    retrievalFilter?: RetrievalFilter;
};

export type BedrockReadingGenerator = {
    generateReading(
        prompt: string,
        options?: BedrockGenerationOptions
    ): Promise<GeneratedReading>;
};
