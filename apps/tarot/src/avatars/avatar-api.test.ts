import { afterEach, describe, expect, it, vi } from 'vitest';

import { createAvatarApiClient, getAvatarApiConfig } from './avatar-api';

const jsonResponse = (body: unknown, ok = true, status = 200) => ({
    headers: {
        get: vi.fn((name: string) =>
            name.toLowerCase() === 'content-type' ? 'application/json' : null
        )
    },
    ok,
    status,
    text: vi.fn().mockResolvedValue(JSON.stringify(body))
});

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
    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    it('loads avatar thumbnails from the REST API with the Cognito access token', async () => {
        const fetchMock = vi.fn().mockResolvedValue(
            jsonResponse({
                thumbnails: ['https://example.com/a.png']
            })
        );
        vi.stubGlobal('fetch', fetchMock);

        const client = createAvatarApiClient({
            accessToken: 'access-token',
            baseUrl: 'https://api.example.com/dev/'
        });

        await expect(client.listAvatarThumbnails()).resolves.toEqual({
            thumbnails: ['https://example.com/a.png']
        });
        expect(fetchMock).toHaveBeenCalledWith('https://api.example.com/dev/avatars', {
            headers: {
                Authorization: 'Bearer access-token'
            },
            method: 'GET'
        });
    });

    it('surfaces API error messages when avatar requests fail', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn().mockResolvedValue(
                jsonResponse(
                    {
                        message: 'Failed to fetch avatar images'
                    },
                    false,
                    500
                )
            )
        );

        const client = createAvatarApiClient({
            baseUrl: 'https://api.example.com'
        });

        await expect(client.listAvatarThumbnails()).rejects.toThrow(
            'Failed to fetch avatar images'
        );
    });

    it('logs response diagnostics when the API returns non-JSON content', async () => {
        const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        vi.stubGlobal(
            'fetch',
            vi.fn().mockResolvedValue({
                headers: {
                    get: vi.fn((name: string) =>
                        name.toLowerCase() === 'content-type'
                            ? 'text/html; charset=utf-8'
                            : null
                    )
                },
                ok: false,
                status: 401,
                text: vi.fn().mockResolvedValue('<!DOCTYPE html><html>Unauthorized</html>')
            })
        );

        const client = createAvatarApiClient({
            accessToken: 'access-token',
            baseUrl: 'https://api.example.com'
        });

        await expect(client.listAvatarThumbnails()).rejects.toThrow(
            'Avatar API returned text/html; charset=utf-8 for GET https://api.example.com/avatars with status 401.'
        );
        expect(consoleWarn).toHaveBeenCalledWith('[avatar-api] non-json response', {
            bodyPreview: '<!DOCTYPE html><html>Unauthorized</html>',
            contentType: 'text/html; charset=utf-8',
            method: 'GET',
            status: 401,
            url: 'https://api.example.com/avatars'
        });
    });
});
