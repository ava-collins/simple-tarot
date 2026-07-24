import { Pressable, StyleSheet, Text, View } from 'react-native';
import theme from '../utils/theme';
import ReadingHistoryList, {
    type ReadingHistoryListProps
} from '../organisms/reading-history-list';
import MobileView from '../templates/mobile-view';

export type ReadingHistoryScreenProps = {
    error?: string | null;
    isAuthLoading: boolean;
    isLoading: boolean;
    isSignedIn: boolean;
    onCreateReadingPress: () => void;
    onRefresh: () => void;
    onSignInPress: () => void;
    readings: ReadingHistoryListProps['readings'];
};

export default function ReadingHistoryScreen({
    error,
    isAuthLoading,
    isLoading,
    isSignedIn,
    onCreateReadingPress,
    onRefresh,
    onSignInPress,
    readings
}: ReadingHistoryScreenProps) {
    if (isAuthLoading) {
        return (
            <MobileView>
                <View style={styles.centered}>
                    <Text style={styles.mutedText}>Checking session...</Text>
                </View>
            </MobileView>
        );
    }

    if (!isSignedIn) {
        return (
            <MobileView>
                <View style={styles.centered}>
                    <Text style={styles.title}>Reading history</Text>
                    <Text style={styles.body}>Sign in to see saved readings.</Text>
                    <Pressable
                        accessibilityRole="button"
                        onPress={onSignInPress}
                        style={({ pressed }) => [
                            styles.primaryButton,
                            pressed && styles.pressed
                        ]}>
                        <Text style={styles.primaryButtonText}>Sign in</Text>
                    </Pressable>
                </View>
            </MobileView>
        );
    }

    return (
        <MobileView>
            <View style={styles.screen}>
                <View style={styles.header}>
                    <View>
                        <Text style={styles.eyebrow}>Saved readings</Text>
                        <Text style={styles.title}>Reading history</Text>
                    </View>
                 
                </View>

                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                <ReadingHistoryList
                    emptyMessage="No saved readings yet."
                    isLoading={isLoading}
                    onCreateReadingPress={onCreateReadingPress}
                    onRefresh={onRefresh}
                    readings={readings}
                />
            </View>
        </MobileView>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 72
    },
    centered: {
        flex: 1,
        alignItems: 'stretch',
        justifyContent: 'center',
        gap: 16,
        backgroundColor: theme.colors.white,
        paddingHorizontal: 32
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        marginBottom: 24
    },
    eyebrow: {
        color: theme.colors.grey5,
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 0,
        textTransform: 'uppercase'
    },
    title: {
        color: theme.colors.secondary,
        fontSize: 30,
        fontWeight: '700',
        letterSpacing: 0
    },
    body: {
        color: theme.colors.primary,
        fontSize: 16,
        lineHeight: 22
    },
    mutedText: {
        color: theme.colors.grey2,
        fontSize: 15
    },
    errorText: {
        color: theme.colors.error,
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 16
    },
    primaryButton: {
        alignItems: 'center',
        backgroundColor: theme.colors.black,
        borderRadius: 6,
        minHeight: 52,
        justifyContent: 'center',
        paddingHorizontal: 20
    },
    primaryButtonText: {
        color: theme.colors.white,
        fontSize: 16,
        fontWeight: '700'
    },
    iconButton: {
        alignItems: 'center',
        backgroundColor: theme.colors.black,
        borderRadius: 26,
        height: 52,
        justifyContent: 'center',
        width: 52
    },
    iconButtonText: {
        color: theme.colors.white,
        fontSize: 32,
        fontWeight: '500',
        lineHeight: 36
    },
    pressed: {
        opacity: 0.7
    }
});
