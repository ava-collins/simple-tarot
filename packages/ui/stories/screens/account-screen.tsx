import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import React from 'react';

import AvatarRollback from '../atoms/avatar-rollback';
import MobileView from '../templates/mobile-view';
import theme from '../utils/theme';

const t = theme();

export interface AccountScreenProps {
    apiBaseUrl?: string;
    avatarSlot?: React.ReactNode;
    isLoading?: boolean;
    isSignedIn?: boolean;
    email?: string;
    displayName?: string;
    error?: string | null;
    onNewReadingPress?: () => void;
    onReadingHistoryPress?: () => void;
    onSignInPress: () => void;
    onSignOutPress: () => void;
}

const AccountScreen: React.FC<AccountScreenProps> = ({
    apiBaseUrl = '',
    avatarSlot,
    isLoading = false,
    isSignedIn = false,
    email,
    displayName,
    error,
    onNewReadingPress,
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
                    <View style={styles.avatarSection}>
                        {avatarSlot ?? (
                            <AvatarRollback apiBaseUrl={apiBaseUrl} size={200} />
                        )}
                        {email ? <Text style={styles.emailText}>{email}</Text> : null}
                    </View>
                    {displayName ? (
                        <View style={styles.claimsSection}>
                            {displayName ? (
                                <View style={styles.claimRow}>
                                    <Text style={styles.label}>Name</Text>
                                    <Text style={styles.body}>{displayName}</Text>
                                </View>
                            ) : null}
                        </View>
                    ) : null}
                    {error ? <Text style={styles.errorText}>{error}</Text> : null}
                    <View style={styles.buttonGroup}>
                        {onNewReadingPress ? (
                            <Pressable
                                accessibilityRole="button"
                                onPress={onNewReadingPress}
                                style={({ pressed }) => [
                                    styles.button,
                                    pressed && styles.pressed
                                ]}>
                                <Text style={styles.buttonText}>Start a reading</Text>
                            </Pressable>
                        ) : null}
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
                </View>
            </ScrollView>
        </MobileView>
    );
};

export default AccountScreen;

const styles = StyleSheet.create({
    scrollContent: {
        flexGrow: 1,
        paddingTop: 80,
        paddingBottom: 40
    },
    wrapper: {
        paddingHorizontal: 40,
        gap: 24
    },
    avatarSection: {
        alignItems: 'center',
        gap: 16
    },
    emailText: {
        fontSize: 18,
        fontWeight: '600',
        color: t.colors.primary,
        textAlign: 'center'
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
    buttonGroup: {
        gap: 16
    },
    button: {
        alignItems: 'center',
        backgroundColor: t.colors.grey5,
        borderRadius: 4,
        height: 60,
        justifyContent: 'center'
    },
    buttonText: {
        color: t.colors.white,
        fontSize: 16,
        fontWeight: 'bold'
    },
    signOutButton: {
        alignItems: 'center',
        backgroundColor: t.colors.grey3,
        borderRadius: 4,
        height: 60,
        justifyContent: 'center'
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
