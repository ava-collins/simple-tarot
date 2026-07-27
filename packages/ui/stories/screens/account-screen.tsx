import { ScrollView, StyleSheet, Text, View } from 'react-native';
import React from 'react';
import theme from '../utils/theme';

import AvatarRollback from '../atoms/avatar-rollback';
import Button from '../atoms/button';
import FeedbackText from '../atoms/feedback-text';
import MobileView from '../templates/mobile-view';
import ScreenState from '../molecules/screen-state';

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
                <ScreenState kind="status" message="Checking session..." />
            </MobileView>
        );
    }

    if (!isSignedIn) {
        return (
            <MobileView>
                <ScreenState
                    action={{ label: 'Sign in', onPress: onSignInPress }}
                    feedback={error}
                    kind="prompt"
                    message="Sign in to see your profile."
                    title="Account"
                />
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
                    <FeedbackText>{error}</FeedbackText>
                    <View style={styles.buttonGroup}>
                        {onNewReadingPress ? (
                            <Button
                                label="Start a reading"
                                onPress={onNewReadingPress}
                            />
                        ) : null}
                        {onReadingHistoryPress ? (
                            <Button
                                label="Reading history"
                                onPress={onReadingHistoryPress}
                            />
                        ) : null}
                        <Button
                            label="Sign out"
                            onPress={onSignOutPress}
                            variant="muted"
                        />
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
        color: theme.colors.primary,
        textAlign: 'center'
    },
    claimsSection: {
        gap: 12
    },
    claimRow: {
        gap: 4
    },
    label: {
        fontSize: 12,
        fontWeight: '700',
        color: theme.colors.grey5,
        textTransform: 'uppercase',
        letterSpacing: 0.5
    },
    body: {
        fontSize: 14,
        lineHeight: 20,
        color: theme.colors.primary
    },
    buttonGroup: {
        gap: 16
    }
});
