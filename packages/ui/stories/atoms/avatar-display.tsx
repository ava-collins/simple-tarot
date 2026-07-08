import Avatar from '@rneui/themed/dist/Avatar';

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
            containerStyle={{ margin: 10, borderColor: 'black', borderWidth: 1 }}
            onPress={onPress}
            onLongPress={onLongPress}
        />
    );
}
