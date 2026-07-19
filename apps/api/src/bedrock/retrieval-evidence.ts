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

    for (const result of results) {
        if (remaining === 0) {
            break;
        }

        const trimmed = result.text?.trim();
        if (!trimmed) {
            continue;
        }

        const bounded = trimmed.slice(0, MAX_RETRIEVAL_RESULT_CHARACTERS);
        const included = bounded.slice(0, remaining);
        if (included.length === 0) {
            continue;
        }

        chunks.push(included);
        remaining -= included.length;
    }

    return {
        chunks,
        usableResultCount: chunks.length
    };
}
