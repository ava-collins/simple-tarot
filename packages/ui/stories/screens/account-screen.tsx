import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import React from 'react';

import MobileView from '../templates/mobile-view';
import theme from '../utils/theme';

const t = theme();

export interface AccountScreenProps {
    isLoading?: boolean;
    isSignedIn?: boolean;
    email?: string;
    displayName?: string;
    subject?: string;
    error?: string | null;
    onReadingHistoryPress?: () => void;
    onSignInPress: () => void;
    onSignOutPress: () => void;
}

const AccountScreen: React.FC<AccountScreenProps> = ({
    isLoading = false,
    isSignedIn = false,
    email,
    displayName,
    subject,
    error,
    onReadingHistoryPress,
    onSignInPress,
    onSignOutPress
}) => {
    if (isLoading) {
        return (
            <MobileView>
                <Text style={styles.mutedText}>Checking session...</Text>
            </MobileView>
        );
    }

    if (!isSignedIn) {
        return (
            <MobileView>
                <View style={styles.wrapper}>
                    <Text style={styles.title}>Account</Text>
                    <Text style={styles.body}>Sign in to see your profile.</Text>
                    {error ? <Text style={styles.errorText}>{error}</Text> : null}
                    <Pressable
                        accessibilityRole="button"
                        onPress={onSignInPress}
                        style={({ pressed }) => [
                            styles.button,
                            pressed && styles.pressed
                        ]}>
                        <Text style={styles.buttonText}>Sign in</Text>
                    </Pressable>
                </View>
            </MobileView>
        );
    }

    return (
        <MobileView>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.wrapper}>
                    <Text style={styles.title}>Account</Text>
                    <View style={styles.claimsSection}>
                        <View style={styles.claimRow}>
                            <Text style={styles.label}>Email</Text>
                            <Text style={styles.body}>{email ?? 'Not provided'}</Text>
                        </View>
                        {displayName ? (
                            <View style={styles.claimRow}>
                                <Text style={styles.label}>Name</Text>
                                <Text style={styles.body}>{displayName}</Text>
                            </View>
                        ) : null}
                        {subject ? (
                            <View style={styles.claimRow}>
                                <Text style={styles.label}>Subject</Text>
                                <Text style={styles.body}>{subject}</Text>
                            </View>
                        ) : null}
                    </View>
                    {error ? <Text style={styles.errorText}>{error}</Text> : null}
                    {onReadingHistoryPress ? (
                        <Pressable
                            accessibilityRole="button"
                            onPress={onReadingHistoryPress}
                            style={({ pressed }) => [
                                styles.button,
                                pressed && styles.pressed
                            ]}>
                            <Text style={styles.buttonText}>Reading history</Text>
                        </Pressable>
                    ) : null}
                    <Pressable
                        accessibilityRole="button"
                        onPress={onSignOutPress}
                        style={({ pressed }) => [
                            styles.signOutButton,
                            pressed && styles.pressed
                        ]}>
                        <Text style={styles.signOutButtonText}>Sign out</Text>
                    </Pressable>
                </View>
            </ScrollView>
        </MobileView>
    );
};

export default AccountScreen;

const styles = StyleSheet.create({
    wrapper: {
        width: '100%',
        paddingHorizontal: 40,
        gap: 16,
        alignItems: 'stretch'
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center'
    },
    claimsSection: {
        gap: 12
    },
    claimRow: {
        gap: 4
    },
    title: {
        fontSize: 28,
        fontWeight: '600',
        color: t.colors.primary
    },
    label: {
        fontSize: 12,
        fontWeight: '700',
        color: t.colors.grey5,
        textTransform: 'uppercase',
        letterSpacing: 0.5
    },
    body: {
        fontSize: 14,
        lineHeight: 20,
        color: t.colors.primary
    },
    mutedText: {
        fontSize: 14,
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
    buttonText: {
        color: t.colors.white,
        fontSize: 16,
        fontWeight: 'bold'
    },
    signOutButton: {
        alignItems: 'center',
        backgroundColor: t.colors.error,
        borderRadius: 4,
        height: 60,
        justifyContent: 'center',
        paddingHorizontal: 40
    },
    signOutButtonText: {
        color: t.colors.white,
        fontSize: 16,
        fontWeight: 'bold'
    },
    pressed: {
        opacity: 0.7
    }
});
