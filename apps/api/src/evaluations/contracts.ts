import type { ComposedReadingContext } from '../composer/contracts';
import type { ReadingResponse } from '../readings/contracts';

export type RetrievalEvaluationResult = {
    rank: number;
    score?: number;
    documentId?: string;
    candidateText: string;
    candidateCharacterCount: number;
    evidenceText: string;
    evidenceCharacterCount: number;
    includedInPrompt: boolean;
    truncatedByResultLimit: boolean;
    truncatedByTotalLimit: boolean;
};

export type GenerationEvaluationTrace = {
    durationMs: number;
    inputTokens?: number;
    modelId: string;
    outputCharacterCount: number;
    outputTokens?: number;
    stopReason?: string;
};

export type RetrievalEvaluationFilter = {
    corpusVersion: string;
    documentKind: 'correspondence-theme';
    status: 'approved';
};

export type RetrievalEvaluationTrace = {
    durationMs: number;
    filter: RetrievalEvaluationFilter;
    query: string;
    requestedResultCount: number;
    results: RetrievalEvaluationResult[];
    returnedResultCount: number;
    totalEvidenceCharacters: number;
    usableResultCount: number;
};

type TraceBase = {
    generation: GenerationEvaluationTrace;
    prompt: {
        system: string;
        user: string;
    };
};

export type DeterministicEvaluationTrace = TraceBase & {
    mode: 'deterministic';
};

export type ExplicitRagEvaluationTrace = TraceBase & {
    mode: 'explicit-rag';
    retrieval: RetrievalEvaluationTrace;
};

export type BedrockEvaluationTrace =
    | DeterministicEvaluationTrace
    | ExplicitRagEvaluationTrace;

export type ReadingEvaluationResponse = {
    corpusVersion: string;
    evaluatedAt: string;
    reading: ReadingResponse;
    requestId: string;
    schemaVersion: 2;
    trace: BedrockEvaluationTrace & { resolvedContext: ComposedReadingContext };
};
