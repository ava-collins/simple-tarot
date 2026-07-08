import {
    TAROT_API_ENV_KEYS,
    type AvatarApiClient,
    type AvatarApiConfig,
    type AvatarsResponse,
    createAvatarApiClient as createSharedAvatarApiClient
} from '@simpletarot/hooks';

export type { AvatarApiClient, AvatarApiConfig, AvatarsResponse };

const readRequiredEnv = (key: typeof TAROT_API_ENV_KEYS.apiUrl) => {
    const value = process.env[key]?.trim();

    if (!value) {
        throw new Error(`Missing required Expo public API config: ${key}`);
    }

    return value;
};

const trimTrailingSlashes = (value: string) => value.replace(/\/+$/, '');

export function getAvatarApiConfig(): AvatarApiConfig {
    return {
        baseUrl: trimTrailingSlashes(readRequiredEnv(TAROT_API_ENV_KEYS.apiUrl))
    };
}

export const createAvatarApiClient = createSharedAvatarApiClient;
