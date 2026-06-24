import { Pressable, StyleSheet, Text, View } from 'react-native';
import React from 'react';

import MobileView from '../templates/mobile-view';
import theme from '../utils/theme';

const t = theme();

export interface CognitoSignInScreenProps {
    authRequestReady?: boolean;
    isLoading?: boolean;
    error?: string | null;
    onContinuePress: () => void;
}

const CognitoSignInScreen: React.FC<CognitoSignInScreenProps> = ({
    authRequestReady = false,
    isLoading = false,
    error,
    onContinuePress
}) => {
    const disabled = !authRequestReady || isLoading;

    return (
        <MobileView>
            <View style={styles.wrapper}>
                <Text style={styles.title}>Sign in</Text>
                <Text style={styles.body}>Continue with the secure sign-in page.</Text>
                {error ? <Text style={styles.errorText}>{error}</Text> : null}
                <Pressable
                    accessibilityRole="button"
                    disabled={disabled}
                    onPress={onContinuePress}
                    style={({ pressed }) => [
                        styles.button,
                        disabled && styles.disabledButton,
                        pressed && !disabled && styles.pressed
                    ]}>
                    <Text style={styles.buttonText}>
                        {isLoading ? 'Opening...' : 'Continue'}
                    </Text>
                </Pressable>
            </View>
        </MobileView>
    );
};

export default CognitoSignInScreen;

const styles = StyleSheet.create({
    wrapper: {
        width: '100%',
        paddingHorizontal: 40,
        gap: 16,
        alignItems: 'stretch'
    },
    title: {
        fontSize: 28,
        fontWeight: '600',
        color: t.colors.primary
    },
    body: {
        fontSize: 14,
        lineHeight: 20,
        color: t.colors.grey5
    },
    errorText: {
        fontSize: 14,
        lineHeight: 20,
        color: t.colors.error
    },
    button: {
        alignItems: 'center',
        backgroundColor: t.colors.grey5,
        borderRadius: 4,
        height: 60,
        justifyContent: 'center',
        paddingHorizontal: 40
    },
    disabledButton: {
        opacity: 0.5
    },
    pressed: {
        opacity: 0.75
    },
    buttonText: {
        color: t.colors.white,
        fontSize: 16,
        fontWeight: 'bold'
    }
});
