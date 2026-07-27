import { Pressable, StyleSheet, Text, View } from 'react-native';

import MobileView from '../templates/mobile-view';
import NewReading from '../organisms/new-reading';
import React from 'react';
import theme from '../utils/theme';

export type SingleCardReadingScreenProps = {
    error?: string | null;
    isAuthLoading: boolean;
    isGenerating: boolean;
    isSignedIn: boolean;
    onSignInPress: () => void;
    onStart: () => void;
};

export default function SingleCardReadingScreen({
    error,
    isAuthLoading,
    isGenerating,
    isSignedIn,
    onSignInPress,
    onStart
}: SingleCardReadingScreenProps) {
    if (isAuthLoading) {
        return (
            <MobileView>
                <View style={styles.centered}>
                    <Text style={styles.mutedText}>Checking session...</Text>
                </View>
            </MobileView>
        );
    }

    if (!isSignedIn) {
        return (
            <MobileView>
                <View style={styles.centered}>
                    <Text style={styles.title}>New reading</Text>
                    <Text style={styles.body}>Sign in to draw a card.</Text>
                    <Pressable
                        accessibilityRole="button"
                        onPress={onSignInPress}
                        style={({ pressed }) => [
                            styles.primaryButton,
                            pressed && styles.pressed
                        ]}>
                        <Text style={styles.primaryButtonText}>Sign in</Text>
                    </Pressable>
                </View>
            </MobileView>
        );
    }

    if (isGenerating) {
        return (
            <MobileView>
                <View style={styles.centered}>
                    <Text style={styles.mutedText}>Drawing your card...</Text>
                </View>
            </MobileView>
        );
    }

    if (error) {
        return (
            <MobileView>
                <View style={styles.centered}>
                    <Text style={styles.errorText}>{error}</Text>
                    <Pressable
                        accessibilityRole="button"
                        onPress={onStart}
                        style={({ pressed }) => [
                            styles.primaryButton,
                            pressed && styles.pressed
                        ]}>
                        <Text style={styles.primaryButtonText}>Try again</Text>
                    </Pressable>
                </View>
            </MobileView>
        );
    }

    return (
        <MobileView>
            <NewReading onStart={onStart} />
        </MobileView>
    );
}

const styles = StyleSheet.create({
    centered: {
        flex: 1,
        alignItems: 'stretch',
        justifyContent: 'center',
        gap: 16,
        backgroundColor: theme.colors.grey0,
        paddingHorizontal: 32
    },
    title: {
        color: theme.colors.primary,
        fontSize: 30,
        fontWeight: '700',
        letterSpacing: 0
    },
    body: {
        color: theme.colors.grey5,
        fontSize: 16,
        lineHeight: 22
    },
    mutedText: {
        color: theme.colors.grey4,
        fontSize: 15,
        textAlign: 'center'
    },
    errorText: {
        color: theme.colors.error,
        fontSize: 16,
        lineHeight: 22,
        textAlign: 'center'
    },
    primaryButton: {
        alignItems: 'center',
        backgroundColor: theme.colors.black,
        borderRadius: 6,
        minHeight: 52,
        justifyContent: 'center',
        paddingHorizontal: 20
    },
    primaryButtonText: {
        color: theme.colors.white,
        fontSize: 16,
        fontWeight: '700'
    },
    pressed: {
        opacity: 0.7
    }
});
