import React from 'react';

import MobileView from '../templates/mobile-view';
import ScreenState from '../molecules/screen-state';

export interface AuthCallbackScreenProps {
    isLoading?: boolean;
    error?: string | null;
}

const AuthCallbackScreen: React.FC<AuthCallbackScreenProps> = ({
    isLoading = true,
    error
}) => {
    const title = isLoading
        ? 'Finishing sign in'
        : error
          ? 'Sign in needs attention'
          : 'Welcome back';

    return (
        <MobileView>
            <ScreenState
                feedback={error}
                kind="prompt"
                message={
                    error
                        ? undefined
                        : 'You can return to the app once the session is ready.'
                }
                title={title}
            />
        </MobileView>
    );
};

export default AuthCallbackScreen;
