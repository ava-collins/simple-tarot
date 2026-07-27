import { StyleSheet, Text, View } from 'react-native';
import theme from '../utils/theme';

export type ReadingListCardProps = {
    createdAtLabel: string;
    question: string;
    spread: string;
    summary: string;
};

export default function ReadingListCard({
    createdAtLabel,
    question,
    spread,
    summary
}: ReadingListCardProps) {
    return (
        <View style={styles.card}>
            <Text style={styles.questionText}>{question}</Text>
            <Text style={styles.metaText}>
                {createdAtLabel} · {spread}
            </Text>
            <Text style={styles.summaryText}>{summary}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: theme.colors.white,
        borderColor: theme.colors.greyOutline,
        borderRadius: 8,
        borderWidth: 1,
        gap: 8,
        padding: 16
    },
    questionText: {
        color: theme.colors.primary,
        fontSize: 17,
        fontWeight: '700',
        lineHeight: 22
    },
    metaText: {
        color: theme.colors.grey4,
        fontSize: 12,
        fontWeight: '600',
        lineHeight: 16
    },
    summaryText: {
        color: theme.colors.grey5,
        fontSize: 14,
        lineHeight: 20
    }
});
