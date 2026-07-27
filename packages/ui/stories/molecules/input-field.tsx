import { StyleSheet, View } from 'react-native';

import FeedbackText from '../atoms/feedback-text';
import Input from '../atoms/input';
import React from 'react';
import type { FeedbackTone } from '../atoms/feedback-text';
import type { InputProps } from '../atoms/input';

export interface InputFieldProps {
    feedback?: React.ReactNode;
    feedbackTone?: FeedbackTone;
    inputProps: InputProps;
}

const InputField: React.FC<InputFieldProps> = ({
    feedback,
    feedbackTone = 'error',
    inputProps
}) => (
    <View style={styles.field}>
        <Input {...inputProps} />
        <FeedbackText tone={feedbackTone}>{feedback}</FeedbackText>
    </View>
);

export default InputField;

const styles = StyleSheet.create({
    field: {
        alignItems: 'stretch',
        marginBottom: 10,
        marginTop: 10
    }
});
