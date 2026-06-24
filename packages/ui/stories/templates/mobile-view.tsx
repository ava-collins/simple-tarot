import { Dimensions, SafeAreaView } from 'react-native';

import MobileProviders from './mobile-providers';
import React from 'react';
import theme from '../utils/theme';

interface MobileSignupProps {
    children: React.ReactNode;
}

const t = theme();

const { width, height } = Dimensions.get('window');

const env = {
    GRAPH_URI: process.env.STORYBOOK_DATA_GRAPH_URI || process.env.EXPO_PUBLIC_GRAPH_API
};

const MobileView: React.FC<MobileSignupProps> = ({ children }) => (
    <MobileProviders env={env}>
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
    </MobileProviders>
);

export default MobileView;
