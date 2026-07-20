import {
    MAX_RETRIEVAL_EVIDENCE_CHARACTERS,
    MAX_RETRIEVAL_RESULT_CHARACTERS
} from './constants';
import type {
    RetrievalEvidence,
    RetrievedTextResult
} from './explicit-rag-types';

export function buildRetrievalEvidence(
    results: RetrievedTextResult[]
): RetrievalEvidence {
    const chunks: string[] = [];
    let remaining = MAX_RETRIEVAL_EVIDENCE_CHARACTERS;
    let usableResultCount = 0;
    const evaluationResults = results.map((result, index) => {
        const trimmed = result.text?.trim() ?? '';
        const candidateText = trimmed.slice(0, MAX_RETRIEVAL_RESULT_CHARACTERS);
        const evidenceText = candidateText.slice(0, remaining);

        if (candidateText.length > 0) {
            usableResultCount += 1;
        }
        if (evidenceText.length > 0) {
            chunks.push(evidenceText);
            remaining -= evidenceText.length;
        }

        return {
            ...(result.documentId === undefined
                ? {}
                : { documentId: result.documentId }),
            ...(result.score === undefined ? {} : { score: result.score }),
            candidateCharacterCount: candidateText.length,
            candidateText,
            evidenceCharacterCount: evidenceText.length,
            evidenceText,
            includedInPrompt: evidenceText.length > 0,
            rank: index + 1,
            truncatedByResultLimit:
                trimmed.length > MAX_RETRIEVAL_RESULT_CHARACTERS,
            truncatedByTotalLimit: evidenceText.length < candidateText.length
        };
    });

    return {
        chunks,
        results: evaluationResults,
        totalEvidenceCharacters:
            MAX_RETRIEVAL_EVIDENCE_CHARACTERS - remaining,
        usableResultCount
    };
}
