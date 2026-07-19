import { describe, expect, it } from 'vitest';
import {
    MAX_RETRIEVAL_EVIDENCE_CHARACTERS,
    MAX_RETRIEVAL_RESULT_CHARACTERS
} from './constants';
import { buildRetrievalEvidence } from './retrieval-evidence';

describe('buildRetrievalEvidence', () => {
    it('preserves rank while removing empty text and trimming usable chunks', () => {
        expect(
            buildRetrievalEvidence([
                { text: '  first theme  ' },
                {},
                { text: '   ' },
                { text: 'second theme' }
            ])
        ).toEqual({
            chunks: ['first theme', 'second theme'],
            usableResultCount: 2
        });
    });

    it('caps each result at the per-result character budget', () => {
        const evidence = buildRetrievalEvidence([
            { text: 'a'.repeat(MAX_RETRIEVAL_RESULT_CHARACTERS + 1) }
        ]);

        expect(evidence).toEqual({
            chunks: ['a'.repeat(MAX_RETRIEVAL_RESULT_CHARACTERS)],
            usableResultCount: 1
        });
    });

    it('partially includes the final ranked chunk without exceeding the total budget', () => {
        const nearlyFullChunk = 'a'.repeat(
            MAX_RETRIEVAL_RESULT_CHARACTERS - 1
        );
        const evidence = buildRetrievalEvidence([
            { text: nearlyFullChunk },
            { text: nearlyFullChunk },
            { text: nearlyFullChunk },
            { text: nearlyFullChunk },
            { text: 'final theme should be truncated' },
            { text: 'must not be included' }
        ]);

        expect(evidence.chunks).toEqual([
            nearlyFullChunk,
            nearlyFullChunk,
            nearlyFullChunk,
            nearlyFullChunk,
            'fina'
        ]);
        expect(evidence.usableResultCount).toBe(5);
        expect(evidence.chunks.join('')).toHaveLength(
            MAX_RETRIEVAL_EVIDENCE_CHARACTERS
        );
        expect(Object.keys(evidence).sort()).toEqual([
            'chunks',
            'usableResultCount'
        ]);
    });
});
