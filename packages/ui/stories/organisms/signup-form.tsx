import React, { useEffect, useState } from 'react';

import Button from '../atoms/button';
import FeedbackText from '../atoms/feedback-text';
import InputField from '../molecules/input-field';
import { KeyboardType, StyleSheet, View } from 'react-native';
import type { FormError } from '@simpletarot/hooks/server';

export interface SignupFormProps {
    email: string;
    password: string;
    confirmPassword: string;
    error?: string | null;
    isLoading?: boolean;
    message?: string | null;
    verificationCode?: string;
    isAwaitingVerification?: boolean;
    onVerificationCodeChange?: (text: string) => void;
    onConfirmSubmit?: () => void;
    onEmailChange: (text: string) => void;
    onPasswordChange: (text: string) => void;
    onConfirmPasswordChange: (text: string) => void;
    onSubmit: () => void;
    errors: FormError[];
}

const SignupForm: React.FC<SignupFormProps> = ({
    email,
    password,
    confirmPassword,
    error,
    isLoading = false,
    message,
    verificationCode = '',
    isAwaitingVerification = false,
    errors,
    onVerificationCodeChange,
    onConfirmSubmit,
    onEmailChange,
    onPasswordChange,
    onConfirmPasswordChange,
    onSubmit
}) => {
    const [emailError, setEmailError] = useState<FormError | false>(false);
    const [passwordError, setPasswordError] = useState<FormError | false>(false);
    const [confirmPasswordError, setConfirmPasswordError] = useState<FormError | false>(
        false
    );

    useEffect(() => {
        if (errors && errors.length === 0) {
            setEmailError(false);
            setPasswordError(false);
            setConfirmPasswordError(false);

            return;
        }
        if (errors && errors.length > 0) {
            const emailErr = errors.find(err => err && err.type === 'emailAddress');
            const passwordErr = errors.find(err => err && err.type === 'password');
            const confirmPasswordErr = errors.find(
                err => err && err.type === 'newPassword'
            );

            setEmailError(emailErr ? emailErr : false);
            setPasswordError(passwordErr ? passwordErr : false);
            setConfirmPasswordError(confirmPasswordErr ? confirmPasswordErr : false);
        }
    }, [errors]);

    const emailProps = {
        label: 'Email*',
        placeholder: 'Enter your email',
        value: email,
        textContentType: 'emailAddress' as const,
        hasError: !!emailError,
        onChangeText: onEmailChange
    };

    const passwordProps = {
        label: 'Password*',
        placeholder: 'Enter your password',
        value: password,
        textContentType: 'password' as const,
        hasError: !!passwordError,
        keyboardType: 'default' as KeyboardType,
        onChangeText: onPasswordChange
    };

    const confirmPasswordProps = {
        label: 'Confirm Password*',
        placeholder: 'Confirm your password',
        value: confirmPassword,
        textContentType: 'password' as const,
        hasError: !!confirmPasswordError,
        keyboardType: 'default' as KeyboardType,
        onChangeText: onConfirmPasswordChange
    };

    const verificationCodeProps = {
        label: 'Verification Code*',
        placeholder: 'Enter the code from your email',
        value: verificationCode,
        textContentType: 'oneTimeCode' as const,
        hasError: false,
        keyboardType: 'number-pad' as KeyboardType,
        onChangeText: onVerificationCodeChange
    };

    return (
        <>
            {isAwaitingVerification ? (
                <InputField inputProps={verificationCodeProps} />
            ) : (
                <>
                    <InputField
                        feedback={emailError ? emailError.message : undefined}
                        inputProps={emailProps}
                    />
                    <InputField
                        feedback={passwordError ? passwordError.message : undefined}
                        inputProps={passwordProps}
                    />
                    <InputField
                        feedback={
                            confirmPasswordError
                                ? confirmPasswordError.message
                                : undefined
                        }
                        inputProps={confirmPasswordProps}
                    />
                </>
            )}
            <FeedbackText tone="muted">{message}</FeedbackText>
            <FeedbackText>{error}</FeedbackText>
            <View style={styles.action}>
                <Button
                    label={
                        isAwaitingVerification
                            ? (isLoading ? 'Verifying...' : 'Verify Account')
                            : (isLoading ? 'Creating account...' : 'Sign Up')
                    }
                    disabled={
                        isLoading ||
                        (isAwaitingVerification
                            ? verificationCode.trim().length === 0
                            : !!emailError ||
                              !!passwordError ||
                              !!confirmPasswordError)
                    }
                    onPress={
                        isAwaitingVerification
                            ? (onConfirmSubmit ?? onSubmit)
                            : onSubmit
                    }
                />
            </View>
        </>
    );
};

export default SignupForm;

const styles = StyleSheet.create({
    action: {
        marginBottom: 20
    }
});
