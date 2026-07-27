import React, { useEffect, useState } from 'react';

import Button from '../atoms/button';
import InputField from '../molecules/input-field';
import { KeyboardType, StyleSheet, View } from 'react-native';
import type { FormError } from '@simpletarot/hooks/server';

export interface ForgotPasswordFormProps {
    email: string;
    errors: FormError[];
    onEmailChange: (text: string) => void;
    onSubmit: () => void;
}

const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({
    email,
    errors,
    onEmailChange,
    onSubmit
}) => {
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
            <InputField
                feedback={emailError ? emailError.message : undefined}
                inputProps={emailProps}
            />
            <View style={styles.action}>
                <Button
                    label="Reset Password"
                    onPress={onSubmit}
                    disabled={errors.length > 0}
                />
            </View>
        </>
    );
};

export default ForgotPasswordForm;

const styles = StyleSheet.create({
    action: {
        marginBottom: 20
    }
});
