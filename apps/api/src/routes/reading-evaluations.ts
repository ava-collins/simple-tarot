import type { RequestHandler } from 'express';
import { Router } from 'express';
import { ComposerUnavailableError } from '../composer/errors';
import {
    EVALUATION_SCHEMA_VERSION,
    READING_EVALUATIONS_PATH
} from '../evaluations/constants';
import type { ReadingEvaluationResponse } from '../evaluations/contracts';
import { toApiError } from '../errors';
import type { ApiLogSink } from '../logging/api-log-sink';
import {
    ReadingExecutionError,
    type ReadingExecutor
} from '../readings/reading-executor';
import { validateReadingRequest } from '../readings/validation';
import { readingLogEventBaseFor } from './reading-request-context';

export type ReadingEvaluationsRouterOptions = {
    apiLogSink?: ApiLogSink;
    executor: ReadingExecutor;
    now?: () => Date;
};

export const createPostReadingEvaluationHandler = ({
    apiLogSink,
    executor,
    now = () => new Date()
}: ReadingEvaluationsRouterOptions): RequestHandler => async (req, res, next) => {
    const startedAtMs = now().getTime();
    const validation = validateReadingRequest(req.body);

    if (!validation.ok) {
        res.status(400).json({ errors: validation.errors });

        return;
    }

    const evaluatedAt = now().toISOString();

    try {
        const execution = await executor.execute(
            validation.value,
            res.locals.requestId
        );

        if (
            !execution.context ||
            !execution.trace ||
            execution.context.corpusVersion !==
                execution.trace.retrieval.filter.corpusVersion
        ) {
            throw new ComposerUnavailableError(
                'EVALUATION_EXECUTION_TRACE_UNAVAILABLE'
            );
        }

        const response: ReadingEvaluationResponse = {
            corpusVersion: execution.context.corpusVersion,
            evaluatedAt,
            reading: execution.reading,
            requestId: res.locals.requestId,
            schemaVersion: EVALUATION_SCHEMA_VERSION,
            trace: {
                generation: execution.trace.generation,
                prompt: execution.trace.prompt,
                resolvedContext: execution.context,
                retrieval: execution.trace.retrieval
            }
        };

        await apiLogSink?.write({
            ...readingLogEventBaseFor(req, res, evaluatedAt, startedAtMs, 200),
            returnedResultCount:
                execution.trace.retrieval.returnedResultCount,
            usableResultCount: execution.trace.retrieval.usableResultCount
        });

        res.status(200).json(response);
    } catch (error) {
        const cause =
            error instanceof ReadingExecutionError ? error.cause : error;
        const apiError = toApiError(cause);

        await apiLogSink?.write({
            ...readingLogEventBaseFor(
                req,
                res,
                evaluatedAt,
                startedAtMs,
                apiError.status
            ),
            errorCode: apiError.body.code,
            errorMessage: apiError.body.message
        });

        next(cause);
    }
};

export const createReadingEvaluationsRouter = (
    options: ReadingEvaluationsRouterOptions
) => {
    const router = Router();

    router.post(
        READING_EVALUATIONS_PATH,
        createPostReadingEvaluationHandler(options)
    );

    return router;
};
