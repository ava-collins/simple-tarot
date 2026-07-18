import { describe, expect, it, vi } from 'vitest';
import { createComposerRuntime } from './runtime';
import {
    sanitizedComposerBundle,
    sanitizedSingleCardRequest
} from './test-fixture';

describe('createComposerRuntime', () => {
    it('loads one bundle snapshot and composes deterministic context for a request', async () => {
        const loadActiveBundle = vi.fn().mockResolvedValue({
            bundle: sanitizedComposerBundle,
            pointer: {
                corpusVersion: sanitizedComposerBundle.corpusVersion
            }
        });
        const logs: unknown[] = [];
        const runtime = createComposerRuntime({
            loader: { loadActiveBundle },
            logInfo: (_message, context) => logs.push(context),
            now: vi
                .fn()
                .mockReturnValueOnce(100)
                .mockReturnValueOnce(107)
        });

        const composed = await runtime.compose(
            sanitizedSingleCardRequest,
            'request-123'
        );

        expect(loadActiveBundle).toHaveBeenCalledTimes(1);
        expect(composed).toMatchObject({
            corpusVersion: sanitizedComposerBundle.corpusVersion,
            spreadMode: 'single-card'
        });
        expect(logs).toEqual([
            {
                cardCount: 1,
                composerMode: 'enabled',
                corpusVersion: sanitizedComposerBundle.corpusVersion,
                loadDurationMs: 7,
                namedPairCount: 0,
                requestId: 'request-123',
                wholeSpreadCount: 0
            }
        ]);
    });

    it('never logs private request, bundle, or composed values', async () => {
        const logInfo = vi.fn();
        const runtime = createComposerRuntime({
            loader: {
                loadActiveBundle: vi.fn().mockResolvedValue({
                    bundle: sanitizedComposerBundle,
                    pointer: {
                        corpusVersion: sanitizedComposerBundle.corpusVersion
                    }
                })
            },
            logInfo,
            now: () => 0
        });

        await runtime.compose(
            {
                ...sanitizedSingleCardRequest,
                question: 'private-question-marker'
            },
            'request-123'
        );

        const serializedLogs = JSON.stringify(logInfo.mock.calls);
        for (const privateMarker of [
            'private-question-marker',
            'invented-source',
            'A new possibility is already present.',
            'edge-rule',
            'composer-bundle.json'
        ]) {
            expect(serializedLogs).not.toContain(privateMarker);
        }
    });
});
