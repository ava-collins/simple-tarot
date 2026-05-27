import React, { useEffect, useState } from 'react';

import FormButton from '../atoms/form-button';
import FormInputRow from '../molecules/form-input-row';
import { KeyboardType } from 'react-native';
import type { FormError } from '@simpletarot/hooks';

export interface LoginFormProps {
    email: string;
    password: string;
    onEmailChange: (text: string) => void;
    onPasswordChange: (text: string) => void;
    onSubmit: () => void;
    errors: FormError[];
}

const LoginForm: React.FC<LoginFormProps> = ({
    email,
    password,
    errors,
    onEmailChange,
    onPasswordChange,
    onSubmit
}) => {
    const [emailError, setEmailError] = useState<FormError | false>(false);
    const [passwordError, setPasswordError] = useState<FormError | false>(false);

    useEffect(() => {
        if (errors && errors.length === 0) {
            setEmailError(false);
            setPasswordError(false);

            return;
        }
        if (errors && errors.length > 0) {
            const emailErr = errors.find(err => err && err.type === 'emailAddress');
            const passwordErr = errors.find(err => err && err.type === 'password');

            setEmailError(emailErr ? emailErr : false);
            setPasswordError(passwordErr ? passwordErr : false);
        }
    }, [errors]);

    const emailProps = {
        label: 'Email*',
        placeholder: 'Enter your email',
        value: email,
        textContentType: 'emailAddress' as const,
        hasError: !!emailError,
        keyboardType: 'email-address' as KeyboardType,
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

    return (
        <>
            <FormInputRow inputProps={emailProps} textProps={{ error: emailError }} />
            <FormInputRow
                inputProps={passwordProps}
                textProps={{ error: passwordError }}
            />
            <FormButton
                buttonLabel="Login"
                onPress={onSubmit}
                btnEnabled={errors && errors.length === 0}
            />
        </>
    );
};

export default LoginForm;
