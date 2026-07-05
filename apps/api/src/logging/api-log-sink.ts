import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

export type ApiLogEvent = {
    attemptId?: string;
    awsRequestId?: string;
    cognitoSub?: string;
    durationMs: number;
    errorCode?: string;
    errorMessage?: string;
    hasQuestion?: boolean;
    method: string;
    readingId?: string;
    requestId: string;
    route: string;
    sourceIp: string;
    statusCode: number;
    timestamp: string;
    userAgent?: string;
    [key: string]: unknown;
};

export type SanitizedApiLogEvent = {
    attemptId?: string;
    awsRequestId?: string;
    cognitoSub?: string;
    durationMs: number;
    errorCode?: string;
    errorMessage?: string;
    hasQuestion?: boolean;
    method: string;
    readingId?: string;
    requestId: string;
    route: string;
    sourceIp: string;
    statusCode: number;
    timestamp: string;
    userAgent?: string;
};

export type ApiLogSink = {
    write(event: ApiLogEvent): Promise<void>;
};

type S3LogClient = Pick<S3Client, 'send'>;

export type S3ApiLogSinkOptions = {
    bucketName: string;
    client?: S3LogClient;
};

const optionalFields = (
    event: ApiLogEvent
): Partial<SanitizedApiLogEvent> => ({
    ...(event.attemptId ? { attemptId: event.attemptId } : {}),
    ...(event.awsRequestId ? { awsRequestId: event.awsRequestId } : {}),
    ...(event.cognitoSub ? { cognitoSub: event.cognitoSub } : {}),
    ...(event.errorCode ? { errorCode: event.errorCode } : {}),
    ...(event.errorMessage ? { errorMessage: event.errorMessage } : {}),
    ...(typeof event.hasQuestion === 'boolean'
        ? { hasQuestion: event.hasQuestion }
        : {}),
    ...(event.readingId ? { readingId: event.readingId } : {}),
    ...(event.userAgent ? { userAgent: event.userAgent } : {})
});

export const sanitizeApiLogEvent = (event: ApiLogEvent): SanitizedApiLogEvent => ({
    durationMs: event.durationMs,
    method: event.method,
    requestId: event.requestId,
    route: event.route,
    sourceIp: event.sourceIp,
    statusCode: event.statusCode,
    timestamp: event.timestamp,
    ...optionalFields(event)
});

export const toApiLogObjectKey = (event: Pick<ApiLogEvent, 'requestId' | 'timestamp'>): string => {
    const date = new Date(event.timestamp);

    if (Number.isNaN(date.getTime())) {
        throw new Error(`Invalid API log timestamp "${event.timestamp}".`);
    }

    const year = String(date.getUTCFullYear());
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');

    return `api-logs/year=${year}/month=${month}/day=${day}/${event.requestId}.json`;
};

export const createS3ApiLogSink = ({
    bucketName,
    client = new S3Client({})
}: S3ApiLogSinkOptions): ApiLogSink => ({
    async write(event) {
        const sanitized = sanitizeApiLogEvent(event);

        await client.send(
            new PutObjectCommand({
                Body: `${JSON.stringify(sanitized)}\n`,
                Bucket: bucketName,
                ContentType: 'application/json',
                Key: toApiLogObjectKey(event)
            })
        );
    }
});
