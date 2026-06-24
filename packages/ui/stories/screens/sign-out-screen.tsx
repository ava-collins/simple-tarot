import { StyleSheet, Text, View } from 'react-native';
import React from 'react';

import MobileView from '../templates/mobile-view';
import theme from '../utils/theme';

const t = theme();

const SignOutScreen: React.FC = () => (
    <MobileView>
        <View style={styles.wrapper}>
            <Text style={styles.title}>Signing out</Text>
            <Text style={styles.body}>Clearing this device session...</Text>
        </View>
    </MobileView>
);

export default SignOutScreen;

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
    }
});
