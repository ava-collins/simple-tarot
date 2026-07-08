import TestRenderer, { act } from 'react-test-renderer';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AvatarConfig } from '../account/use-avatar-image';
import { useRscAvatarImage, type UseRscAvatarImageResult } from './use-rsc-avatar-image';

const fixedRandom = () => 0.75;

function HookProbe({
    accessToken,
    listAvatarThumbnails,
    onRender
}: {
    accessToken: string | null;
    listAvatarThumbnails: (accessToken: string) => Promise<{ thumbnails: string[] }>;
    onRender: (result: UseRscAvatarImageResult) => void;
}) {
    onRender(
        useRscAvatarImage({
            accessToken,
            listAvatarThumbnails,
            random: fixedRandom
        })
    );

    return null;
}

describe('useRscAvatarImage', () => {
    beforeEach(() => {
        (
            globalThis as typeof globalThis & {
                IS_REACT_ACT_ENVIRONMENT: boolean;
            }
        ).IS_REACT_ACT_ENVIRONMENT = true;
        const consoleError = console.error;

        vi.spyOn(console, 'error').mockImplementation((message?: unknown, ...args) => {
            const text = typeof message === 'string' ? message : '';

            if (
                text.includes('react-test-renderer is deprecated') ||
                text.includes(
                    'The current testing environment is not configured to support act'
                )
            ) {
                return;
            }

            consoleError(message, ...args);
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('loads thumbnails and selects one on mount', async () => {
        const listAvatarThumbnails = vi.fn().mockResolvedValue({
            thumbnails: ['first.png', 'second.png', 'third.png']
        });
        let result: UseRscAvatarImageResult | undefined;

        await act(async () => {
            TestRenderer.create(
                <HookProbe
                    accessToken="access-token"
                    listAvatarThumbnails={listAvatarThumbnails}
                    onRender={nextResult => {
                        result = nextResult;
                    }}
                />
            );
        });

        expect(listAvatarThumbnails).toHaveBeenCalledWith('access-token');
        expect(result?.avatarImage).toBe('third.png');
        expect(result?.error).toBeUndefined();
    });

    it('keeps the default avatar when the server returns no thumbnails', async () => {
        const listAvatarThumbnails = vi.fn().mockResolvedValue({
            thumbnails: []
        });
        let result: UseRscAvatarImageResult | undefined;

        await act(async () => {
            TestRenderer.create(
                <HookProbe
                    accessToken="access-token"
                    listAvatarThumbnails={listAvatarThumbnails}
                    onRender={nextResult => {
                        result = nextResult;
                    }}
                />
            );
        });

        expect(result?.avatarImage).toBe(AvatarConfig.DEFAULT_AVATAR_IMAGE);
    });

    it('cycles through loaded thumbnails without another server call', async () => {
        const listAvatarThumbnails = vi.fn().mockResolvedValue({
            thumbnails: ['first.png', 'second.png', 'third.png']
        });
        let result: UseRscAvatarImageResult | undefined;

        await act(async () => {
            TestRenderer.create(
                <HookProbe
                    accessToken="access-token"
                    listAvatarThumbnails={listAvatarThumbnails}
                    onRender={nextResult => {
                        result = nextResult;
                    }}
                />
            );
        });

        await act(async () => {
            result?.getNewAvatarImage();
        });

        expect(result?.avatarImage).toBe('third.png');
        expect(listAvatarThumbnails).toHaveBeenCalledOnce();
    });

    it('does not call the server function without an access token', async () => {
        const listAvatarThumbnails = vi.fn().mockResolvedValue({
            thumbnails: ['first.png']
        });

        await act(async () => {
            TestRenderer.create(
                <HookProbe
                    accessToken={null}
                    listAvatarThumbnails={listAvatarThumbnails}
                    onRender={() => undefined}
                />
            );
        });

        expect(listAvatarThumbnails).not.toHaveBeenCalled();
    });
});
