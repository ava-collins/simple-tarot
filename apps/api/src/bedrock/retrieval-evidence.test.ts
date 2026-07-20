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
            results: [
                {
                    candidateCharacterCount: 11,
                    candidateText: 'first theme',
                    evidenceCharacterCount: 11,
                    evidenceText: 'first theme',
                    includedInPrompt: true,
                    rank: 1,
                    truncatedByResultLimit: false,
                    truncatedByTotalLimit: false
                },
                {
                    candidateCharacterCount: 0,
                    candidateText: '',
                    evidenceCharacterCount: 0,
                    evidenceText: '',
                    includedInPrompt: false,
                    rank: 2,
                    truncatedByResultLimit: false,
                    truncatedByTotalLimit: false
                },
                {
                    candidateCharacterCount: 0,
                    candidateText: '',
                    evidenceCharacterCount: 0,
                    evidenceText: '',
                    includedInPrompt: false,
                    rank: 3,
                    truncatedByResultLimit: false,
                    truncatedByTotalLimit: false
                },
                {
                    candidateCharacterCount: 12,
                    candidateText: 'second theme',
                    evidenceCharacterCount: 12,
                    evidenceText: 'second theme',
                    includedInPrompt: true,
                    rank: 4,
                    truncatedByResultLimit: false,
                    truncatedByTotalLimit: false
                }
            ],
            totalEvidenceCharacters: 23,
            usableResultCount: 2
        });
    });

    it('caps each result at the per-result character budget', () => {
        const evidence = buildRetrievalEvidence([
            { text: 'a'.repeat(MAX_RETRIEVAL_RESULT_CHARACTERS + 1) }
        ]);

        expect(evidence).toEqual({
            chunks: ['a'.repeat(MAX_RETRIEVAL_RESULT_CHARACTERS)],
            results: [
                expect.objectContaining({
                    candidateCharacterCount: MAX_RETRIEVAL_RESULT_CHARACTERS,
                    evidenceCharacterCount: MAX_RETRIEVAL_RESULT_CHARACTERS,
                    truncatedByResultLimit: true,
                    truncatedByTotalLimit: false
                })
            ],
            totalEvidenceCharacters: MAX_RETRIEVAL_RESULT_CHARACTERS,
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
        expect(evidence.usableResultCount).toBe(6);
        expect(evidence.totalEvidenceCharacters).toBe(
            MAX_RETRIEVAL_EVIDENCE_CHARACTERS
        );
        expect(evidence.chunks.join('')).toHaveLength(
            MAX_RETRIEVAL_EVIDENCE_CHARACTERS
        );
        expect(evidence.results[4]).toEqual(
            expect.objectContaining({
                candidateText: 'final theme should be truncated',
                evidenceText: 'fina',
                includedInPrompt: true,
                rank: 5,
                truncatedByTotalLimit: true
            })
        );
        expect(evidence.results[5]).toEqual(
            expect.objectContaining({
                candidateText: 'must not be included',
                evidenceText: '',
                includedInPrompt: false,
                rank: 6,
                truncatedByTotalLimit: true
            })
        );
    });

    it('preserves optional score and document ID without affecting prompt chunks', () => {
        const evidence = buildRetrievalEvidence([
            { documentId: 'theme-one', score: 0.75, text: 'theme' }
        ]);

        expect(evidence.chunks).toEqual(['theme']);
        expect(evidence.results[0]).toEqual(
            expect.objectContaining({
                documentId: 'theme-one',
                rank: 1,
                score: 0.75
            })
        );
    });
});
