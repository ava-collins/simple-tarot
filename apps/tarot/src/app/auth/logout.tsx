import { LogoutCallbackScreen } from '@simpletarot/ui';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';

export default function LogoutCallbackRoute() {
    const router = useRouter();

    useEffect(() => {
        const timeout = setTimeout(() => {
            router.replace('/account');
        }, 250);

        return () => clearTimeout(timeout);
    }, [router]);

    return <LogoutCallbackScreen />;
}
