import React, { useState } from 'react';

import SpeedDial from '@rneui/themed/dist/SpeedDial';
import { View } from 'react-native';

export interface QuickNavProps {
    onNewReadingPress?: () => void;
    onProfilePress?: () => void;
    onReadingHistoryPress?: () => void;
}

const QuickNav: React.FC<QuickNavProps> = ({
    onNewReadingPress,
    onProfilePress,
    onReadingHistoryPress
}) => {
    const [open, setOpen] = useState(false);

    const openProfile = () => {
        setOpen(false);
        onProfilePress?.();
    };

    const goToHistory = () => {
        setOpen(false);
        onReadingHistoryPress?.();
    };

    const startNewReading = () => {
        setOpen(false);
        onNewReadingPress?.();
    };

    return (
        <View
            testID="quick-nav-container"
            pointerEvents="box-none"
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
