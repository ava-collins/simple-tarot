import { AccountScreen } from '@simpletarot/ui';
import { useRouter, type Href } from 'expo-router';

import { RscAvatarImage } from '@/avatars/rsc-avatar-image';
import { useAuth } from '@/auth/use-auth';

function claimText(value: unknown): string | undefined {
    return typeof value === 'string' && value ? value : undefined;
}

export default function AccountRoute() {
    const { error, idTokenClaims, isLoading, isSignedIn } = useAuth();
    const router = useRouter();

    return (
        <AccountScreen
            apiBaseUrl={process.env.EXPO_PUBLIC_TAROT_API_URL ?? ''}
            avatarSlot={<RscAvatarImage size={200} />}
            isLoading={isLoading}
            isSignedIn={isSignedIn}
            email={claimText(idTokenClaims?.email)}
            displayName={claimText(idTokenClaims?.name)}
            error={error}
            onReadingHistoryPress={() => router.push('/readings' as Href)}
            onSignInPress={() => router.push('/auth/sign-in' as Href)}
            onSignOutPress={() => router.push('/auth/sign-out' as Href)}
        />
    );
}
