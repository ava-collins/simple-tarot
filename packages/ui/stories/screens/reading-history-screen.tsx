import { StyleSheet, Text, View } from 'react-native';
import FeedbackText from '../atoms/feedback-text';
import theme from '../utils/theme';
import ReadingHistoryList, {
    type ReadingHistoryListProps
} from '../organisms/reading-history-list';
import MobileView from '../templates/mobile-view';
import ScreenState from '../molecules/screen-state';

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
                <ScreenState kind="status" message="Checking session..." />
            </MobileView>
        );
    }

    if (!isSignedIn) {
        return (
            <MobileView>
                <ScreenState
                    action={{ label: 'Sign in', onPress: onSignInPress }}
                    kind="prompt"
                    message="Sign in to see saved readings."
                    title="Reading history"
                />
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
    screen: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 72
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
    errorFeedback: {
        marginBottom: 16
    }
});
