import { useCallback, useEffect, useState } from 'react';

export enum AvatarConfig {
    DEFAULT_AVATAR_IMAGE = 'https://images.rawpixel.com/image_png_social_square/czNmcy1wcml2YXRlL3Jhd3BpeGVsX2ltYWdlcy93ZWJzaXRlX2NvbnRlbnQvam9iNjY4LTExNS1wXzEtbDE0YW1vbXgucG5n.png'
}

type AvatarsResponse = {
    thumbnails: string[];
};

const useAvatarImage = (apiBaseUrl: string) => {
    const [avatarImage, setAvatarImage] = useState<string>(
        AvatarConfig.DEFAULT_AVATAR_IMAGE
    );
    const [images, setImages] = useState<string[]>([]);
    const [error, setError] = useState<Error | undefined>();

    useEffect(() => {
        if (!apiBaseUrl) return;

        const fetchAvatars = async () => {
            try {
                const response = await fetch(`${apiBaseUrl}/avatars`);
                if (!response.ok) {
                    throw new Error(`Avatar fetch failed with status ${response.status}`);
                }
                const data: AvatarsResponse = await response.json();
                if (data.thumbnails.length > 0) {
                    const randomIndex = Math.floor(
                        Math.random() * data.thumbnails.length
                    );
                    setAvatarImage(
                        data.thumbnails[randomIndex] ?? AvatarConfig.DEFAULT_AVATAR_IMAGE
                    );
                    setImages(data.thumbnails);
                }
            } catch (err) {
                setError(err instanceof Error ? err : new Error('Unknown error'));
            }
        };

        fetchAvatars();
    }, [apiBaseUrl]);

    const getAvatarImage = () => avatarImage;

    const saveAvatarImage = () => {
        console.log('Long press on avatar image');
    };

    const getNewAvatarImage = useCallback(() => {
        if (images.length === 0) return;
        const randomIndex = Math.floor(Math.random() * images.length);
        setAvatarImage(images[randomIndex] ?? AvatarConfig.DEFAULT_AVATAR_IMAGE);
    }, [images]);

    return { avatarImage, error, getAvatarImage, getNewAvatarImage, saveAvatarImage };
};

export default useAvatarImage;
