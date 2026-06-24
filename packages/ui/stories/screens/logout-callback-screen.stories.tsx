import { Meta, StoryObj } from '@storybook/react-native-web-vite';
import React from 'react';
import LogoutCallbackScreen from './logout-callback-screen';
import mdx from './logout-callback-screen.mdx';

const meta = {
    title: 'Screens/LogoutCallbackScreen',
    component: LogoutCallbackScreen,
    parameters: {
        layout: 'padded',
        viewport: { value: 'iphone14pro', isRotated: false },
        docs: {
            page: mdx
        }
    }
} satisfies Meta<typeof LogoutCallbackScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {}
};
