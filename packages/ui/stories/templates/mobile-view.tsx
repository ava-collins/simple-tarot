import { Dimensions } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import React from 'react';
import theme from '../utils/theme';

interface MobileViewProps {
    children: React.ReactNode;
}

const t = theme();

const { width, height } = Dimensions.get('window');

const MobileView: React.FC<MobileViewProps> = ({ children }) => (
    <SafeAreaProvider>
        <SafeAreaView
            style={{
                width,
                height,
                display: 'flex',
                alignItems: 'stretch',
                justifyContent: 'center',
                backgroundColor: t.colors.grey0
            }}>
            {children}
        </SafeAreaView>
    </SafeAreaProvider>
);

export default MobileView;
