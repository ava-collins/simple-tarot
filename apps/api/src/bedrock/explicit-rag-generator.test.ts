import { describe, expect, it } from 'vitest';
import { composeReadingContext } from '../composer/compose-reading';
import { buildExplicitGenerationPrompt } from '../composer/prompt-builder';
import {
    sanitizedCelticCrossRequest,
    sanitizedComposerBundle
} from '../composer/test-fixture';
import type { GeneratedReading } from '../readings/contracts';
import { createExplicitRagReadingGenerator } from './explicit-rag-generator';
import {
    activeCorpusEvaluationFilterFor,
    activeCorpusFilterFor
} from './retrieval-filter';
import { buildRetrievalEvidence } from './retrieval-evidence';
import { buildRetrievalQuery } from './retrieval-query-builder';

const generatedReading: GeneratedReading = {
    citations: [],
    mode: 'bedrock',
    modelId: 'test-model',
    text: 'Generated reading.'
};

const generationTrace = {
    durationMs: 20,
    inputTokens: 100,
    modelId: 'test-model',
    outputCharacterCount: generatedReading.text.length,
    outputTokens: 25,
    stopReason: 'end_turn'
};

describe('createExplicitRagReadingGenerator', () => {
    it('retrieves once, bounds evidence, and converses once with the explicit prompt', async () => {
        const context = composeReadingContext(
            sanitizedCelticCrossRequest,
            sanitizedComposerBundle
        );
        const firstEvidence = 'private-evidence-marker'.repeat(120);
        const secondEvidence = 'private-second-evidence-marker';
        const retrievalInputs: unknown[] = [];
        const converseInputs: unknown[] = [];
        const logs: unknown[] = [];
        const generator = createExplicitRagReadingGenerator({
            converse: {
                generate: async (prompt, requestId) => {
                    converseInputs.push({ prompt, requestId });
                    return { generated: generatedReading, trace: generationTrace };
                }
            },
            logInfo: (message, logContext) =>
                logs.push({ context: logContext, message }),
            retriever: {
                retrieve: async input => {
                    retrievalInputs.push(input);
                    return {
                        durationMs: 12,
                        requestedResultCount: 5,
                        results: [
                            {
                                documentId: 'first-theme',
                                score: 0.9,
                                text: firstEvidence
                            },
                            { text: '   ' },
                            { text: secondEvidence }
                        ]
                    };
                }
            }
        });

        const prompt = buildExplicitGenerationPrompt(
            sanitizedCelticCrossRequest,
            context,
            [firstEvidence.slice(0, 2_000), secondEvidence]
        );
        const evidence = buildRetrievalEvidence([
            { documentId: 'first-theme', score: 0.9, text: firstEvidence },
            { text: '   ' },
            { text: secondEvidence }
        ]);

        await expect(
            generator.generateReading({
                context,
                request: sanitizedCelticCrossRequest,
                requestId: 'request-123'
            })
        ).resolves.toEqual({
            generated: generatedReading,
            trace: {
                generation: generationTrace,
                prompt,
                retrieval: {
                    durationMs: 12,
                    filter: activeCorpusEvaluationFilterFor(
                        context.corpusVersion
                    ),
                    query: buildRetrievalQuery(
                        sanitizedCelticCrossRequest,
                        context
                    ),
                    requestedResultCount: 5,
                    results: evidence.results,
                    returnedResultCount: 3,
                    totalEvidenceCharacters: evidence.totalEvidenceCharacters,
                    usableResultCount: 2
                }
            }
        });
        expect(retrievalInputs).toEqual([
            {
                filter: activeCorpusFilterFor(context.corpusVersion),
                query: buildRetrievalQuery(sanitizedCelticCrossRequest, context),
                requestId: 'request-123'
            }
        ]);
        expect(converseInputs).toEqual([
            {
                prompt,
                requestId: 'request-123'
            }
        ]);
        expect(logs).toEqual([
            {
                context: {
                    requestId: 'request-123',
                    usableResultCount: 2,
                    zeroUsableResults: false
                },
                message: 'Retrieval evidence prepared.'
            }
        ]);
        expect(JSON.stringify(logs)).not.toContain('private-evidence-marker');
    });

    it('continues to Converse with no retrieved themes when retrieval is empty', async () => {
        const context = composeReadingContext(
            sanitizedCelticCrossRequest,
            sanitizedComposerBundle
        );
        const converseInputs: unknown[] = [];
        const logs: unknown[] = [];
        const generator = createExplicitRagReadingGenerator({
            converse: {
                generate: async (prompt, requestId) => {
                    converseInputs.push({ prompt, requestId });
                    return { generated: generatedReading, trace: generationTrace };
                }
            },
            logInfo: (message, logContext) =>
                logs.push({ context: logContext, message }),
            retriever: {
                retrieve: async () => ({
                    durationMs: 5,
                    requestedResultCount: 5,
                    results: []
                })
            }
        });

        await generator.generateReading({
            context,
            request: sanitizedCelticCrossRequest,
            requestId: 'request-123'
        });

        expect(converseInputs).toEqual([
            {
                prompt: buildExplicitGenerationPrompt(
                    sanitizedCelticCrossRequest,
                    context,
                    []
                ),
                requestId: 'request-123'
            }
        ]);
        expect(logs).toEqual([
            {
                context: {
                    requestId: 'request-123',
                    usableResultCount: 0,
                    zeroUsableResults: true
                },
                message: 'Retrieval evidence prepared.'
            }
        ]);
    });

    it('does not call Converse when retrieval fails', async () => {
        const context = composeReadingContext(
            sanitizedCelticCrossRequest,
            sanitizedComposerBundle
        );
        const retrievalError = new Error('safe-test-retrieval-error');
        let converseCallCount = 0;
        const generator = createExplicitRagReadingGenerator({
            converse: {
                generate: async () => {
                    converseCallCount += 1;
                    return { generated: generatedReading, trace: generationTrace };
                }
            },
            logInfo: () => {},
            retriever: {
                retrieve: async () => {
                    throw retrievalError;
                }
            }
        });

        await expect(
            generator.generateReading({
                context,
                request: sanitizedCelticCrossRequest,
                requestId: 'request-123'
            })
        ).rejects.toBe(retrievalError);
        expect(converseCallCount).toBe(0);
    });
});
