import { randomUUID } from 'node:crypto';
import { ErrorRequestHandler, RequestHandler } from 'express';

export type LogContext = Record<string, unknown>;

export type AppLogger = {
    logError(message: string, error: unknown, context?: LogContext): void;
    logInfo(message: string, context?: LogContext): void;
};

const SENSITIVE_HEADERS = new Set([
    'authorization',
    'cookie',
    'proxy-authorization',
    'set-cookie',
    'x-api-key'
]);

const writeLog = (
    level: 'error' | 'info',
    message: string,
    context: LogContext = {}
): void => {
    const entry = {
        level,
        message,
        timestamp: new Date().toISOString(),
        ...context
    };
    const serialized = JSON.stringify(entry);

    if (level === 'error') {
        console.error(serialized);
        return;
    }

    console.log(serialized);
};

const isObjectRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null;

const errorMetadataFor = (error: unknown): unknown => {
    if (!isObjectRecord(error) || !isObjectRecord(error.$metadata)) {
        return undefined;
    }

    const {
        attempts,
        cfId,
        extendedRequestId,
        httpStatusCode,
        requestId,
        totalRetryDelay
    } = error.$metadata;

    return {
        attempts,
        cfId,
        extendedRequestId,
        httpStatusCode,
        requestId,
        totalRetryDelay
    };
};

export const errorDetailsFor = (error: unknown): LogContext => {
    if (error instanceof Error) {
        return {
            message: error.message,
            metadata: errorMetadataFor(error),
            name: error.name,
            stack: error.stack
        };
    }

    if (isObjectRecord(error)) {
        return {
            metadata: errorMetadataFor(error),
            name: 'UnknownErrorObject'
        };
    }

    return {
        message: String(error),
        name: 'UnknownError'
    };
};

export const sanitizeHeaders = (
    headers: Record<string, string | string[] | undefined>
): Record<string, string | string[] | undefined> =>
    Object.fromEntries(
        Object.entries(headers).map(([name, value]) => [
            name,
            SENSITIVE_HEADERS.has(name.toLowerCase()) ? '[REDACTED]' : value
        ])
    );

export const logInfo = (message: string, context?: LogContext): void => {
    writeLog('info', message, context);
};

export const logError = (
    message: string,
    error: unknown,
    context?: LogContext
): void => {
    writeLog('error', message, {
        ...context,
        error: errorDetailsFor(error)
    });
};

export const logger: AppLogger = {
    logError,
    logInfo
};

export const requestIdMiddleware: RequestHandler = (req, res, next) => {
    res.locals.requestId =
        req.header('x-request-id') ?? req.header('x-amzn-trace-id') ?? randomUUID();
    next();
};

export const requestLoggingMiddleware: RequestHandler = (req, res, next) => {
    const startedAt = process.hrtime.bigint();

    res.on('finish', () => {
        const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;

        logInfo('HTTP request completed.', {
            durationMs: Math.round(durationMs),
            method: req.method,
            requestId: res.locals.requestId,
            route: req.originalUrl,
            statusCode: res.statusCode,
            userAgent: req.header('user-agent')
        });
    });

    next();
};

export const errorLoggingMiddleware: ErrorRequestHandler = (
    error,
    req,
    res,
    next
) => {
    logError('HTTP request failed.', error, {
        headers: sanitizeHeaders(req.headers),
        method: req.method,
        requestId: res.locals.requestId,
        route: req.originalUrl
    });
    next(error);
};
