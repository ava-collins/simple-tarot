import { describe, expect, it, vi } from 'vitest';
import { logError, sanitizeHeaders } from './logger';

describe('sanitizeHeaders', () => {
    it('redacts sensitive headers and preserves useful request context', () => {
        expect(
            sanitizeHeaders({
                authorization: 'Bearer secret',
                'content-type': 'application/json',
                cookie: 'session=secret',
                'x-request-id': 'req-123'
            })
        ).toEqual({
            authorization: '[REDACTED]',
            'content-type': 'application/json',
            cookie: '[REDACTED]',
            'x-request-id': 'req-123'
        });
    });
});

describe('logError', () => {
    it('writes structured error details for deployment log collectors', () => {
        const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
        const error = Object.assign(new Error('Access denied'), {
            $metadata: {
                httpStatusCode: 403,
                requestId: 'aws-request-123'
            },
            name: 'AccessDeniedException'
        });

        logError('Bedrock request failed.', error, {
            requestId: 'req-123',
            route: 'POST /readings'
        });

        expect(spy).toHaveBeenCalledTimes(1);
        expect(JSON.parse(spy.mock.calls[0][0])).toEqual({
            level: 'error',
            message: 'Bedrock request failed.',
            requestId: 'req-123',
            route: 'POST /readings',
            timestamp: expect.any(String),
            error: {
                message: 'Access denied',
                metadata: {
                    httpStatusCode: 403,
                    requestId: 'aws-request-123'
                },
                name: 'AccessDeniedException',
                stack: expect.any(String)
            }
        });

        spy.mockRestore();
    });
});
