import { describe, expect, it, vi } from 'vitest';
import type { ApiConfig } from '../config';
import type { GeneratedReading } from './contracts';
import { createReadingRuntime } from './runtime';

const localConfig: ApiConfig = {
    apiLog: {},
    auth: { mode: 'disabled' },
    bedrock: {
        maxAttempts: 5,
        mode: 'local',
        retrievalResults: 5
    },
    composer: { mode: 'disabled' },
    evaluation: { mode: 'disabled' },
    hostname: 'localhost',
    port: 4100,
    userData: {}
};

const bedrockConfig: ApiConfig = {
    ...localConfig,
    apiLog: { bucketName: 'log-bucket' },
    bedrock: {
        knowledgeBaseId: 'KB123',
        maxAttempts: 5,
        mode: 'bedrock',
        modelArn: 'test-model',
        region: 'us-east-2',
        retrievalResults: 5
    },
    composer: {
        bucketName: 'corpus-bucket',
        dataSourceId: 'DS123',
        mode: 'enabled'
    },
    userData: { tableName: 'user-data' }
};

const generated: GeneratedReading = {
    citations: [],
    mode: 'bedrock',
    modelId: 'test-model',
    text: 'Summary.'
};

describe('createReadingRuntime', () => {
    it('keeps local mode free of Bedrock and composer factories', async () => {
        const createExplicitGenerator = vi.fn();
        const createComposer = vi.fn();
        const runtime = createReadingRuntime(localConfig, {
            createComposer,
            createExplicitGenerator
        });

        const execution = await runtime.executor.execute({
            spread: 'single_card',
            items: [
                {
                    cardIndex: 0,
                    cardName: 'The Star',
                    position: 'guidance',
                    reversed: false
                }
            ]
        });

        expect(createExplicitGenerator).not.toHaveBeenCalled();
        expect(createComposer).not.toHaveBeenCalled();
        expect(runtime.generationMode).toBe('local');
        expect(execution.generated.mode).toBe('local');
    });

    it('constructs one shared enabled composer and explicit generator graph', async () => {
        const context = {
            cards: [],
            composerSchemaVersion: 1 as const,
            corpusVersion: 'a'.repeat(64),
            namedPairResults: [],
            spreadMode: 'single-card' as const,
            wholeSpreadResults: []
        };
        const composer = { compose: vi.fn().mockResolvedValue(context) };
        const explicitGenerator = {
            generateReading: vi.fn().mockResolvedValue({
                generated,
                trace: {
                    mode: 'explicit-rag',
                    generation: {
                        durationMs: 1,
                        modelId: 'test-model',
                        outputCharacterCount: generated.text.length
                    },
                    prompt: { system: 'system', user: 'user' },
                    retrieval: {
                        durationMs: 1,
                        filter: {
                            corpusVersion: context.corpusVersion,
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
                }
            })
        };
        const createComposer = vi.fn().mockReturnValue(composer);
        const createExplicitGenerator = vi
            .fn()
            .mockReturnValue(explicitGenerator);

        const runtime = createReadingRuntime(bedrockConfig, {
            createComposer,
            createExplicitGenerator
        });
        const request = {
            spread: 'single_card',
            items: [
                {
                    cardIndex: 0,
                    cardName: 'The Star',
                    position: 'guidance',
                    reversed: false
                }
            ]
        };

        const execution = await runtime.executor.execute(request, 'request-123');

        expect(createComposer).toHaveBeenCalledOnce();
        expect(createExplicitGenerator).toHaveBeenCalledOnce();
        expect(composer.compose).toHaveBeenCalledWith(request, 'request-123');
        expect(explicitGenerator.generateReading).toHaveBeenCalledWith({
            context,
            request,
            requestId: 'request-123'
        });
        expect(runtime.generationMode).toBe('bedrock');
        expect(execution.context).toBe(context);
        expect(execution.trace).toBeDefined();
    });
});
