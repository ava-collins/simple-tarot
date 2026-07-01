import { GeneratedReading } from '../readings/contracts';

export type BedrockReadingGeneratorConfig = {
    knowledgeBaseId: string;
    maxAttempts: number;
    modelArn: string;
    region: string;
    retrievalResults: number;
};

export type BedrockReadingGenerator = {
    generateReading(prompt: string): Promise<GeneratedReading>;
};
