import { useRouter, type Href } from 'expo-router';
import { useState } from 'react';
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View
} from 'react-native';

import { useAuth } from '@/auth/use-auth';
import { useReadingHistory } from '@/readings/use-reading-history';

export default function NewReadingRoute() {
    const { isLoading: isAuthLoading, isSignedIn, tokens } = useAuth();
    const router = useRouter();
    const [question, setQuestion] = useState('');
    const {
        createTestReading,
        error,
        isGenerating,
        latestReading
    } = useReadingHistory({
        accessToken: tokens?.accessToken
    });

    const generateReading = async () => {
        const reading = await createTestReading(question);

        if (reading) {
            setQuestion('');
        }
    };

    if (isAuthLoading) {
        return (
            <View style={styles.centered}>
                <Text style={styles.mutedText}>Checking session...</Text>
            </View>
        );
    }

    if (!isSignedIn) {
        return (
            <View style={styles.centered}>
                <Text style={styles.title}>New reading</Text>
                <Text style={styles.body}>Sign in to generate and save readings.</Text>
                <Pressable
                    accessibilityRole="button"
                    onPress={() => router.push('/auth/sign-in' as Href)}
                    style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
                    <Text style={styles.primaryButtonText}>Sign in</Text>
                </Pressable>
            </View>
        );
    }

    return (
        <ScrollView contentContainerStyle={styles.screen}>
            <View style={styles.header}>
                <Pressable
                    accessibilityRole="button"
                    onPress={() => router.back()}
                    style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}>
                    <Text style={styles.secondaryButtonText}>Back</Text>
                </Pressable>
                <Pressable
                    accessibilityRole="button"
                    onPress={() => router.push('/readings' as Href)}
                    style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}>
                    <Text style={styles.secondaryButtonText}>History</Text>
                </Pressable>
            </View>

            <Text style={styles.eyebrow}>Local test flow</Text>
            <Text style={styles.title}>New reading</Text>
            <Text style={styles.body}>
                Generate a one-card reading through the API while Bedrock access is pending.
            </Text>

            <View style={styles.formSection}>
                <Text style={styles.label}>Question</Text>
                <TextInput
                    multiline
                    onChangeText={setQuestion}
                    placeholder="What should I notice today?"
                    placeholderTextColor="#8A8172"
                    style={styles.input}
                    value={question}
                />
                {error ? <Text style={styles.errorText}>{error}</Text> : null}
                <Pressable
                    accessibilityRole="button"
                    disabled={isGenerating}
                    onPress={generateReading}
                    style={({ pressed }) => [
                        styles.primaryButton,
                        isGenerating && styles.disabledButton,
                        pressed && styles.pressed
                    ]}>
                    <Text style={styles.primaryButtonText}>
                        {isGenerating ? 'Generating...' : 'Generate reading'}
                    </Text>
                </Pressable>
            </View>

            {latestReading ? (
                <View style={styles.resultCard}>
                    <Text style={styles.resultTitle}>Latest reading</Text>
                    <Text style={styles.summaryText}>{latestReading.summary}</Text>
                    {latestReading.positions.map(position => (
                        <View key={`${position.position}-${position.cardIndex}`} style={styles.positionRow}>
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
        backgroundColor: '#F7F3EA',
        gap: 16,
        paddingHorizontal: 24,
        paddingBottom: 48,
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
        justifyContent: 'space-between',
        gap: 12
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
    label: {
        color: '#1B1A18',
        fontSize: 14,
        fontWeight: '700'
    },
    formSection: {
        gap: 12,
        marginTop: 12
    },
    input: {
        backgroundColor: '#FFFDF8',
        borderColor: '#D9CBAE',
        borderRadius: 8,
        borderWidth: 1,
        color: '#1B1A18',
        fontSize: 16,
        minHeight: 112,
        padding: 14,
        textAlignVertical: 'top'
    },
    errorText: {
        color: '#8F2D2D',
        fontSize: 14,
        lineHeight: 20
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
    secondaryButton: {
        alignItems: 'center',
        borderColor: '#B9A77F',
        borderRadius: 6,
        borderWidth: 1,
        minHeight: 44,
        justifyContent: 'center',
        paddingHorizontal: 16
    },
    secondaryButtonText: {
        color: '#1B1A18',
        fontSize: 14,
        fontWeight: '700'
    },
    disabledButton: {
        opacity: 0.55
    },
    resultCard: {
        backgroundColor: '#FFFDF8',
        borderColor: '#D9CBAE',
        borderRadius: 8,
        borderWidth: 1,
        gap: 12,
        marginTop: 12,
        padding: 16
    },
    resultTitle: {
        color: '#1B1A18',
        fontSize: 18,
        fontWeight: '700'
    },
    summaryText: {
        color: '#39342C',
        fontSize: 14,
        lineHeight: 20
    },
    positionRow: {
        gap: 4
    },
    positionTitle: {
        color: '#765B2B',
        fontSize: 14,
        fontWeight: '700'
    },
    pressed: {
        opacity: 0.7
    }
});
