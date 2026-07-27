import { StyleSheet, Text, View } from 'react-native';
import Button from '../atoms/button';
import FeedbackText from '../atoms/feedback-text';
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
                    <View style={styles.status}>
                        <FeedbackText tone="muted">
                            Checking session...
                        </FeedbackText>
                    </View>
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
                    <View style={styles.action}>
                        <Button label="Sign in" onPress={onSignInPress} />
                    </View>
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

                {error ? (
                    <View style={styles.errorFeedback}>
                        <FeedbackText>{error}</FeedbackText>
                    </View>
                ) : null}

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
    action: {
        alignSelf: 'stretch'
    },
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
        color: theme.colors.primary,
        fontSize: 30,
        fontWeight: '700',
        letterSpacing: 0
    },
    body: {
        color: theme.colors.primary,
        fontSize: 16,
        lineHeight: 22
    },
    errorFeedback: {
        marginBottom: 16
    },
    status: {
        alignItems: 'center'
    }
});
