import { KeyboardAvoidingView, View } from 'react-native';
import React, { useState } from 'react';

import ForgotPasswordForm from '../organisms/forgot-password-form';
import MobileView from '../templates/mobile-view';
import theme from '../utils/theme';
import { useForgotPasswordForm } from '@simpletarot/hooks';

const t = theme();

export interface ForgotPasswordScreenProps {
    onSubmit: (emailAddress: string) => void;
}
const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({ onSubmit }) => {
    const [email, setEmail] = useState('');

    const { errors, handleChange, handleSubmit } = useForgotPasswordForm(onSubmit);

    const handleEmailChange = (text: string) => {
        handleChange();
        setEmail(text);
    };

    const handleSubmitForm = () => {
        handleSubmit(email);
    };

    return (
        <MobileView>
            <KeyboardAvoidingView behavior="padding" keyboardVerticalOffset={100}>
                <View style={t.formWrapperStyle}>
                    <ForgotPasswordForm
                        email={email}
                        errors={errors}
                        onEmailChange={handleEmailChange}
                        onSubmit={handleSubmitForm}
                    />
                </View>
            </KeyboardAvoidingView>
        </MobileView>
    );
};
export default ForgotPasswordScreen;
