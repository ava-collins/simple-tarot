import { useRscReadingHistory } from '@simpletarot/hooks/client';
import { SingleCardReadingScreen } from '@simpletarot/ui';
import { useRouter, type Href } from 'expo-router';

import { useAuth } from '@/auth/use-auth';
import {
    createOneCardReadingOnServer,
    listReadingsOnServer
} from '@/readings/server-actions';

export default function SingleCardReadingRoute() {
    const { isLoading, isSignedIn, tokens } = useAuth();
    const router = useRouter();
    const { createTestReading, error, isGenerating } = useRscReadingHistory({
        accessToken: tokens?.accessToken,
        createOneCardReading: createOneCardReadingOnServer,
        listReadings: listReadingsOnServer
    });

    const drawCard = async () => {
        const reading = await createTestReading();
        const item = reading?.positions[0];

        if (!item) {
            return;
        }

        router.push({
            pathname: '/readings/single-card/result',
            params: {
                cardIndex: String(item.cardIndex),
                cardName: item.cardName,
                position: item.position,
                reversed: String(item.reversed),
                text: item.text,
                summary: reading.summary
            }
        } as Href);
    };

    return (
        <SingleCardReadingScreen
            error={error}
            isAuthLoading={isLoading}
            isGenerating={isGenerating}
            isSignedIn={isSignedIn}
            onSignInPress={() => router.push('/auth/sign-in' as Href)}
            onStart={() => {
                void drawCard();
            }}
        />
    );
}
