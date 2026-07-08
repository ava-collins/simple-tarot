'use client';

import { useRscAvatarImage } from '@simpletarot/hooks';
import { AvatarDisplay } from '@simpletarot/ui';

import { listAvatarThumbnailsOnServer } from './server-actions';

type RscAvatarImageProps = {
    accessToken: string | null | undefined;
    saved?: string;
    size?: number | 'small' | 'medium' | 'large' | 'xlarge';
};

export function RscAvatarImage({
    accessToken,
    saved,
    size = 'xlarge'
}: RscAvatarImageProps) {
    const { avatarImage, getNewAvatarImage, saveAvatarImage } = useRscAvatarImage({
        accessToken,
        listAvatarThumbnails: listAvatarThumbnailsOnServer,
        saved
    });

    return (
        <AvatarDisplay
            size={size}
            imageUri={avatarImage}
            onPress={getNewAvatarImage}
            onLongPress={saveAvatarImage}
        />
    );
}
