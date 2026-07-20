import { describe, expect, it, vi } from 'vitest';
import { BedrockThrottledError } from '../bedrock/errors';
import { composeReadingContext } from '../composer/compose-reading';
import { ComposerUnavailableError } from '../composer/errors';
import {
    sanitizedComposerBundle,
    sanitizedSingleCardRequest
} from '../composer/test-fixture';
import type { GeneratedReading } from '../readings/contracts';
import {
    ReadingExecutionError,
    type ReadingExecution,
    type ReadingExecutor
} from '../readings/reading-executor';
import { mapGeneratedReadingResponse } from '../readings/response-mapper';
import { createPostReadingEvaluationHandler } from './reading-evaluations';

const context = composeReadingContext(
    sanitizedSingleCardRequest,
    sanitizedComposerBundle
);

const generated: GeneratedReading = {
    citations: [],
    mode: 'bedrock',
    modelId: 'test-model',
    text: 'Generated summary.\nGenerated card meaning.'
};

const composerMetadata = {
    composerMode: 'enabled' as const,
    corpusVersion: context.corpusVersion,
    namedPairCount: context.namedPairResults.length,
    wholeSpreadCount: context.wholeSpreadResults.length
};

const execution: ReadingExecution = {
    composerMetadata,
    context,
    generated,
    reading: mapGeneratedReadingResponse(
        sanitizedSingleCardRequest,
        generated,
        composerMetadata
    ),
    trace: {
        generation: {
            durationMs: 7,
            inputTokens: 101,
            modelId: 'test-model',
            outputCharacterCount: generated.text.length,
            outputTokens: 22,
            stopReason: 'end_turn'
        },
        prompt: {
            system: 'private-system-prompt-marker',
            user: 'private-user-prompt-marker'
        },
        retrieval: {
            durationMs: 5,
            filter: {
                corpusVersion: context.corpusVersion,
                documentKind: 'correspondence-theme',
                status: 'approved'
            },
            query: 'private-query-marker',
            requestedResultCount: 5,
            results: [
                {
                    candidateCharacterCount: 24,
                    candidateText: 'private-candidate-marker',
                    documentId: 'theme-one',
                    evidenceCharacterCount: 23,
                    evidenceText: 'private-evidence-marker',
                    includedInPrompt: true,
                    rank: 1,
                    score: 0.9,
                    truncatedByResultLimit: false,
                    truncatedByTotalLimit: false
                }
            ],
            returnedResultCount: 1,
            totalEvidenceCharacters: 23,
            usableResultCount: 1
        }
    }
};

const createExecutor = (
    result: ReadingExecution | Error = execution
): ReadingExecutor => ({
    execute:
        result instanceof Error
            ? vi.fn().mockRejectedValue(result)
            : vi.fn().mockResolvedValue(result)
});

const createResponse = () => {
    const response = {
        locals: {
            authenticatedUser: {
                claims: { sub: 'user-sub-123' },
                userId: 'user-sub-123'
            },
            requestId: 'request-123'
        },
        json: vi.fn(),
        status: vi.fn()
    };
    response.status.mockReturnValue(response);

    return response;
};

const createRequest = (body: unknown = sanitizedSingleCardRequest) =>
    ({
        body,
        header: vi.fn((name: string) =>
            name.toLowerCase() === 'user-agent' ? 'EvaluationHarness/1.0' : undefined
        ),
        ip: '203.0.113.42',
        method: 'POST',
        originalUrl: '/reading-evaluations'
    }) as never;

describe('createPostReadingEvaluationHandler', () => {
    it('returns the exact reading-specific context and internal execution trace', async () => {
        const apiLogSink = { write: vi.fn().mockResolvedValue(undefined) };
        const executor = createExecutor();
        const handler = createPostReadingEvaluationHandler({
            apiLogSink,
            executor,
            now: () => new Date('2026-07-20T15:00:00.000Z')
        });
        const response = createResponse();
        const next = vi.fn();

        await handler(createRequest(), response as never, next);

        expect(executor.execute).toHaveBeenCalledWith(
            sanitizedSingleCardRequest,
            'request-123'
        );
        expect(response.status).toHaveBeenCalledWith(200);
        expect(response.json).toHaveBeenCalledWith({
            corpusVersion: context.corpusVersion,
            evaluatedAt: '2026-07-20T15:00:00.000Z',
            reading: execution.reading,
            requestId: 'request-123',
            schemaVersion: 1,
            trace: {
                generation: execution.trace?.generation,
                prompt: execution.trace?.prompt,
                resolvedContext: context,
                retrieval: execution.trace?.retrieval
            }
        });
        expect(apiLogSink.write).toHaveBeenCalledWith(
            expect.objectContaining({
                cognitoSub: 'user-sub-123',
                method: 'POST',
                requestId: 'request-123',
                route: '/reading-evaluations',
                statusCode: 200,
                timestamp: '2026-07-20T15:00:00.000Z'
            })
        );
        expect(JSON.stringify(apiLogSink.write.mock.calls)).not.toMatch(
            /private-system-prompt-marker|private-user-prompt-marker|private-query-marker|private-candidate-marker|private-evidence-marker|Generated summary/
        );
        expect(next).not.toHaveBeenCalled();
    });

    it('returns the existing safe 400 transport response without execution', async () => {
        const executor = createExecutor();
        const handler = createPostReadingEvaluationHandler({ executor });
        const response = createResponse();

        await handler(createRequest({}), response as never, vi.fn());

        expect(response.status).toHaveBeenCalledWith(400);
        expect(response.json).toHaveBeenCalledWith({
            errors: expect.any(Array)
        });
        expect(executor.execute).not.toHaveBeenCalled();
    });

    it.each([
        new BedrockThrottledError(),
        new ComposerUnavailableError('PRIVATE_REASON_MARKER')
    ])('forwards safe execution failures without returning a partial trace', async cause => {
        const apiLogSink = { write: vi.fn().mockResolvedValue(undefined) };
        const handler = createPostReadingEvaluationHandler({
            apiLogSink,
            executor: createExecutor(
                new ReadingExecutionError(cause, { composerMode: 'enabled' })
            ),
            now: () => new Date('2026-07-20T15:01:00.000Z')
        });
        const response = createResponse();
        const next = vi.fn();

        await handler(createRequest(), response as never, next);

        expect(response.json).not.toHaveBeenCalled();
        expect(next).toHaveBeenCalledWith(cause);
        expect(JSON.stringify(apiLogSink.write.mock.calls)).not.toContain(
            'PRIVATE_REASON_MARKER'
        );
    });
});
