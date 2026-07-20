import { SingleCardResultScreen } from '@simpletarot/ui';
import {
    Redirect,
    useLocalSearchParams,
    useRouter,
    type Href
} from 'expo-router';

export default function SingleCardResultRoute() {
    const params = useLocalSearchParams<{
        cardIndex?: string;
        cardName?: string;
        position?: string;
        reversed?: string;
        text?: string;
        summary?: string;
    }>();
    const router = useRouter();

    const cardIndex = Number(params.cardIndex);
    const isValid =
        Number.isInteger(cardIndex) &&
        cardIndex >= 0 &&
        cardIndex <= 77 &&
        !!params.cardName &&
        !!params.text;

    if (!isValid) {
        return <Redirect href="/readings/single-card" />;
    }

    return (
        <SingleCardResultScreen
            cardIndex={cardIndex}
            cardName={params.cardName as string}
            position={params.position ?? 'guidance'}
            reversed={params.reversed === 'true'}
            summary={params.summary ?? ''}
            text={params.text as string}
            onDonePress={() => router.push('/account' as Href)}
            onHistoryPress={() => router.push('/readings' as Href)}
        />
    );
}
