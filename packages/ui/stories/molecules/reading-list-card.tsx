import { StyleSheet, Text, View } from 'react-native';

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
        backgroundColor: '#FFFDF8',
        borderColor: '#D9CBAE',
        borderRadius: 8,
        borderWidth: 1,
        gap: 8,
        padding: 16
    },
    questionText: {
        color: '#1B1A18',
        fontSize: 17,
        fontWeight: '700',
        lineHeight: 22
    },
    metaText: {
        color: '#765B2B',
        fontSize: 12,
        fontWeight: '600',
        lineHeight: 16
    },
    summaryText: {
        color: '#39342C',
        fontSize: 14,
        lineHeight: 20
    }
});
