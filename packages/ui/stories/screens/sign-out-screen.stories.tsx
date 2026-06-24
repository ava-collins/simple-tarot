import { Meta, StoryObj } from '@storybook/react-native-web-vite';
import React from 'react';
import SignOutScreen from './sign-out-screen';
import mdx from './sign-out-screen.mdx';

const meta = {
    title: 'Screens/SignOutScreen',
    component: SignOutScreen,
    parameters: {
        layout: 'padded',
        viewport: { value: 'iphone14pro', isRotated: false },
        docs: {
            page: mdx
        }
    }
} satisfies Meta<typeof SignOutScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {}
};
