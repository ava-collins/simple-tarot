import React from 'react';

import MobileView from '../templates/mobile-view';
import ScreenState from '../molecules/screen-state';

const LogoutCallbackScreen: React.FC = () => (
    <MobileView>
        <ScreenState
            kind="prompt"
            message="Returning to your account screen..."
            title="Signed out"
        />
    </MobileView>
);

export default LogoutCallbackScreen;
