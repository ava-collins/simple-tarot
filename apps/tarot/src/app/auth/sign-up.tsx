import { SignupScreen } from '@simpletarot/ui';
import { useRouter, type Href } from 'expo-router';
import { useState } from 'react';

import { useAuth } from '@/auth/use-auth';

export default function SignUpRoute() {
    const { confirmSignUp, error, signUp } = useAuth();
    const router = useRouter();
    const [isAwaitingVerification, setIsAwaitingVerification] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [createError, setCreateError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    const handleSubmit = async (emailAddress: string, password: string) => {
        setIsCreating(true);
        setCreateError(null);
        setMessage(null);

        try {
            const result = await signUp(emailAddress, password);

            if (result.userConfirmed) {
                setMessage('Account created. You can sign in now.');
                router.replace('/auth/sign-in' as Href);

                return;
            }

            setIsAwaitingVerification(true);
            setMessage('Account created. Enter the verification code from your email.');
        } catch (err) {
            setCreateError(
                err instanceof Error ? err.message : 'Unable to create account.'
            );
        } finally {
            setIsCreating(false);
        }
    };

    const handleConfirmSubmit = async (
        emailAddress: string,
        verificationCode: string
    ) => {
        setIsCreating(true);
        setCreateError(null);

        try {
            await confirmSignUp(emailAddress, verificationCode);
            router.replace('/auth/sign-in' as Href);
        } catch (err) {
            setCreateError(
                err instanceof Error ? err.message : 'Unable to verify account.'
            );
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <SignupScreen
            isAwaitingVerification={isAwaitingVerification}
            isLoading={isCreating}
            error={createError ?? error}
            message={message}
            onConfirmSubmit={(emailAddress, verificationCode) =>
                void handleConfirmSubmit(emailAddress, verificationCode)
            }
            onSubmit={(emailAddress, password) => void handleSubmit(emailAddress, password)}
        />
    );
}
