import {
    TAROT_API_ENV_KEYS,
    trimTrailingSlashes,
    type AvatarApiConfig,
    type TarotApiConfig
} from '@simpletarot/hooks/server';

const readRequiredEnv = (key: typeof TAROT_API_ENV_KEYS.apiUrl) => {
    const value = process.env[key]?.trim();

    if (!value) {
        throw new Error(`Missing required Expo public API config: ${key}`);
    }

    return value;
};

const getApiBaseUrl = () => trimTrailingSlashes(readRequiredEnv(TAROT_API_ENV_KEYS.apiUrl));

export function getTarotApiConfig(): TarotApiConfig {
    return {
        baseUrl: getApiBaseUrl()
    };
}

export function getAvatarApiConfig(): AvatarApiConfig {
    return {
        baseUrl: getApiBaseUrl()
    };
}
