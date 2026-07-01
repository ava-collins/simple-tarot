import { ErrorRequestHandler } from 'express';

export type ApiErrorBody = {
    code: string;
    message: string;
};

export type ApiError = {
    status: number;
    body: ApiErrorBody;
};

const errorName = (error: unknown): string | undefined =>
    typeof error === 'object' && error !== null && 'name' in error
        ? String(error.name)
        : undefined;

export function toApiError(error: unknown): ApiError {
    if (errorName(error) === 'ThrottlingException') {
        return {
            status: 429,
            body: {
                code: 'BEDROCK_THROTTLED',
                message:
                    'Bedrock is throttling reading generation. Wait a moment and retry the request.'
            }
        };
    }

    return {
        status: 500,
        body: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Unexpected API error.'
        }
    };
}

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
    const apiError = toApiError(error);
    res.status(apiError.status).json(apiError.body);
};
