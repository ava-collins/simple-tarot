import { useRscReadingHistory } from '@simpletarot/hooks/client';
import { ReadingHistoryScreen } from '@simpletarot/ui';
import { useRouter, type Href } from 'expo-router';

import { useAuth } from '@/auth/use-auth';
import { listReadingsOnServer } from '@/readings/server-actions';

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

    return (
        <ReadingHistoryScreen
            error={error}
            isAuthLoading={isAuthLoading}
            isLoading={isLoading}
            isSignedIn={isSignedIn}
            onCreateReadingPress={() => router.push('/readings/new' as Href)}
            onRefresh={refresh}
            onSignInPress={() => router.push('/auth/sign-in' as Href)}
            readings={readings.map(reading => ({
                createdAtLabel: formatCreatedAt(reading.createdAt),
                key: reading.createdAt,
                question: reading.question ?? 'Reading without a question',
                spread: reading.spread,
                summary: reading.summary
            }))}
        />
    );
}
