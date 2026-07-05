import { PutObjectCommand } from '@aws-sdk/client-s3';
import { describe, expect, it, vi } from 'vitest';
import {
    createS3ApiLogSink,
    sanitizeApiLogEvent,
    toApiLogObjectKey
} from './api-log-sink';

const event = {
    timestamp: '2026-07-02T14:05:06.000Z',
    requestId: 'request-123',
    method: 'POST',
    route: '/readings',
    statusCode: 200,
    durationMs: 42,
    sourceIp: '203.0.113.42',
    userAgent: 'SimpleTarot/1.0',
    cognitoSub: 'user-sub-123',
    readingId: 'reading-123',
    awsRequestId: 'lambda-request-123',
    hasQuestion: true,
    headers: {
        authorization: 'Bearer secret-token',
        cookie: 'session=secret',
        'content-type': 'application/json'
    },
    requestBody: {
        question: 'Do not log this full prompt.'
    }
};

describe('toApiLogObjectKey', () => {
    it('uses a date-partitioned S3 object key scoped by request id', () => {
        expect(toApiLogObjectKey(event)).toBe(
            'api-logs/year=2026/month=07/day=02/request-123.json'
        );
    });
});

describe('sanitizeApiLogEvent', () => {
    it('keeps request diagnostics and strips tokens, cookies, headers, and request bodies', () => {
        expect(sanitizeApiLogEvent(event)).toEqual({
            awsRequestId: 'lambda-request-123',
            cognitoSub: 'user-sub-123',
            durationMs: 42,
            hasQuestion: true,
            method: 'POST',
            readingId: 'reading-123',
            requestId: 'request-123',
            route: '/readings',
            sourceIp: '203.0.113.42',
            statusCode: 200,
            timestamp: '2026-07-02T14:05:06.000Z',
            userAgent: 'SimpleTarot/1.0'
        });
    });

    it('keeps sanitized failure details without leaking raw error messages', () => {
        expect(
            sanitizeApiLogEvent({
                ...event,
                errorCode: 'BEDROCK_THROTTLED',
                errorMessage: 'Wait a moment and retry the request.',
                statusCode: 429
            })
        ).toMatchObject({
            errorCode: 'BEDROCK_THROTTLED',
            errorMessage: 'Wait a moment and retry the request.',
            statusCode: 429
        });
    });
});

describe('createS3ApiLogSink', () => {
    it('writes one sanitized JSON object to the configured S3 bucket', async () => {
        const send = vi.fn().mockResolvedValue({});
        const sink = createS3ApiLogSink({
            bucketName: 'simple-tarot-dev-api-logs',
            client: {
                send
            }
        });

        await sink.write(event);

        expect(send).toHaveBeenCalledWith(expect.any(PutObjectCommand));
        expect(send.mock.calls[0][0].input).toEqual({
            Body: `${JSON.stringify(sanitizeApiLogEvent(event))}\n`,
            Bucket: 'simple-tarot-dev-api-logs',
            ContentType: 'application/json',
            Key: 'api-logs/year=2026/month=07/day=02/request-123.json'
        });
    });
});
