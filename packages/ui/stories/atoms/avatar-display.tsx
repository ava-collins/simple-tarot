import Avatar from '@rneui/themed/dist/Avatar';
import { StyleSheet } from 'react-native';

import theme from '../utils/theme';

export type AvatarDisplayProps = {
    imageUri: string | undefined;
    onPress?: () => void;
    onLongPress?: () => void;
    size?: number | 'small' | 'medium' | 'large' | 'xlarge';
};

export default function AvatarDisplay({
    imageUri,
    onLongPress,
    onPress,
    size = 'xlarge'
}: AvatarDisplayProps) {
    return (
        <Avatar
            size={size}
            rounded
            source={imageUri ? { uri: imageUri } : undefined}
            containerStyle={styles.container}
            onPress={onPress}
            onLongPress={onLongPress}
        />
    );
}

const styles = StyleSheet.create({
    container: {
        borderColor: theme.colors.black,
        borderWidth: 1,
        margin: 10
    }
});
