import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Button from '../atoms/button';
import FeedbackText from '../atoms/feedback-text';
import Input from '../atoms/input';
import theme from '../utils/theme';

export type NewReadingFormProps = {
    error?: string | null;
    isGenerating: boolean;
    latestReading?: {
        positions: Array<{
            cardIndex: number;
            cardName: string;
            position: string;
            text: string;
        }>;
        summary: string;
    } | null;
    onBackPress: () => void;
    onGeneratePress: (question: string) => Promise<void> | void;
    onHistoryPress: () => void;
};

export default function NewReadingForm({
    error,
    isGenerating,
    latestReading,
    onBackPress,
    onGeneratePress,
    onHistoryPress
}: NewReadingFormProps) {
    const [question, setQuestion] = useState('');

    const generateReading = async () => {
        await onGeneratePress(question);
        setQuestion('');
    };

    return (
        <ScrollView contentContainerStyle={styles.screen}>
            <View style={styles.header}>
                <Button
                    label="Back"
                    onPress={onBackPress}
                    size="compact"
                    variant="secondary"
                />
                <Button
                    label="History"
                    onPress={onHistoryPress}
                    size="compact"
                    variant="secondary"
                />
            </View>

            <Text style={styles.eyebrow}>One-card reading</Text>
            <Text style={styles.title}>New reading</Text>
            <Text style={styles.body}>
                Ask a question and save a one-card reading to your history.
            </Text>

            <View style={styles.formSection}>
                <Input
                    label="Question"
                    multiline
                    onChangeText={setQuestion}
                    placeholder="What should I notice today?"
                    value={question}
                />
                <FeedbackText>{error}</FeedbackText>
                <Button
                    disabled={isGenerating}
                    label={isGenerating ? 'Generating...' : 'Generate reading'}
                    onPress={generateReading}
                />
            </View>

            {latestReading ? (
                <View style={styles.resultCard}>
                    <Text style={styles.resultTitle}>Latest reading</Text>
                    <Text style={styles.summaryText}>{latestReading.summary}</Text>
                    {latestReading.positions.map(position => (
                        <View
                            key={`${position.position}-${position.cardIndex}`}
                            style={styles.positionRow}>
                            <Text style={styles.positionTitle}>
                                {position.position}: {position.cardName}
                            </Text>
                            <Text style={styles.summaryText}>{position.text}</Text>
                        </View>
                    ))}
                </View>
            ) : null}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    screen: {
        flexGrow: 1,
        backgroundColor: theme.colors.grey0,
        gap: 16,
        paddingHorizontal: 24,
        paddingBottom: 48,
        paddingTop: 72
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12
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
        color: theme.colors.grey5,
        fontSize: 16,
        lineHeight: 22
    },
    formSection: {
        gap: 12,
        marginTop: 12
    },
    resultCard: {
        backgroundColor: theme.colors.white,
        borderColor: theme.colors.greyOutline,
        borderRadius: 8,
        borderWidth: 1,
        gap: 12,
        marginTop: 12,
        padding: 16
    },
    resultTitle: {
        color: theme.colors.primary,
        fontSize: 18,
        fontWeight: '700'
    },
    summaryText: {
        color: theme.colors.grey5,
        fontSize: 14,
        lineHeight: 20
    },
    positionRow: {
        gap: 4
    },
    positionTitle: {
        color: theme.colors.grey5,
        fontSize: 14,
        fontWeight: '700'
    }
});
