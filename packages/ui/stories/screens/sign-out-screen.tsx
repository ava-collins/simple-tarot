import React from 'react';

import MobileView from '../templates/mobile-view';
import ScreenState from '../molecules/screen-state';


const SignOutScreen: React.FC = () => (
    <MobileView>
        <ScreenState
            kind="prompt"
            message="Clearing this device session..."
            title="Signing out"
        />
    </MobileView>
);

export default SignOutScreen;
