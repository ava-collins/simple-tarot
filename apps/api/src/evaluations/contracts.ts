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

export type ExplicitRagEvaluationTrace = {
    generation: GenerationEvaluationTrace;
    prompt: {
        system: string;
        user: string;
    };
    retrieval: RetrievalEvaluationTrace;
};
