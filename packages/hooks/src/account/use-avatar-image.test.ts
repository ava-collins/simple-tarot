import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import useAvatarImage, { AvatarConfig } from './use-avatar-image';

const mockThumbnails = [
    'https://example.com/image1.jpg',
    'https://example.com/image2.jpg',
    'https://example.com/image3.jpg'
];

const mockFetch = (thumbnails: string[], status = 200) =>
    vi.fn().mockResolvedValue({
        ok: status < 400,
        status,
        json: async () => ({ thumbnails })
    });

const mockMathRandom = vi.spyOn(Math, 'random');
const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

const API_URL = 'https://api.example.com';

describe('useAvatarImage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockMathRandom.mockReturnValue(0.5);
    });

    it('should initialize with default avatar image', () => {
        vi.stubGlobal('fetch', mockFetch(mockThumbnails));
        const { result } = renderHook(() => useAvatarImage(API_URL));
        expect(result.current.avatarImage).toBe(AvatarConfig.DEFAULT_AVATAR_IMAGE);
        expect(result.current.error).toBeUndefined();
    });

    it('should set random avatar image after successful fetch', async () => {
        mockMathRandom.mockReturnValue(0.5);
        vi.stubGlobal('fetch', mockFetch(mockThumbnails));
        const { result } = renderHook(() => useAvatarImage(API_URL));

        await waitFor(() => {
            expect(result.current.avatarImage).toBe(mockThumbnails[1]);
        });
    });

    it('should call fetch with correct avatars URL', async () => {
        const fetchMock = mockFetch(mockThumbnails);
        vi.stubGlobal('fetch', fetchMock);
        renderHook(() => useAvatarImage(API_URL));

        await waitFor(() => {
            expect(fetchMock).toHaveBeenCalledWith(`${API_URL}/avatars`);
        });
    });

    it('should skip fetch when apiBaseUrl is empty', async () => {
        const fetchMock = mockFetch(mockThumbnails);
        vi.stubGlobal('fetch', fetchMock);
        renderHook(() => useAvatarImage(''));

        await new Promise(r => setTimeout(r, 10));
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('should handle fetch network error', async () => {
        vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));
        const { result } = renderHook(() => useAvatarImage(API_URL));

        await waitFor(() => {
            expect(result.current.error).toBeDefined();
        });
        expect(result.current.avatarImage).toBe(AvatarConfig.DEFAULT_AVATAR_IMAGE);
    });

    it('should handle non-ok response', async () => {
        vi.stubGlobal('fetch', mockFetch([], 500));
        const { result } = renderHook(() => useAvatarImage(API_URL));

        await waitFor(() => {
            expect(result.current.error).toBeDefined();
        });
        expect(result.current.avatarImage).toBe(AvatarConfig.DEFAULT_AVATAR_IMAGE);
    });

    it('should remain on default image when thumbnails array is empty', async () => {
        const fetchMock = mockFetch([]);
        vi.stubGlobal('fetch', fetchMock);
        const { result } = renderHook(() => useAvatarImage(API_URL));

        await waitFor(() => {
            expect(fetchMock).toHaveBeenCalled();
        });
        expect(result.current.avatarImage).toBe(AvatarConfig.DEFAULT_AVATAR_IMAGE);
    });

    it('should cycle images with getNewAvatarImage', async () => {
        vi.stubGlobal('fetch', mockFetch(mockThumbnails));
        const { result } = renderHook(() => useAvatarImage(API_URL));

        await waitFor(() => {
            expect(result.current.avatarImage).toBe(mockThumbnails[1]);
        });

        mockMathRandom.mockReturnValue(0.1);
        act(() => {
            result.current.getNewAvatarImage();
        });
        expect(result.current.avatarImage).toBe(mockThumbnails[0]);

        mockMathRandom.mockReturnValue(0.9);
        act(() => {
            result.current.getNewAvatarImage();
        });
        expect(result.current.avatarImage).toBe(mockThumbnails[2]);
    });

    it('should not change image when getNewAvatarImage called before fetch completes', () => {
        vi.stubGlobal('fetch', mockFetch([]));
        const { result } = renderHook(() => useAvatarImage(API_URL));

        act(() => {
            result.current.getNewAvatarImage();
        });
        expect(result.current.avatarImage).toBe(AvatarConfig.DEFAULT_AVATAR_IMAGE);
    });

    it('should log on saveAvatarImage', () => {
        vi.stubGlobal('fetch', mockFetch([]));
        const { result } = renderHook(() => useAvatarImage(API_URL));

        act(() => {
            result.current.saveAvatarImage();
        });
        expect(consoleSpy).toHaveBeenCalledWith('Long press on avatar image');
    });

    it('should return all expected interface members', () => {
        vi.stubGlobal('fetch', mockFetch([]));
        const { result } = renderHook(() => useAvatarImage(API_URL));

        expect(typeof result.current.avatarImage).toBe('string');
        expect(typeof result.current.error).toBe('undefined');
        expect(typeof result.current.getAvatarImage).toBe('function');
        expect(typeof result.current.getNewAvatarImage).toBe('function');
        expect(typeof result.current.saveAvatarImage).toBe('function');
    });
});
