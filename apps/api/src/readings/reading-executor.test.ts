import { describe, expect, it, vi } from 'vitest';
import { composeReadingContext } from '../composer/compose-reading';
import { ComposerUnavailableError } from '../composer/errors';
import {
    sanitizedComposerBundle,
    sanitizedSingleCardRequest
} from '../composer/test-fixture';
import type { ExplicitRagEvaluationTrace } from '../evaluations/contracts';
import type { GeneratedReading } from './contracts';
import {
    ReadingExecutionError,
    createReadingExecutor
} from './reading-executor';

const generated: GeneratedReading = {
    citations: [],
    mode: 'bedrock',
    modelId: 'test-model',
    text: 'Summary.\nCard meaning.'
};

const trace: ExplicitRagEvaluationTrace = {
    generation: {
        durationMs: 2,
        modelId: 'test-model',
        outputCharacterCount: generated.text.length,
        stopReason: 'end_turn'
    },
    prompt: { system: 'system', user: 'user' },
    retrieval: {
        durationMs: 1,
        filter: {
            corpusVersion: sanitizedComposerBundle.corpusVersion,
            documentKind: 'correspondence-theme',
            status: 'approved'
        },
        query: 'query',
        requestedResultCount: 5,
        results: [],
        returnedResultCount: 0,
        totalEvidenceCharacters: 0,
        usableResultCount: 0
    }
};

describe('createReadingExecutor', () => {
    it('executes disabled local generation without invoking composer', async () => {
        const compose = vi.fn();
        const generate = vi.fn().mockResolvedValue({ generated });
        const executor = createReadingExecutor({
            composerMode: 'disabled',
            composerRuntime: { compose },
            generate
        });

        const execution = await executor.execute(
            sanitizedSingleCardRequest,
            'request-123'
        );

        expect(compose).not.toHaveBeenCalled();
        expect(generate).toHaveBeenCalledWith(
            sanitizedSingleCardRequest,
            undefined,
            'request-123'
        );
        expect(execution).toEqual(
            expect.objectContaining({
                composerMetadata: { composerMode: 'disabled' },
                generated,
                reading: expect.objectContaining({
                    metadata: expect.objectContaining({
                        composerMode: 'disabled',
                        mode: 'bedrock'
                    })
                })
            })
        );
        expect(execution.context).toBeUndefined();
        expect(execution.trace).toBeUndefined();
    });

    it('returns exact enabled context, metadata, response, and trace', async () => {
        const context = composeReadingContext(
            sanitizedSingleCardRequest,
            sanitizedComposerBundle
        );
        const compose = vi.fn().mockResolvedValue(context);
        const generate = vi.fn().mockResolvedValue({ generated, trace });
        const executor = createReadingExecutor({
            composerMode: 'enabled',
            composerRuntime: { compose },
            generate
        });

        const execution = await executor.execute(
            sanitizedSingleCardRequest,
            'request-123'
        );

        expect(compose).toHaveBeenCalledWith(
            sanitizedSingleCardRequest,
            'request-123'
        );
        expect(generate).toHaveBeenCalledWith(
            sanitizedSingleCardRequest,
            context,
            'request-123'
        );
        expect(execution.context).toBe(context);
        expect(execution.trace).toBe(trace);
        expect(execution.composerMetadata).toEqual({
            composerMode: 'enabled',
            corpusVersion: context.corpusVersion,
            namedPairCount: context.namedPairResults.length,
            wholeSpreadCount: context.wholeSpreadResults.length
        });
        expect(execution.reading.metadata).toEqual({
            ...execution.composerMetadata,
            itemCount: 1,
            mode: 'bedrock',
            modelId: 'test-model'
        });
    });

    it('fails closed with aggregate metadata when enabled composer is absent', async () => {
        const executor = createReadingExecutor({
            composerMode: 'enabled',
            generate: vi.fn()
        });

        const promise = executor.execute(sanitizedSingleCardRequest);

        await expect(promise).rejects.toMatchObject({
            cause: expect.any(ComposerUnavailableError),
            composerMetadata: { composerMode: 'enabled' }
        });
        await expect(promise).rejects.toBeInstanceOf(ReadingExecutionError);
    });

    it('preserves composed metadata when generation fails', async () => {
        const context = composeReadingContext(
            sanitizedSingleCardRequest,
            sanitizedComposerBundle
        );
        const cause = new Error('generation failed');
        const executor = createReadingExecutor({
            composerMode: 'enabled',
            composerRuntime: {
                compose: vi.fn().mockResolvedValue(context)
            },
            generate: vi.fn().mockRejectedValue(cause)
        });

        await expect(
            executor.execute(sanitizedSingleCardRequest)
        ).rejects.toMatchObject({
            cause,
            composerMetadata: {
                composerMode: 'enabled',
                corpusVersion: context.corpusVersion,
                namedPairCount: context.namedPairResults.length,
                wholeSpreadCount: context.wholeSpreadResults.length
            }
        });
    });
});
