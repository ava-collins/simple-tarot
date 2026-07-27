import { StyleSheet, Text, View } from 'react-native';

import Button from '../atoms/button';
import FeedbackText from '../atoms/feedback-text';
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
                    <View style={styles.status}>
                        <FeedbackText tone="muted">
                            Checking session...
                        </FeedbackText>
                    </View>
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
                    <View style={styles.action}>
                        <Button label="Sign in" onPress={onSignInPress} />
                    </View>
                </View>
            </MobileView>
        );
    }

    if (isGenerating) {
        return (
            <MobileView>
                <View style={styles.centered}>
                    <View style={styles.status}>
                        <FeedbackText tone="muted">
                            Drawing your card...
                        </FeedbackText>
                    </View>
                </View>
            </MobileView>
        );
    }

    if (error) {
        return (
            <MobileView>
                <View style={styles.centered}>
                    <View style={styles.status}>
                        <FeedbackText>{error}</FeedbackText>
                    </View>
                    <View style={styles.action}>
                        <Button label="Try again" onPress={onStart} />
                    </View>
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
    action: {
        alignSelf: 'stretch'
    },
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
    status: {
        alignItems: 'center'
    }
});
