'use client';

import Avatar from '@rneui/themed/dist/Avatar';

import { useRscAvatarImage } from './use-rsc-avatar-image';

type RscAvatarImageProps = {
    saved?: string;
    size?: number | 'small' | 'medium' | 'large' | 'xlarge';
};

export function RscAvatarImage({ saved, size = 'xlarge' }: RscAvatarImageProps) {
    const { avatarImage, getNewAvatarImage, saveAvatarImage } = useRscAvatarImage({
        saved
    });

    return (
        <Avatar
            size={size}
            rounded
            source={{ uri: avatarImage }}
            containerStyle={{ margin: 10, borderColor: 'black', borderWidth: 1 }}
            onPress={getNewAvatarImage}
            onLongPress={saveAvatarImage}
        />
    );
}
