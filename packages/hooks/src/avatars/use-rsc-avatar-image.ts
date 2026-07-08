'use client';

import { useCallback, useEffect, useState } from 'react';

import { AvatarConfig } from '../account/use-avatar-image';
import type { AvatarsResponse } from './avatar-contracts';

export type UseRscAvatarImageOptions = {
    accessToken: string | null | undefined;
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
    listAvatarThumbnails,
    random = Math.random,
    saved
}: UseRscAvatarImageOptions): UseRscAvatarImageResult {
    const [avatarImage, setAvatarImage] = useState<string>(
        saved || AvatarConfig.DEFAULT_AVATAR_IMAGE
    );
    const [images, setImages] = useState<string[]>([]);
    const [error, setError] = useState<Error | undefined>();

    useEffect(() => {
        if (saved) {
            setAvatarImage(saved);
        }
    }, [saved]);

    useEffect(() => {
        let isMounted = true;

        const loadAvatars = async () => {
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
    }, [accessToken, listAvatarThumbnails, random, saved]);

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
