import { JSON_CONTENT_TYPE } from '../constants/tarot-api';

export type RequestMetadata = {
    method: 'GET' | 'POST';
    url: string;
    logPrefix: string;
};

const previewBody = (body: string) => body.slice(0, 240);

const contentTypeFor = (response: Response) =>
    response.headers.get('content-type') ?? '';

export async function parseJsonResponse<T>(
    response: Response,
    request: RequestMetadata
): Promise<T> {
    const contentType = contentTypeFor(response);
    const textBody = await response.text();

    if (!contentType.toLowerCase().includes(JSON_CONTENT_TYPE)) {
        console.warn(`${request.logPrefix} non-json response`, {
            bodyPreview: previewBody(textBody),
            contentType,
            method: request.method,
            status: response.status,
            url: request.url
        });

        throw new Error(
            `API returned ${contentType || 'non-JSON content'} for ${request.method} ${request.url} with status ${response.status}.`
        );
    }

    let body: unknown;

    try {
        body = textBody ? JSON.parse(textBody) : null;
    } catch (error) {
        console.warn(`${request.logPrefix} invalid-json response`, {
            bodyPreview: previewBody(textBody),
            contentType,
            method: request.method,
            status: response.status,
            url: request.url
        });

        throw error;
    }

    if (!response.ok) {
        const message =
            body &&
            typeof body === 'object' &&
            'message' in body &&
            typeof body.message === 'string'
                ? body.message
                : `Request failed with status ${response.status}.`;

        throw new Error(message);
    }

    return body as T;
}

export const trimTrailingSlashes = (value: string) => value.replace(/\/+$/, '');
