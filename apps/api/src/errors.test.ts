import { describe, expect, it } from 'vitest';
import { toApiError } from './errors';

describe('toApiError', () => {
    it('maps unauthorized errors to a generic 401 response', () => {
        const error = Object.assign(new Error('token details should not leak'), {
            name: 'UnauthorizedError',
            status: 401
        });

        expect(toApiError(error)).toEqual({
            status: 401,
            body: {
                code: 'UNAUTHORIZED',
                message: 'Authentication is required.'
            }
        });
    });

    it('maps Bedrock throttling errors to a retryable 429 response', () => {
        const error = Object.assign(new Error('Your request rate is too high.'), {
            name: 'ThrottlingException'
        });

        expect(toApiError(error)).toEqual({
            status: 429,
            body: {
                code: 'BEDROCK_THROTTLED',
                message:
                    'Bedrock is throttling reading generation. Wait a moment and retry the request.'
            }
        });
    });

    it('maps unknown errors to a generic 500 response', () => {
        expect(toApiError(new Error('boom'))).toEqual({
            status: 500,
            body: {
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Unexpected API error.'
            }
        });
    });
});
