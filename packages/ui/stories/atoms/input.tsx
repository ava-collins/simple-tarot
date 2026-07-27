import {
    StyleSheet,
    Text,
    TextInput,
    View
} from 'react-native';
import type { KeyboardType, TextInputProps } from 'react-native';

import React from 'react';
import theme from '../utils/theme';

export interface InputProps {
    disabled?: boolean;
    hasError?: boolean;
    keyboardType?: KeyboardType;
    label?: string;
    multiline?: boolean;
    onChangeText?: (text: string) => void;
    placeholder?: string;
    textContentType?: TextInputProps['textContentType'];
    value?: string;
}

const Input: React.FC<InputProps> = ({
    disabled = false,
    hasError = false,
    keyboardType = 'default',
    label,
    multiline = false,
    onChangeText,
    placeholder,
    textContentType,
    value
}) => (
    <View style={styles.container}>
        {label ? <Text style={styles.label}>{label}</Text> : null}
        <TextInput
            accessibilityLabel={label}
            accessibilityState={{ disabled }}
            autoCapitalize="none"
            editable={!disabled}
            keyboardType={keyboardType}
            multiline={multiline}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={theme.colors.grey4}
            secureTextEntry={textContentType === 'password'}
            selectionColor={theme.colors.primary}
            style={[
                styles.input,
                multiline ? styles.multiline : undefined,
                hasError ? styles.error : undefined,
                disabled ? styles.disabled : undefined
            ]}
            textContentType={textContentType}
            value={value}
        />
    </View>
);

export default Input;

const styles = StyleSheet.create({
    container: {
        alignSelf: 'stretch'
    },
    disabled: {
        backgroundColor: theme.colors.grey0,
        color: theme.colors.grey4,
        opacity: 0.7
    },
    error: {
        borderColor: theme.colors.error
    },
    input: {
        alignSelf: 'stretch',
        backgroundColor: theme.colors.white,
        borderColor: theme.colors.greyOutline,
        borderRadius: 4,
        borderWidth: 1,
        color: theme.colors.primary,
        fontSize: 16,
        minHeight: 48,
        paddingHorizontal: 12,
        paddingVertical: 10
    },
    label: {
        color: theme.colors.primary,
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8
    },
    multiline: {
        minHeight: 112,
        textAlignVertical: 'top'
    }
});
