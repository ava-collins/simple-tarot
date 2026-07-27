import MobileView from '../templates/mobile-view';
import NewReading from '../organisms/new-reading';
import React from 'react';
import ScreenState from '../molecules/screen-state';

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
                <ScreenState kind="status" message="Checking session..." />
            </MobileView>
        );
    }

    if (!isSignedIn) {
        return (
            <MobileView>
                <ScreenState
                    action={{ label: 'Sign in', onPress: onSignInPress }}
                    kind="prompt"
                    message="Sign in to draw a card."
                    title="New reading"
                />
            </MobileView>
        );
    }

    if (isGenerating) {
        return (
            <MobileView>
                <ScreenState kind="status" message="Drawing your card..." />
            </MobileView>
        );
    }

    if (error) {
        return (
            <MobileView>
                <ScreenState
                    action={{ label: 'Try again', onPress: onStart }}
                    kind="status"
                    message={error}
                    tone="error"
                />
            </MobileView>
        );
    }

    return (
        <MobileView>
            <NewReading onStart={onStart} />
        </MobileView>
    );
}
