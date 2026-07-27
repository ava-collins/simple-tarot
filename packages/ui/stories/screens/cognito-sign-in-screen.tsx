import React from 'react';

import MobileView from '../templates/mobile-view';
import ScreenState from '../molecules/screen-state';

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
            <ScreenState
                action={{
                    disabled,
                    label: isLoading ? 'Opening...' : 'Continue',
                    onPress: onContinuePress
                }}
                feedback={error}
                kind="prompt"
                message="Continue with the secure sign-in page."
                title="Sign in"
            />
        </MobileView>
    );
};

export default CognitoSignInScreen;
