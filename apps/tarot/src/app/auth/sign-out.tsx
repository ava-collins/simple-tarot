import { SignOutScreen } from '@simpletarot/ui';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';

import { useAuth } from '@/auth/use-auth';

export default function SignOutRoute() {
    const { signOut } = useAuth();
    const router = useRouter();

    useEffect(() => {
        async function completeSignOut() {
            await signOut();
            router.replace('/');
        }

        void completeSignOut();
    }, [router, signOut]);

    return <SignOutScreen />;
}
