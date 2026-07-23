import type { ComposerRuntimeConfig } from '../config';
import type { ComposedReadingContext } from '../composer/contracts';
import { ComposerUnavailableError } from '../composer/errors';
import type { ComposerRuntime } from '../composer/runtime';
import type { BedrockEvaluationTrace } from '../evaluations/contracts';
import type {
    ComposerResponseMetadata,
    GeneratedReading,
    ReadingRequest,
    ReadingResponse
} from './contracts';
import { mapGeneratedReadingResponse } from './response-mapper';

export type ReadingGenerationExecution = {
    generated: GeneratedReading;
    trace?: BedrockEvaluationTrace;
};

export type ReadingGenerator = (
    request: ReadingRequest,
    context?: ComposedReadingContext,
    requestId?: string
) => Promise<ReadingGenerationExecution>;

export type ReadingExecution = {
    composerMetadata: ComposerResponseMetadata;
    context?: ComposedReadingContext;
    generated: GeneratedReading;
    reading: ReadingResponse;
    trace?: BedrockEvaluationTrace;
};

export type ReadingExecutor = {
    execute(request: ReadingRequest, requestId?: string): Promise<ReadingExecution>;
};

type ReadingExecutorOptions = {
    composerMode: ComposerRuntimeConfig['mode'];
    composerRuntime?: ComposerRuntime;
    generate: ReadingGenerator;
};

export class ReadingExecutionError extends Error {
    readonly cause: unknown;
    readonly composerMetadata: ComposerResponseMetadata;

    constructor(cause: unknown, composerMetadata: ComposerResponseMetadata) {
        super('Reading execution failed.');
        this.name = 'ReadingExecutionError';
        this.cause = cause;
        this.composerMetadata = composerMetadata;
    }
}

const metadataFor = (
    mode: ComposerRuntimeConfig['mode'],
    context?: ComposedReadingContext
): ComposerResponseMetadata =>
    mode === 'enabled' && context
        ? {
              composerMode: 'enabled',
              corpusVersion: context.corpusVersion,
              namedPairCount: context.namedPairResults.length,
              wholeSpreadCount: context.wholeSpreadResults.length
          }
        : { composerMode: mode };

export function createReadingExecutor({
    composerMode,
    composerRuntime,
    generate
}: ReadingExecutorOptions): ReadingExecutor {
    return {
        async execute(request, requestId) {
            let composerMetadata = metadataFor(composerMode);

            try {
                const context =
                    composerMode === 'enabled'
                        ? await composerRuntime?.compose(request, requestId)
                        : undefined;

                if (composerMode === 'enabled' && !context) {
                    throw new ComposerUnavailableError(
                        'COMPOSER_RUNTIME_NOT_CONFIGURED'
                    );
                }

                composerMetadata = metadataFor(composerMode, context);
                const generation = await generate(request, context, requestId);
                const reading = mapGeneratedReadingResponse(
                    request,
                    generation.generated,
                    composerMetadata
                );

                return {
                    composerMetadata,
                    ...(context === undefined ? {} : { context }),
                    generated: generation.generated,
                    reading,
                    ...(generation.trace === undefined
                        ? {}
                        : { trace: generation.trace })
                };
            } catch (error) {
                throw new ReadingExecutionError(error, composerMetadata);
            }
        }
    };
}
