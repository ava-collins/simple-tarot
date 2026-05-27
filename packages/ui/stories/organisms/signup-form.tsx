import React, { useEffect, useState } from 'react';

import FormButton from '../atoms/form-button';
import FormInputRow from '../molecules/form-input-row';
import { KeyboardType } from 'react-native';
import type { FormError } from '@simpletarot/hooks';

export interface SignupFormProps {
    email: string;
    password: string;
    confirmPassword: string;
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
    errors,
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

    return (
        <>
            <FormInputRow inputProps={emailProps} textProps={{ error: emailError }} />
            <FormInputRow
                inputProps={passwordProps}
                textProps={{ error: passwordError }}
            />
            <FormInputRow
                inputProps={confirmPasswordProps}
                textProps={{ error: confirmPasswordError }}
            />
            <FormButton
                buttonLabel="Sign Up"
                btnEnabled={!emailError && !passwordError && !confirmPasswordError}
                onPress={onSubmit}
            />
        </>
    );
};

export default SignupForm;
