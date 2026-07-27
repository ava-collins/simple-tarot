import React, { useState } from 'react';

import SpeedDial from '@rneui/themed/dist/SpeedDial';
import { StyleSheet, View } from 'react-native';
import theme from '../utils/theme';

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
            style={styles.container}>
            <SpeedDial
                accessibilityLabel={
                    open ? 'Close quick navigation' : 'Open quick navigation'
                }
                color={open ? theme.colors.white : theme.colors.black}
                isOpen={open}
                icon={{
                    name: 'navigation',
                    color: theme.colors.white,
                    pressableProps: { accessibilityRole: 'image' }
                }}
                openIcon={{
                    name: 'close',
                    color: theme.colors.black,
                    pressableProps: { accessibilityRole: 'image' }
                }}
                onOpen={() => setOpen(true)}
                onClose={() => setOpen(false)}
                testID="quick-nav-toggle">
                <SpeedDial.Action
                    accessibilityLabel="Open profile"
                    color={theme.colors.white}
                    icon={{
                        type: 'material-community',
                        name: 'account-outline',
                        color: theme.colors.black,
                        pressableProps: { accessibilityRole: 'image' }
                    }}
                    title="Profile"
                    onPress={openProfile}
                    testID="quick-nav-profile-action"
                />

                <SpeedDial.Action
                    accessibilityLabel="Open reading history"
                    color={theme.colors.white}
                    icon={{
                        name: 'history',
                        color: theme.colors.black,
                        pressableProps: { accessibilityRole: 'image' }
                    }}
                    title="History"
                    onPress={goToHistory}
                    testID="quick-nav-history-action"
                />
                <SpeedDial.Action
                    accessibilityLabel="Start a new reading"
                    color={theme.colors.white}
                    icon={{
                        type: 'material-community',
                        name: 'cards-outline',
                        color: theme.colors.black,
                        pressableProps: { accessibilityRole: 'image' }
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

const styles = StyleSheet.create({
    container: {
        bottom: 0,
        position: 'absolute',
        right: 0
    }
});
