import { LoginScreen } from '@simpletarot/ui';
import { useRouter, type Href } from 'expo-router';
import { useEffect, useState } from 'react';

import { useAuth } from '@/auth/use-auth';

export default function SignInRoute() {
    const { error, isSignedIn, signIn } = useAuth();
    const router = useRouter();
    const [isStarting, setIsStarting] = useState(false);
    const [startError, setStartError] = useState<string | null>(null);

    useEffect(() => {
        if (isSignedIn) {
            router.replace('/account' as Href);
        }
    }, [isSignedIn, router]);

    const handleSubmit = async (emailAddress: string, password: string) => {
        setIsStarting(true);
        setStartError(null);

        try {
            await signIn(emailAddress, password);
        } catch (err) {
            setStartError(
                err instanceof Error ? err.message : 'Unable to sign in.'
            );
        } finally {
            setIsStarting(false);
        }
    };

    return (
        <LoginScreen
            isLoading={isStarting}
            error={startError ?? error}
            onSignUpPress={() => router.push('/auth/sign-up' as Href)}
            onSubmit={(emailAddress, password) => void handleSubmit(emailAddress, password)}
        />
    );
}
