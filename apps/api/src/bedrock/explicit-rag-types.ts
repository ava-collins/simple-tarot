import type { RetrievalFilter } from '@aws-sdk/client-bedrock-agent-runtime';
import type { ComposedReadingContext } from '../composer/contracts';
import type { GeneratedReading, ReadingRequest } from '../readings/contracts';
import type {
    ExplicitRagEvaluationTrace,
    GenerationEvaluationTrace,
    RetrievalEvaluationResult
} from '../evaluations/contracts';

export type ExplicitBedrockConfig = {
    knowledgeBaseId: string;
    maxAttempts: number;
    modelArn: string;
    region: string;
    retrievalResults: number;
};

export type RetrievedTextResult = {
    documentId?: string;
    score?: number;
    text?: string;
};

export type KnowledgeBaseRetrievalExecution = {
    durationMs: number;
    requestedResultCount: number;
    results: RetrievedTextResult[];
};

export type RetrievalEvidence = {
    chunks: string[];
    results: RetrievalEvaluationResult[];
    totalEvidenceCharacters: number;
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
    }): Promise<KnowledgeBaseRetrievalExecution>;
};

export type ConverseGenerator = {
    generate(prompt: GenerationPrompt, requestId?: string): Promise<{
        generated: GeneratedReading;
        trace: GenerationEvaluationTrace;
    }>;
};

export type ExplicitRagGenerationInput = {
    context: ComposedReadingContext;
    request: ReadingRequest;
    requestId?: string;
};

export type ExplicitRagReadingGenerator = {
    generateReading(input: ExplicitRagGenerationInput): Promise<{
        generated: GeneratedReading;
        trace: ExplicitRagEvaluationTrace;
    }>;
};
