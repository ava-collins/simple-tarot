import { Meta, StoryObj } from '@storybook/react-native-web-vite';
import React from 'react';
import AuthCallbackScreen from './auth-callback-screen';
import mdx from './auth-callback-screen.mdx';

const meta = {
    title: 'Screens/AuthCallbackScreen',
    component: AuthCallbackScreen,
    parameters: {
        layout: 'padded',
        viewport: { value: 'iphone14pro', isRotated: false },
        docs: {
            page: mdx
        }
    }
} satisfies Meta<typeof AuthCallbackScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Loading: Story = {
    args: {
        isLoading: true
    }
};

export const Success: Story = {
    args: {
        isLoading: false
    }
};

export const WithError: Story = {
    args: {
        isLoading: false,
        error: 'The authorisation code has expired. Please sign in again.'
    }
};
