import { Meta, StoryObj } from '@storybook/react-native-web-vite';
import React from 'react';
import AccountScreen from './account-screen';
import mdx from './account-screen.mdx';

const meta = {
    title: 'Screens/AccountScreen',
    component: AccountScreen,
    parameters: {
        layout: 'padded',
        viewport: { value: 'iphone14pro', isRotated: false },
        docs: {
            page: mdx
        }
    }
} satisfies Meta<typeof AccountScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        isSignedIn: false,
        onSignInPress: () => {
            console.log('Sign in pressed');
        },
        onSignOutPress: () => {
            console.log('Sign out pressed');
        }
    }
};

export const SignedIn: Story = {
    args: {
        isSignedIn: true,
        email: 'user@example.com',
        displayName: 'Jane Doe',
        subject: 'us-east-1:abc123',
        onSignInPress: () => {
            console.log('Sign in pressed');
        },
        onSignOutPress: () => {
            console.log('Sign out pressed');
        }
    }
};

export const Loading: Story = {
    args: {
        isLoading: true,
        onSignInPress: () => {
            console.log('Sign in pressed');
        },
        onSignOutPress: () => {
            console.log('Sign out pressed');
        }
    }
};

export const SignedOutWithError: Story = {
    args: {
        isSignedIn: false,
        error: 'Session expired. Please sign in again.',
        onSignInPress: () => {
            console.log('Sign in pressed');
        },
        onSignOutPress: () => {
            console.log('Sign out pressed');
        }
    }
};
