import { Request, RequestHandler, Response, Router } from 'express';
import { createBedrockReadingGenerator } from '../bedrock/bedrock-client';
import { getApiConfig } from '../config';
import { UnauthorizedError } from '../auth/auth-context';
import { toApiError } from '../errors';
import { ApiLogSink } from '../logging/api-log-sink';
import { createS3ApiLogSink } from '../logging/api-log-sink';
import { GeneratedReading, ReadingRequest } from '../readings/contracts';
import { createLocalGeneratedReading } from '../readings/local-generated-reading';
import { createDynamoDbReadingHistoryStore } from '../readings/persistence/dynamodb-reading-history-store';
import {
    ReadingHistoryRecord,
    ReadingHistoryStore
} from '../readings/persistence/contracts';
import { buildReadingPrompt } from '../readings/prompt-builder';
import { mapGeneratedReadingResponse } from '../readings/response-mapper';
import { validateReadingRequest } from '../readings/validation';

type ReadingGenerator = (
    request: ReadingRequest,
    prompt: string,
    requestId?: string
) => Promise<GeneratedReading>;

export type ReadingsRouterOptions = {
    apiLogSink?: ApiLogSink;
    generateReading?: ReadingGenerator;
    generationMode?: GeneratedReading['mode'];
    now?: () => Date;
    readingHistoryStore?: ReadingHistoryStore;
};

const defaultGenerateReading = async (
    request: ReadingRequest,
    prompt: string,
    requestId?: string
): Promise<GeneratedReading> => {
    const config = getApiConfig().bedrock;

    if (config.mode === 'bedrock') {
        return createBedrockReadingGenerator(config, undefined, {
            requestId
        }).generateReading(prompt);
    }

    return createLocalGeneratedReading(request);
};

const authenticatedUserIdFor = (res: Response): string | undefined =>
    typeof res.locals.authenticatedUser?.userId === 'string'
        ? res.locals.authenticatedUser.userId
        : undefined;

const cognitoIssuerFor = (res: Response): string | undefined =>
    typeof res.locals.authenticatedUser?.claims?.iss === 'string'
        ? res.locals.authenticatedUser.claims.iss
        : undefined;

const sourceIpFor = (req: Request): string => {
    const forwardedFor = req.header('x-forwarded-for');

    if (forwardedFor) {
        return forwardedFor.split(',')[0]?.trim() ?? '';
    }

    return req.ip ?? '';
};

const logEventBaseFor = (
    req: Request,
    res: Response,
    timestamp: string,
    startedAtMs: number,
    statusCode: number
) => ({
    cognitoSub: authenticatedUserIdFor(res),
    durationMs: Math.max(0, Date.parse(timestamp) - startedAtMs),
    hasQuestion: typeof req.body?.question === 'string' && req.body.question.length > 0,
    method: req.method,
    requestId: res.locals.requestId,
    route: req.originalUrl,
    sourceIp: sourceIpFor(req),
    statusCode,
    timestamp,
    userAgent: req.header('user-agent')
});

const generationMetadataFor = (
    request: ReadingRequest,
    mode: GeneratedReading['mode']
) => ({
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
    generateReading = defaultGenerateReading,
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

    const prompt = buildReadingPrompt(validation.value);
    const createdAt = now().toISOString();
    const userId = authenticatedUserIdFor(res);
    let generated: GeneratedReading;

    try {
        generated = await generateReading(
            validation.value,
            prompt,
            res.locals.requestId
        );
    } catch (error) {
        const apiError = toApiError(error);

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
                    generationMode
                ),
                request: validation.value,
                requestId: res.locals.requestId,
                userId
            });
        }

        await apiLogSink?.write({
            ...logEventBaseFor(req, res, createdAt, startedAtMs, apiError.status),
            errorCode: apiError.body.code,
            errorMessage: apiError.body.message
        });

        next(error);

        return;
    }

    const readingResponse = mapGeneratedReadingResponse(validation.value, generated);

    try {
        if (readingHistoryStore && userId) {
            await readingHistoryStore.saveSuccessfulReading({
                cognitoIssuer: cognitoIssuerFor(res),
                createdAt,
                generatedReading: generated,
                readingResponse,
                request: validation.value,
                requestId: res.locals.requestId,
                userId
            });
        }

        await apiLogSink?.write({
            ...logEventBaseFor(req, res, createdAt, startedAtMs, 200),
            readingId: readingResponse.readingId
        });

        res.status(200).json(readingResponse);
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

const defaultOptions = (): ReadingsRouterOptions => {
    const config = getApiConfig();

    return {
        apiLogSink: config.apiLog.bucketName
            ? createS3ApiLogSink({
                  bucketName: config.apiLog.bucketName
              })
            : undefined,
        generationMode: config.bedrock.mode,
        readingHistoryStore: config.userData.tableName
            ? createDynamoDbReadingHistoryStore({
                  tableName: config.userData.tableName
              })
            : undefined
    };
};

export const createReadingsRouter = (options: ReadingsRouterOptions = {}) => {
    const router = Router();
    const resolvedOptions = {
        ...defaultOptions(),
        ...options
    };

    router.get('/readings', createListReadingsHandler(resolvedOptions));
    router.post('/readings', createPostReadingHandler(resolvedOptions));

    return router;
};

export const readingsRouter = createReadingsRouter();
