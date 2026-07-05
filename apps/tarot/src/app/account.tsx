import { AccountScreen } from '@simpletarot/ui';
import { useRouter, type Href } from 'expo-router';

import { useAuth } from '@/auth/use-auth';

function claimText(value: unknown): string | undefined {
    return typeof value === 'string' && value ? value : undefined;
}

export default function AccountRoute() {
    const { error, idTokenClaims, isLoading, isSignedIn } = useAuth();
    const router = useRouter();

    return (
        <AccountScreen
            isLoading={isLoading}
            isSignedIn={isSignedIn}
            email={claimText(idTokenClaims?.email)}
            displayName={claimText(idTokenClaims?.name)}
            subject={claimText(idTokenClaims?.sub)}
            error={error}
            onReadingHistoryPress={() => router.push('/readings' as Href)}
            onSignInPress={() => router.push('/auth/sign-in' as Href)}
            onSignOutPress={() => router.push('/auth/sign-out' as Href)}
        />
    );
}
