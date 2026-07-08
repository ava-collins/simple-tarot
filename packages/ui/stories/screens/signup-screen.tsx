import { KeyboardAvoidingView, View } from 'react-native';
import React from 'react';

import MobileView from '../templates/mobile-view';
import SignupForm from '../organisms/signup-form';
import theme from '../utils/theme';
import { useSignupForm } from '@simpletarot/hooks/client';

export interface SignupScreenProps {
    error?: string | null;
    isAwaitingVerification?: boolean;
    isLoading?: boolean;
    message?: string | null;
    onConfirmSubmit?: (emailAddress: string, verificationCode: string) => void;
    onSubmit: (emailAddress: string, password: string) => void;
}

const t = theme();

const SignupScreen: React.FC<SignupScreenProps> = ({
    error,
    isAwaitingVerification = false,
    isLoading = false,
    message,
    onConfirmSubmit,
    onSubmit
}) => {
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [confirmPassword, setConfirmPassword] = React.useState('');
    const [verificationCode, setVerificationCode] = React.useState('');

    const { errors, handleChange, handleSubmit } = useSignupForm(onSubmit);

    const handleEmailChange = (text: string) => {
        handleChange();
        setEmail(text);
    };
    const handlePasswordChange = (text: string) => {
        handleChange();
        setPassword(text);
    };
    const handleConfirmPasswordChange = (text: string) => {
        handleChange();
        setConfirmPassword(text);
    };
    const handleVerificationCodeChange = (text: string) => {
        setVerificationCode(text);
    };
    const handleConfirmSubmit = () => {
        onConfirmSubmit?.(email, verificationCode);
    };

    return (
        <MobileView>
            <KeyboardAvoidingView behavior="padding" keyboardVerticalOffset={100}>
                <View style={t.formWrapperStyle}>
                    <SignupForm
                        email={email}
                        password={password}
                        confirmPassword={confirmPassword}
                        error={error}
                        isAwaitingVerification={isAwaitingVerification}
                        isLoading={isLoading}
                        message={message}
                        verificationCode={verificationCode}
                        errors={errors}
                        onEmailChange={handleEmailChange}
                        onPasswordChange={handlePasswordChange}
                        onConfirmPasswordChange={handleConfirmPasswordChange}
                        onVerificationCodeChange={handleVerificationCodeChange}
                        onConfirmSubmit={handleConfirmSubmit}
                        onSubmit={handleSubmit.bind(
                            null,
                            email,
                            password,
                            confirmPassword
                        )}
                    />
                </View>
            </KeyboardAvoidingView>
        </MobileView>
    );
};

export default SignupScreen;
