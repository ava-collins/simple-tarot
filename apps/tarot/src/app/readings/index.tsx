import { useRouter, type Href } from 'expo-router';
import {
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View
} from 'react-native';

import { useAuth } from '@/auth/use-auth';
import { listReadingsOnServer } from '@/readings/server-actions';
import { useRscReadingHistory } from '@/readings/use-rsc-reading-history';

const formatCreatedAt = (value: string) =>
    new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short'
    }).format(new Date(value));

export default function ReadingHistoryRoute() {
    const { isLoading: isAuthLoading, isSignedIn, tokens } = useAuth();
    const router = useRouter();
    const { error, isLoading, readings, refresh } = useRscReadingHistory({
        accessToken: tokens?.accessToken,
        createOneCardReading: async () => {
            throw new Error('Reading generation is not available on this screen.');
        },
        listReadings: listReadingsOnServer
    });

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
                <Text style={styles.title}>Reading history</Text>
                <Text style={styles.body}>Sign in to see saved readings.</Text>
                <Pressable
                    accessibilityRole="button"
                    onPress={() => router.push('/auth/sign-in' as Href)}
                    style={({ pressed }) => [
                        styles.primaryButton,
                        pressed && styles.pressed
                    ]}>
                    <Text style={styles.primaryButtonText}>Sign in</Text>
                </Pressable>
            </View>
        );
    }

    return (
        <View style={styles.screen}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.eyebrow}>Saved readings</Text>
                    <Text style={styles.title}>Reading history</Text>
                </View>
                <Pressable
                    accessibilityRole="button"
                    onPress={() => router.push('/readings/new' as Href)}
                    style={({ pressed }) => [
                        styles.iconButton,
                        pressed && styles.pressed
                    ]}>
                    <Text style={styles.iconButtonText}>+</Text>
                </Pressable>
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <ScrollView
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={isLoading} onRefresh={refresh} />
                }>
                {readings.length === 0 && !isLoading ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.body}>No saved readings yet.</Text>
                        <Pressable
                            accessibilityRole="button"
                            onPress={() => router.push('/readings/new' as Href)}
                            style={({ pressed }) => [
                                styles.primaryButton,
                                pressed && styles.pressed
                            ]}>
                            <Text style={styles.primaryButtonText}>Generate reading</Text>
                        </Pressable>
                    </View>
                ) : null}

                {readings.map(reading => (
                    <View key={reading.createdAt} style={styles.readingCard}>
                        <Text style={styles.questionText}>
                            {reading.question ?? 'Reading without a question'}
                        </Text>
                        <Text style={styles.metaText}>
                            {formatCreatedAt(reading.createdAt)} · {reading.spread}
                        </Text>
                        <Text style={styles.summaryText}>{reading.summary}</Text>
                    </View>
                ))}
            </ScrollView>
        </View>
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
    listContent: {
        gap: 12,
        paddingBottom: 48
    },
    readingCard: {
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
    },
    emptyState: {
        gap: 16,
        paddingVertical: 56
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
