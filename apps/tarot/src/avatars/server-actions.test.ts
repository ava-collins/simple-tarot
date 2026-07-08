import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@simpletarot/hooks', async importOriginal => {
    const actual = await importOriginal<typeof import('@simpletarot/hooks')>();

    return {
        ...actual,
        createAvatarApiClient: vi.fn()
    };
});
vi.mock('./avatar-api', () => ({
    getAvatarApiConfig: vi.fn(() => ({
        baseUrl: 'https://api.example.com'
    }))
}));
vi.mock('server-only', () => ({}));

import { createAvatarApiClient } from '@simpletarot/hooks';
import { listAvatarThumbnailsOnServer } from './server-actions';

const createClientMock = vi.mocked(createAvatarApiClient);

describe('avatar server actions', () => {
    beforeEach(() => {
        createClientMock.mockReset();
    });

    it('loads avatar thumbnails through the existing API client with the access token', async () => {
        const response = {
            thumbnails: ['https://example.com/a.png']
        };
        const listAvatarThumbnails = vi.fn().mockResolvedValue(response);
        createClientMock.mockReturnValue({
            listAvatarThumbnails
        });

        await expect(listAvatarThumbnailsOnServer('access-token')).resolves.toEqual(response);

        expect(createClientMock).toHaveBeenCalledWith({
            accessToken: 'access-token',
            baseUrl: 'https://api.example.com'
        });
        expect(listAvatarThumbnails).toHaveBeenCalledOnce();
    });
});
