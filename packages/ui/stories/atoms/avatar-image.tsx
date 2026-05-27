import { AvatarConfig, useAvatarImage } from '@simpletarot/hooks';
import React, { useEffect } from 'react';

import Avatar from '@rneui/themed/dist/Avatar';

type AvatarImageProps = {
    size: number | 'small' | 'medium' | 'large' | 'xlarge' | undefined;
    saved?: string;
};

const AvatarImage: React.FC<AvatarImageProps> = ({ size = 'xlarge', saved }) => {
    const { avatarImage, getNewAvatarImage, getAvatarImage, saveAvatarImage } =
        useAvatarImage();
    const [hasSaved, setHasSaved] = React.useState<boolean>(
        saved !== undefined && saved !== ''
    );
    const [displayImage, setDisplayImage] = React.useState<string | undefined>();

    useEffect(() => {
        if (hasSaved) {
            setDisplayImage(saved);
        }
        if (!hasSaved && avatarImage !== undefined && avatarImage !== '') {
            setDisplayImage(avatarImage);
        }
        if (displayImage === AvatarConfig.DEFAULT_AVATAR_IMAGE) {
            getAvatarImage();
        }
    }, [saved, avatarImage, displayImage]);

    const onPressAvatar = () => {
        setHasSaved(false);
        getNewAvatarImage();
    };

    return (
        <Avatar
            size={size}
            rounded
            source={{ uri: displayImage }}
            containerStyle={{ margin: 10, borderColor: 'black', borderWidth: 1 }}
            onPress={onPressAvatar}
            onLongPress={saveAvatarImage}
        />
    );
};

export default AvatarImage;
