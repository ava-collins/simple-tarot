import { KeyboardType, StyleSheet, TextInputProps } from 'react-native';

import Input from '@rneui/themed/dist/Input';
import React from 'react';
import colors from '../utils/colors';

export interface FormInputProps {
    label?: string;
    placeholder?: string;
    value?: string;
    textContentType: TextInputProps['textContentType'];
    hasError?: boolean;
    keyboardType?: KeyboardType;
    onChangeText?: (text: string) => void;
    disabled?: boolean;
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        alignItems: 'stretch'
    },
    label: {
        color: colors.smoky_black?.base ?? '#000'
    },
    input: {
        height: 40,
        marginTop: 10,
        alignSelf: 'stretch'
    }
});

const FormInput: React.FC<FormInputProps> = ({
    hasError,
    label,
    onChangeText,
    value,
    placeholder,
    textContentType,
    keyboardType = 'default',
    disabled = false
}) => {
    const inputStyle = hasError
        ? [styles.input, { borderBottomColor: 'red', borderBottomWidth: 1 }]
        : styles.input;

    return (
        <Input
            label={label}
            labelStyle={styles.label}
            style={inputStyle}
            onChangeText={onChangeText}
            value={value}
            placeholder={placeholder}
            textContentType={textContentType}
            autoCapitalize="none"
            keyboardType={keyboardType}
            secureTextEntry={textContentType === 'password'}
            disabled={disabled}
        />
    );
};

export default FormInput;
