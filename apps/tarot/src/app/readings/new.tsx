import { useRscReadingHistory } from '@simpletarot/hooks/client';
import { NewReadingScreen } from '@simpletarot/ui';
import { useRouter, type Href } from 'expo-router';

import { useAuth } from '@/auth/use-auth';
import {
    createOneCardReadingOnServer,
    listReadingsOnServer
} from '@/readings/server-actions';

export default function NewReadingRoute() {
    const { isLoading: isAuthLoading, isSignedIn, tokens } = useAuth();
    const router = useRouter();
    const {
        createTestReading,
        error,
        isGenerating,
        latestReading
    } = useRscReadingHistory({
        accessToken: tokens?.accessToken,
        createOneCardReading: createOneCardReadingOnServer,
        listReadings: listReadingsOnServer
    });

    const generateReading = async (question: string) => {
        await createTestReading(question);
    };

    return (
        <NewReadingScreen
            error={error}
            isAuthLoading={isAuthLoading}
            isGenerating={isGenerating}
            isSignedIn={isSignedIn}
            latestReading={latestReading}
            onBackPress={() => router.back()}
            onGeneratePress={generateReading}
            onHistoryPress={() => router.push('/readings' as Href)}
            onSignInPress={() => router.push('/auth/sign-in' as Href)}
        />
    );
}
