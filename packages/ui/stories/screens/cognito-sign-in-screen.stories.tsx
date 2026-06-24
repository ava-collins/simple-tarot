import { Meta, StoryObj } from '@storybook/react-native-web-vite';
import React from 'react';
import CognitoSignInScreen from './cognito-sign-in-screen';
import mdx from './cognito-sign-in-screen.mdx';

const meta = {
    title: 'Screens/CognitoSignInScreen',
    component: CognitoSignInScreen,
    parameters: {
        layout: 'padded',
        viewport: { value: 'iphone14pro', isRotated: false },
        docs: {
            page: mdx
        }
    }
} satisfies Meta<typeof CognitoSignInScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        authRequestReady: true,
        onContinuePress: () => {
            console.log('Continue pressed');
        }
    }
};

export const NotReady: Story = {
    args: {
        authRequestReady: false,
        onContinuePress: () => {
            console.log('Continue pressed');
        }
    }
};

export const Loading: Story = {
    args: {
        authRequestReady: true,
        isLoading: true,
        onContinuePress: () => {
            console.log('Continue pressed');
        }
    }
};

export const WithError: Story = {
    args: {
        authRequestReady: true,
        error: 'Unable to open sign-in page. Please try again.',
        onContinuePress: () => {
            console.log('Continue pressed');
        }
    }
};
