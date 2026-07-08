import { createTarotApiClient as createSharedTarotApiClient } from '@simpletarot/hooks';
import { afterEach, describe, expect, it } from 'vitest';

import { createTarotApiClient, getTarotApiConfig } from './tarot-api';

describe('getTarotApiConfig', () => {
    const originalEnv = process.env;

    afterEach(() => {
        process.env = originalEnv;
    });

    it('returns a trimmed API base URL without a trailing slash', () => {
        process.env = {
            ...originalEnv,
            EXPO_PUBLIC_TAROT_API_URL: ' https://api.example.com/dev/ '
        };

        expect(getTarotApiConfig()).toEqual({
            baseUrl: 'https://api.example.com/dev'
        });
    });

    it('throws a helpful error when the API URL is missing', () => {
        process.env = {
            ...originalEnv,
            EXPO_PUBLIC_TAROT_API_URL: ''
        };

        expect(() => getTarotApiConfig()).toThrow(
            'Missing required Expo public API config: EXPO_PUBLIC_TAROT_API_URL'
        );
    });
});

describe('createTarotApiClient', () => {
    it('re-exports the shared tarot API client factory', () => {
        expect(createTarotApiClient).toBe(createSharedTarotApiClient);
    });
});
