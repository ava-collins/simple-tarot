import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./avatar-api', () => ({
    createAvatarApiClient: vi.fn(),
    getAvatarApiConfig: vi.fn(() => ({
        baseUrl: 'https://api.example.com'
    }))
}));
vi.mock('server-only', () => ({}));

import { createAvatarApiClient } from './avatar-api';
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
