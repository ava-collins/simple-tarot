'use client';

import { use, useCallback, useEffect, useState } from 'react';

import { AvatarConfig } from '../account/use-avatar-image';
import type { AvatarsResponse } from './avatar-contracts';
import type { AvatarThumbnailsResource } from './avatar-resources';

export type UseRscAvatarImageOptions = {
    accessToken: string | null | undefined;
    initialAvatarsResource?: AvatarThumbnailsResource;
    listAvatarThumbnails: (accessToken: string) => Promise<AvatarsResponse>;
    random?: () => number;
    saved?: string;
};

export type UseRscAvatarImageResult = {
    avatarImage: string;
    error: Error | undefined;
    getAvatarImage: () => string;
    getNewAvatarImage: () => void;
    saveAvatarImage: () => void;
};

const chooseImage = (thumbnails: string[], random: () => number): string | undefined => {
    if (thumbnails.length === 0) {
        return undefined;
    }

    const randomIndex = Math.floor(random() * thumbnails.length);

    return thumbnails[randomIndex] ?? AvatarConfig.DEFAULT_AVATAR_IMAGE;
};

export function useRscAvatarImage({
    accessToken,
    initialAvatarsResource,
    listAvatarThumbnails,
    random = Math.random,
    saved
}: UseRscAvatarImageOptions): UseRscAvatarImageResult {
    const initialThumbnails = initialAvatarsResource
        ? use(initialAvatarsResource).thumbnails
        : [];
    const initialAvatarImage =
        saved ||
        chooseImage(initialThumbnails, random) ||
        AvatarConfig.DEFAULT_AVATAR_IMAGE;
    const [avatarImage, setAvatarImage] = useState<string>(
        initialAvatarImage
    );
    const [images, setImages] = useState<string[]>(initialThumbnails);
    const [error, setError] = useState<Error | undefined>();

    useEffect(() => {
        if (saved) {
            setAvatarImage(saved);
        }
    }, [saved]);

    useEffect(() => {
        let isMounted = true;

        const loadAvatars = async () => {
            if (initialAvatarsResource) {
                return;
            }

            if (!accessToken) {
                return;
            }

            try {
                const response = await listAvatarThumbnails(accessToken);

                if (!isMounted) {
                    return;
                }

                setImages(response.thumbnails);

                if (!saved) {
                    setAvatarImage(
                        chooseImage(response.thumbnails, random) ??
                            AvatarConfig.DEFAULT_AVATAR_IMAGE
                    );
                }
            } catch (avatarError) {
                if (!isMounted) {
                    return;
                }

                setError(
                    avatarError instanceof Error
                        ? avatarError
                        : new Error('Unknown error')
                );
            }
        };

        void loadAvatars();

        return () => {
            isMounted = false;
        };
    }, [accessToken, initialAvatarsResource, listAvatarThumbnails, random, saved]);

    const getAvatarImage = () => avatarImage;

    const saveAvatarImage = () => {
        console.log('Long press on avatar image');
    };

    const getNewAvatarImage = useCallback(() => {
        const nextImage = chooseImage(images, random);

        if (nextImage) {
            setAvatarImage(nextImage);
        }
    }, [images, random]);

    return {
        avatarImage,
        error,
        getAvatarImage,
        getNewAvatarImage,
        saveAvatarImage
    };
}
