import React, { useState } from 'react';

import SpeedDial from '@rneui/themed/dist/SpeedDial';
import { View } from 'react-native';

const QuickNav = () => {
    const [open, setOpen] = useState(false);

    const openProfile = () => {
        setOpen(false);
    };

    const goToHistory = () => {
        setOpen(false);
    };

    const startNewReading = () => {
        setOpen(false);
    };

    const goToHome = () => {
        setOpen(false);
    };

    return (
        <View
            testID="quick-nav-container"
            style={{
                position: 'absolute',
                top: 0,
                right: 0,
                bottom: 0,
                left: 0
            }}>
            <SpeedDial
                color={open ? 'white' : 'black'}
                isOpen={open}
                icon={{ name: 'navigation', color: 'white' }}
                openIcon={{ name: 'close', color: 'black' }}
                onOpen={() => setOpen(true)}
                onClose={() => setOpen(false)}
                testID="quick-nav-toggle">
                <SpeedDial.Action
                    color="white"
                    icon={{
                        type: 'material-community',
                        name: 'account-outline',
                        color: '#000'
                    }}
                    title="Profile"
                    onPress={openProfile}
                    testID="quick-nav-profile-action"
                />

                <SpeedDial.Action
                    color="white"
                    icon={{ name: 'history', color: '#000' }}
                    title="History"
                    onPress={goToHistory}
                    testID="quick-nav-history-action"
                />
                <SpeedDial.Action
                    color="white"
                    icon={{
                        type: 'material-community',
                        name: 'cards-outline',
                        color: '#000'
                    }}
                    title="New Reading"
                    onPress={startNewReading}
                    testID="quick-nav-new-reading-action"
                />
            </SpeedDial>
        </View>
    );
};

export default QuickNav;
