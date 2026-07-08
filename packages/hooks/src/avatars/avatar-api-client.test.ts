import { afterEach, describe, expect, it, vi } from 'vitest';

import { createAvatarApiClient } from '../../index';

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
            'API returned text/html; charset=utf-8 for GET https://api.example.com/avatars with status 401.'
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
