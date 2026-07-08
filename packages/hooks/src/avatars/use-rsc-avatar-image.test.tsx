import TestRenderer, { act } from 'react-test-renderer';
import type { ReactNode } from 'react';
import { Component, Suspense } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AvatarConfig } from '../account/use-avatar-image';
import { useRscAvatarImage, type UseRscAvatarImageResult } from './use-rsc-avatar-image';
import type { AvatarsResponse } from './avatar-contracts';

const fixedRandom = () => 0.75;

function HookProbe({
    accessToken,
    initialAvatarsResource,
    listAvatarThumbnails,
    onRender
}: {
    accessToken: string | null;
    initialAvatarsResource?: Promise<AvatarsResponse>;
    listAvatarThumbnails: (accessToken: string) => Promise<{ thumbnails: string[] }>;
    onRender: (result: UseRscAvatarImageResult) => void;
}) {
    onRender(
        useRscAvatarImage({
            accessToken,
            initialAvatarsResource,
            listAvatarThumbnails,
            random: fixedRandom
        })
    );

    return null;
}

class ErrorBoundary extends Component<
    { children: ReactNode; onError: (error: Error) => void },
    { hasError: boolean }
> {
    state = { hasError: false };

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error: Error) {
        this.props.onError(error);
    }

    render() {
        return this.state.hasError ? null : this.props.children;
    }
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
            const text = [message, ...args]
                .map(item =>
                    item instanceof Error
                        ? item.message
                        : typeof item === 'string'
                          ? item
                          : ''
                )
                .join(' ');

            if (
                text.includes('Initial avatars failed.') ||
                text.includes('The above error occurred') ||
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

    it('seeds avatar thumbnails from a fulfilled initial resource', async () => {
        const listAvatarThumbnails = vi.fn().mockResolvedValue({
            thumbnails: ['fallback.png']
        });
        let result: UseRscAvatarImageResult | undefined;

        await act(async () => {
            TestRenderer.create(
                <Suspense fallback={null}>
                    <HookProbe
                        accessToken="access-token"
                        initialAvatarsResource={Promise.resolve({
                            thumbnails: ['first.png', 'second.png', 'third.png']
                        })}
                        listAvatarThumbnails={listAvatarThumbnails}
                        onRender={nextResult => {
                            result = nextResult;
                        }}
                    />
                </Suspense>
            );
        });

        expect(result?.avatarImage).toBe('third.png');
    });

    it('suspends while the initial avatar resource is pending', async () => {
        const listAvatarThumbnails = vi.fn().mockResolvedValue({
            thumbnails: ['fallback.png']
        });
        let result: UseRscAvatarImageResult | undefined;

        let resolveResource: (value: AvatarsResponse) => void = () => undefined;
        const initialAvatarsResource = new Promise<AvatarsResponse>(resolve => {
            resolveResource = resolve;
        });

        let renderer: TestRenderer.ReactTestRenderer | undefined;

        await act(async () => {
            renderer = TestRenderer.create(
                <Suspense fallback="Loading avatars">
                    <HookProbe
                        accessToken="access-token"
                        initialAvatarsResource={initialAvatarsResource}
                        listAvatarThumbnails={listAvatarThumbnails}
                        onRender={nextResult => {
                            result = nextResult;
                        }}
                    />
                </Suspense>
            );
        });

        expect(renderer?.toJSON()).toBe('Loading avatars');
        expect(result).toBeUndefined();

        await act(async () => {
            resolveResource({
                thumbnails: ['first.png', 'second.png', 'third.png']
            });
            await initialAvatarsResource;
        });

        expect(result?.avatarImage).toBe('third.png');
    });

    it('bubbles rejected initial avatar resources to an error boundary', async () => {
        const listAvatarThumbnails = vi.fn().mockResolvedValue({
            thumbnails: ['fallback.png']
        });
        const resourceError = new Error('Initial avatars failed.');
        const onError = vi.fn();

        await act(async () => {
            TestRenderer.create(
                <ErrorBoundary onError={onError}>
                    <Suspense fallback={null}>
                        <HookProbe
                            accessToken="access-token"
                            initialAvatarsResource={Promise.reject(resourceError)}
                            listAvatarThumbnails={listAvatarThumbnails}
                            onRender={() => undefined}
                        />
                    </Suspense>
                </ErrorBoundary>
            );
        });

        expect(onError).toHaveBeenCalledWith(resourceError);
    });

    it('cycles through seeded avatars after the initial resource resolves', async () => {
        const listAvatarThumbnails = vi.fn().mockResolvedValue({
            thumbnails: ['fallback.png']
        });
        let result: UseRscAvatarImageResult | undefined;

        await act(async () => {
            TestRenderer.create(
                <Suspense fallback={null}>
                    <HookProbe
                        accessToken="access-token"
                        initialAvatarsResource={Promise.resolve({
                            thumbnails: ['first.png', 'second.png', 'third.png']
                        })}
                        listAvatarThumbnails={listAvatarThumbnails}
                        onRender={nextResult => {
                            result = nextResult;
                        }}
                    />
                </Suspense>
            );
        });

        await act(async () => {
            result?.getNewAvatarImage();
        });

        expect(result?.avatarImage).toBe('third.png');
    });
});
