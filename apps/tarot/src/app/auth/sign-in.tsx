import { CognitoSignInScreen } from '@simpletarot/ui';
import { useRouter, type Href } from 'expo-router';
import { useEffect, useState } from 'react';

import { useAuth } from '@/auth/use-auth';

export default function SignInRoute() {
    const { authRequestReady, error, isSignedIn, signIn } = useAuth();
    const router = useRouter();
    const [isStarting, setIsStarting] = useState(false);
    const [startError, setStartError] = useState<string | null>(null);

    useEffect(() => {
        if (isSignedIn) {
            router.replace('/account' as Href);
        }
    }, [isSignedIn, router]);

    const handleContinuePress = async () => {
        setIsStarting(true);
        setStartError(null);

        try {
            await signIn();
        } catch (err) {
            setStartError(
                err instanceof Error ? err.message : 'Unable to start sign in.'
            );
        } finally {
            setIsStarting(false);
        }
    };

    return (
        <CognitoSignInScreen
            authRequestReady={authRequestReady}
            isLoading={isStarting}
            error={startError ?? error}
            onContinuePress={() => void handleContinuePress()}
        />
    );
}
