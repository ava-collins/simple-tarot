import { createAvatarApiClient as createSharedAvatarApiClient } from '@simpletarot/hooks/server';
import { afterEach, describe, expect, it } from 'vitest';

import { createAvatarApiClient, getAvatarApiConfig } from './avatar-api';

describe('getAvatarApiConfig', () => {
    const originalEnv = process.env;

    afterEach(() => {
        process.env = originalEnv;
    });

    it('returns a trimmed API base URL without a trailing slash', () => {
        process.env = {
            ...originalEnv,
            EXPO_PUBLIC_TAROT_API_URL: ' https://api.example.com/dev/ '
        };

        expect(getAvatarApiConfig()).toEqual({
            baseUrl: 'https://api.example.com/dev'
        });
    });

    it('throws a helpful error when the API URL is missing', () => {
        process.env = {
            ...originalEnv,
            EXPO_PUBLIC_TAROT_API_URL: ''
        };

        expect(() => getAvatarApiConfig()).toThrow(
            'Missing required Expo public API config: EXPO_PUBLIC_TAROT_API_URL'
        );
    });
});

describe('createAvatarApiClient', () => {
    it('re-exports the shared avatar API client factory', () => {
        expect(createAvatarApiClient).toBe(createSharedAvatarApiClient);
    });
});
