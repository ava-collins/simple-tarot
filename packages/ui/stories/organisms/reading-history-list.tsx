import {
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View
} from 'react-native';

import ReadingListCard from '../molecules/reading-list-card';
import theme from '../utils/theme';

export type ReadingHistoryListProps = {
    emptyMessage: string;
    isLoading: boolean;
    onCreateReadingPress: () => void;
    onRefresh: () => void;
    readings: Array<{
        createdAtLabel: string;
        key: string;
        question: string;
        spread: string;
        summary: string;
    }>;
};

export default function ReadingHistoryList({
    emptyMessage,
    isLoading,
    onCreateReadingPress,
    onRefresh,
    readings
}: ReadingHistoryListProps) {
    return (
        <ScrollView
            contentContainerStyle={styles.listContent}
            refreshControl={
                <RefreshControl refreshing={isLoading} onRefresh={onRefresh} />
            }>
            {readings.length === 0 && !isLoading ? (
                <View style={styles.emptyState}>
                    <Text style={styles.body}>{emptyMessage}</Text>
                    <Pressable
                        accessibilityRole="button"
                        onPress={onCreateReadingPress}
                        style={({ pressed }) => [
                            styles.primaryButton,
                            pressed && styles.pressed
                        ]}>
                        <Text style={styles.primaryButtonText}>Generate reading</Text>
                    </Pressable>
                </View>
            ) : null}

            {readings.map(reading => (
                <ReadingListCard
                    key={reading.key}
                    createdAtLabel={reading.createdAtLabel}
                    question={reading.question}
                    spread={reading.spread}
                    summary={reading.summary}
                />
            ))}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    listContent: {
        gap: 12,
        paddingBottom: 48
    },
    emptyState: {
        gap: 16,
        paddingVertical: 56
    },
    body: {
        color: theme.colors.primary,
        fontSize: 16,
        lineHeight: 22
    },
    primaryButton: {
        alignItems: 'center',
        backgroundColor: theme.colors.primary,
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
    pressed: {
        opacity: 0.7
    }
});
