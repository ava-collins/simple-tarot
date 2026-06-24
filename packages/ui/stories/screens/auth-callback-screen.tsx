import { StyleSheet, Text, View } from 'react-native';
import React from 'react';

import MobileView from '../templates/mobile-view';
import theme from '../utils/theme';

const t = theme();

export interface AuthCallbackScreenProps {
    isLoading?: boolean;
    error?: string | null;
}

const AuthCallbackScreen: React.FC<AuthCallbackScreenProps> = ({
    isLoading = true,
    error
}) => (
    <MobileView>
        <View style={styles.wrapper}>
            <Text style={styles.title}>
                {isLoading
                    ? 'Finishing sign in'
                    : error
                      ? 'Sign in needs attention'
                      : 'Welcome back'}
            </Text>
            <Text style={error ? styles.errorText : styles.body}>
                {error ?? 'You can return to the app once the session is ready.'}
            </Text>
        </View>
    </MobileView>
);

export default AuthCallbackScreen;

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
    }
});
