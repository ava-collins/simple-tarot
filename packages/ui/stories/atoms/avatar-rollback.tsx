import { AvatarConfig, useAvatarImage } from '@simpletarot/hooks/client';
import React, { useEffect } from 'react';

import AvatarDisplay from './avatar-display';

type AvatarRollbackProps = {
    apiBaseUrl: string;
    size: number | 'small' | 'medium' | 'large' | 'xlarge' | undefined;
    saved?: string;
};

const AvatarRollback: React.FC<AvatarRollbackProps> = ({
    apiBaseUrl,
    size = 'xlarge',
    saved
}) => {
    const { avatarImage, getNewAvatarImage, getAvatarImage, saveAvatarImage } =
        useAvatarImage(apiBaseUrl);
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
        <AvatarDisplay
            size={size}
            imageUri={displayImage}
            onPress={onPressAvatar}
            onLongPress={saveAvatarImage}
        />
    );
};

export default AvatarRollback;
