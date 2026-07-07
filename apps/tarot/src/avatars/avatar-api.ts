import type { AvatarsResponse } from './avatar-contracts';

export type AvatarApiConfig = {
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

async function parseJsonResponse<T>(response: Response): Promise<T> {
    const textBody = await response.text();
    const body: unknown = textBody ? JSON.parse(textBody) : null;

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

export function createAvatarApiClient({ baseUrl }: AvatarApiConfig): AvatarApiClient {
    const apiBaseUrl = trimTrailingSlashes(baseUrl);

    return {
        async listAvatarThumbnails() {
            const response = await fetch(`${apiBaseUrl}/avatars`, {
                method: 'GET'
            });

            return parseJsonResponse<AvatarsResponse>(response);
        }
    };
}
