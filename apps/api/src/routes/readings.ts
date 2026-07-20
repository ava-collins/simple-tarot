import { RequestHandler, Router } from 'express';
import { UnauthorizedError } from '../auth/auth-context';
import { toApiError } from '../errors';
import type { ApiLogSink } from '../logging/api-log-sink';
import {
    ComposerResponseMetadata,
    GeneratedReading,
    ReadingRequest
} from '../readings/contracts';
import { createLocalGeneratedReading } from '../readings/local-generated-reading';
import {
    ReadingHistoryRecord,
    ReadingHistoryStore
} from '../readings/persistence/contracts';
import {
    ReadingExecutionError,
    createReadingExecutor,
    type ReadingExecution,
    type ReadingExecutor
} from '../readings/reading-executor';
import { validateReadingRequest } from '../readings/validation';
import {
    authenticatedUserIdFor,
    cognitoIssuerFor,
    readingLogEventBaseFor
} from './reading-request-context';

export type ReadingsRouterOptions = {
    apiLogSink?: ApiLogSink;
    executor?: ReadingExecutor;
    generationMode?: GeneratedReading['mode'];
    now?: () => Date;
    readingHistoryStore?: ReadingHistoryStore;
};

const defaultExecutor = createReadingExecutor({
    composerMode: 'disabled',
    generate: async request => ({
        generated: createLocalGeneratedReading(request)
    })
});

const generationMetadataFor = (
    request: ReadingRequest,
    mode: GeneratedReading['mode'],
    composerMetadata: ComposerResponseMetadata
) => ({
    ...composerMetadata,
    itemCount: request.items.length,
    mode
});

const historyItemFor = (record: ReadingHistoryRecord) => ({
    createdAt: record.createdAt,
    metadata: record.readingResponse.metadata,
    question: record.question,
    readingId: record.readingId,
    spread: record.spread,
    summary: record.readingResponse.summary
});

const limitFor = (value: unknown): number | undefined => {
    if (typeof value !== 'string' || value.length === 0) {
        return undefined;
    }

    const parsed = Number.parseInt(value, 10);

    return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
};

export const createPostReadingHandler = ({
    apiLogSink,
    executor = defaultExecutor,
    generationMode = 'local',
    now = () => new Date(),
    readingHistoryStore
}: ReadingsRouterOptions = {}): RequestHandler => async (req, res, next) => {
    const startedAtMs = now().getTime();
    const validation = validateReadingRequest(req.body);

    if (!validation.ok) {
        res.status(400).json({
            errors: validation.errors
        });

        return;
    }

    const createdAt = now().toISOString();
    const userId = authenticatedUserIdFor(res);
    let execution: ReadingExecution;

    try {
        execution = await executor.execute(
            validation.value,
            res.locals.requestId
        );
    } catch (error) {
        const cause =
            error instanceof ReadingExecutionError ? error.cause : error;
        const composerMetadata =
            error instanceof ReadingExecutionError
                ? error.composerMetadata
                : { composerMode: 'disabled' as const };
        const apiError = toApiError(cause);

        if (readingHistoryStore && userId) {
            await readingHistoryStore.saveFailedReadingAttempt({
                createdAt,
                failure: {
                    code: apiError.body.code,
                    message: apiError.body.message,
                    statusCode: apiError.status
                },
                generationMetadata: generationMetadataFor(
                    validation.value,
                    generationMode,
                    composerMetadata
                ),
                request: validation.value,
                requestId: res.locals.requestId,
                userId
            });
        }

        await apiLogSink?.write({
            ...readingLogEventBaseFor(
                req,
                res,
                createdAt,
                startedAtMs,
                apiError.status
            ),
            errorCode: apiError.body.code,
            errorMessage: apiError.body.message
        });

        next(cause);

        return;
    }

    try {
        if (readingHistoryStore && userId) {
            await readingHistoryStore.saveSuccessfulReading({
                cognitoIssuer: cognitoIssuerFor(res),
                createdAt,
                generatedReading: execution.generated,
                readingResponse: execution.reading,
                request: validation.value,
                requestId: res.locals.requestId,
                userId
            });
        }

        await apiLogSink?.write({
            ...readingLogEventBaseFor(req, res, createdAt, startedAtMs, 200),
            readingId: execution.reading.readingId
        });

        res.status(200).json(execution.reading);
    } catch (error) {
        next(error);
    }
};

export const createListReadingsHandler = ({
    readingHistoryStore
}: Pick<ReadingsRouterOptions, 'readingHistoryStore'> = {}): RequestHandler => async (
    req,
    res,
    next
) => {
    const userId = authenticatedUserIdFor(res);

    if (!userId) {
        next(new UnauthorizedError());

        return;
    }

    try {
        const records = readingHistoryStore
            ? await readingHistoryStore.listSuccessfulReadingsByUser({
                  limit: limitFor(req.query.limit),
                  userId
              })
            : [];

        res.status(200).json({
            readings: records.map(historyItemFor)
        });
    } catch (error) {
        next(error);
    }
};

export const createReadingsRouter = (options: ReadingsRouterOptions = {}) => {
    const router = Router();

    router.get('/readings', createListReadingsHandler(options));
    router.post('/readings', createPostReadingHandler(options));

    return router;
};
