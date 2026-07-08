import type { AvatarsResponse } from './avatar-contracts';

export type AvatarApiConfig = {
    accessToken?: string;
    baseUrl: string;
};

export type AvatarApiClient = {
    listAvatarThumbnails: () => Promise<AvatarsResponse>;
};

const readRequiredEnv = (key: 'EXPO_PUBLIC_TAROT_API_URL') => {
    const value = process.env[key]?.trim();

    if (!value) {
        throw new Error(`Missing required Expo public API config: ${key}`);
    }

    return value;
};

const trimTrailingSlashes = (value: string) => value.replace(/\/+$/, '');

type RequestMetadata = {
    method: 'GET';
    url: string;
};

const previewBody = (body: string) => body.slice(0, 240);

const contentTypeFor = (response: Response) => response.headers.get('content-type') ?? '';

async function parseJsonResponse<T>(
    response: Response,
    request: RequestMetadata
): Promise<T> {
    const contentType = contentTypeFor(response);
    const textBody = await response.text();

    if (!contentType.toLowerCase().includes('application/json')) {
        console.warn('[avatar-api] non-json response', {
            bodyPreview: previewBody(textBody),
            contentType,
            method: request.method,
            status: response.status,
            url: request.url
        });

        throw new Error(
            `Avatar API returned ${contentType || 'non-JSON content'} for ${request.method} ${request.url} with status ${response.status}.`
        );
    }

    let body: unknown;

    try {
        body = textBody ? JSON.parse(textBody) : null;
    } catch (error) {
        console.warn('[avatar-api] invalid-json response', {
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

export function getAvatarApiConfig(): AvatarApiConfig {
    return {
        baseUrl: trimTrailingSlashes(readRequiredEnv('EXPO_PUBLIC_TAROT_API_URL'))
    };
}

export function createAvatarApiClient({
    accessToken,
    baseUrl
}: AvatarApiConfig): AvatarApiClient {
    const apiBaseUrl = trimTrailingSlashes(baseUrl);
    const authHeaders = accessToken
        ? {
              Authorization: `Bearer ${accessToken}`
          }
        : undefined;

    return {
        async listAvatarThumbnails() {
            const url = `${apiBaseUrl}/avatars`;
            const method = 'GET';
            const response = await fetch(url, {
                ...(authHeaders ? { headers: authHeaders } : {}),
                method
            });

            return parseJsonResponse<AvatarsResponse>(response, { method, url });
        }
    };
}
