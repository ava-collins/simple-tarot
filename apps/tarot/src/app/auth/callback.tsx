import { AuthCallbackScreen } from '@simpletarot/ui';
import { useRouter, type Href } from 'expo-router';
import { useEffect } from 'react';

import { useAuth } from '@/auth/use-auth';

export default function AuthCallbackRoute() {
    const { error, isLoading, isSignedIn } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (isSignedIn) {
            router.replace('/account' as Href);
        }
    }, [isSignedIn, router]);

    return <AuthCallbackScreen isLoading={isLoading} error={error} />;
}
