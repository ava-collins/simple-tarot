import {
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View
} from 'react-native';

import Button from '../atoms/button';
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
                    <Button
                        label="Generate reading"
                        onPress={onCreateReadingPress}
                    />
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
    }
});
