import { Pressable, StyleSheet, Text, View } from 'react-native';

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
                    <Pressable
                        accessibilityRole="button"
                        onPress={onCreateReadingPress}
                        style={({ pressed }) => [
                            styles.iconButton,
                            pressed && styles.pressed
                        ]}>
                        <Text style={styles.iconButtonText}>+</Text>
                    </Pressable>
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
        backgroundColor: '#F7F3EA',
        paddingHorizontal: 24,
        paddingTop: 72
    },
    centered: {
        flex: 1,
        alignItems: 'stretch',
        justifyContent: 'center',
        gap: 16,
        backgroundColor: '#F7F3EA',
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
        color: '#765B2B',
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 0,
        textTransform: 'uppercase'
    },
    title: {
        color: '#1B1A18',
        fontSize: 30,
        fontWeight: '700',
        letterSpacing: 0
    },
    body: {
        color: '#39342C',
        fontSize: 16,
        lineHeight: 22
    },
    mutedText: {
        color: '#6C665B',
        fontSize: 15
    },
    errorText: {
        color: '#8F2D2D',
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 16
    },
    primaryButton: {
        alignItems: 'center',
        backgroundColor: '#1B1A18',
        borderRadius: 6,
        minHeight: 52,
        justifyContent: 'center',
        paddingHorizontal: 20
    },
    primaryButtonText: {
        color: '#FFFDF8',
        fontSize: 16,
        fontWeight: '700'
    },
    iconButton: {
        alignItems: 'center',
        backgroundColor: '#1B1A18',
        borderRadius: 26,
        height: 52,
        justifyContent: 'center',
        width: 52
    },
    iconButtonText: {
        color: '#FFFDF8',
        fontSize: 32,
        fontWeight: '500',
        lineHeight: 36
    },
    pressed: {
        opacity: 0.7
    }
});
