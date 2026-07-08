import { Meta, StoryObj } from '@storybook/react-native-web-vite';

import HomeScreen from './home-screen';
import React from 'react';
import mdx from './home-screen.mdx';

const meta: Meta = {
    title: 'Screens/Dev/Home',
    component: HomeScreen,
    parameters: {
        docs: {
            page: mdx
        }
    },
    argTypes: {
        onStart: { action: 'onStart' }
    }
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        onStart: () => console.log('New Reading Started')
    }
};
