import { Pressable, StyleSheet, Text } from 'react-native';

import React from 'react';
import theme from '../utils/theme';

export type ButtonVariant = 'primary' | 'secondary' | 'muted';
export type ButtonSize = 'standard' | 'compact';

export interface ButtonProps {
    accessibilityLabel?: string;
    disabled?: boolean;
    label: string;
    onPress: () => void;
    size?: ButtonSize;
    variant?: ButtonVariant;
}

const Button: React.FC<ButtonProps> = ({
    accessibilityLabel,
    disabled = false,
    label,
    onPress,
    size = 'standard',
    variant = 'primary'
}) => (
    <Pressable
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={onPress}
        style={({ pressed }) => [
            styles.base,
            size === 'compact' ? styles.compact : styles.standard,
            styles[variant],
            pressed && !disabled ? styles.pressed : undefined,
            disabled ? styles.disabled : undefined
        ]}>
        <Text
            style={[
                styles.label,
                variant === 'secondary'
                    ? styles.secondaryLabel
                    : styles.lightLabel
            ]}>
            {label}
        </Text>
    </Pressable>
);

export default Button;

const styles = StyleSheet.create({
    base: {
        alignItems: 'center',
        borderRadius: 4,
        justifyContent: 'center',
        paddingHorizontal: 40
    },
    compact: {
        alignSelf: 'flex-start',
        height: 44
    },
    disabled: {
        opacity: 0.45
    },
    label: {
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center'
    },
    lightLabel: {
        color: theme.colors.white
    },
    muted: {
        backgroundColor: theme.colors.grey3
    },
    pressed: {
        opacity: 0.7
    },
    primary: {
        backgroundColor: theme.colors.black
    },
    secondary: {
        backgroundColor: 'transparent',
        borderColor: theme.colors.greyOutline,
        borderWidth: 1
    },
    secondaryLabel: {
        color: theme.colors.primary
    },
    standard: {
        alignSelf: 'stretch',
        height: 60
    }
});
