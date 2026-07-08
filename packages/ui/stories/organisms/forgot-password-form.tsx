import React, { useEffect, useState } from 'react';

import FormButton from '../atoms/form-button';
import FormInputRow from '../molecules/form-input-row';
import { KeyboardType } from 'react-native';
import type { FormError } from '@simpletarot/hooks/server';
import theme from '../utils/theme';

const t = theme();

interface ForgotPasswordFormProps {
    email: string;
    errors: FormError[];
    onEmailChange: (text: string) => void;
    onSubmit: () => void;
}

const ForgotPasswordForm = ({ email, errors, onEmailChange, onSubmit }) => {
    const [emailError, setEmailError] = useState<FormError | false>(false);

    useEffect(() => {
        if (errors && errors.length === 0) {
            setEmailError(false);

            return;
        }
        if (errors && errors.length > 0) {
            const emailErr = errors.find(err => err && err.type === 'emailAddress');
            setEmailError(emailErr ? emailErr : false);
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

    return (
        <>
            <FormInputRow inputProps={emailProps} textProps={{ error: emailError }} />
            <FormButton
                buttonLabel="Reset Password"
                onPress={onSubmit}
                btnEnabled={errors && errors.length === 0}
            />
        </>
    );
};

export default ForgotPasswordForm;
