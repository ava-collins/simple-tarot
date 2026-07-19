import type { RetrievalFilter } from '@aws-sdk/client-bedrock-agent-runtime';
import type { ComposedReadingContext } from '../composer/contracts';
import type { GeneratedReading, ReadingRequest } from '../readings/contracts';

export type ExplicitBedrockConfig = {
    knowledgeBaseId: string;
    maxAttempts: number;
    modelArn: string;
    region: string;
    retrievalResults: number;
};

export type RetrievedTextResult = {
    text?: string;
};

export type RetrievalEvidence = {
    chunks: string[];
    usableResultCount: number;
};

export type GenerationPrompt = {
    system: string;
    user: string;
};

export type KnowledgeBaseRetriever = {
    retrieve(input: {
        filter: RetrievalFilter;
        query: string;
        requestId?: string;
    }): Promise<RetrievedTextResult[]>;
};

export type ConverseGenerator = {
    generate(prompt: GenerationPrompt, requestId?: string): Promise<GeneratedReading>;
};

export type ExplicitRagGenerationInput = {
    context: ComposedReadingContext;
    request: ReadingRequest;
    requestId?: string;
};

export type ExplicitRagReadingGenerator = {
    generateReading(input: ExplicitRagGenerationInput): Promise<GeneratedReading>;
};
