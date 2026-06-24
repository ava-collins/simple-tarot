import { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { expect } from 'storybook/test';

import React from 'react';
import AccountScreen from '../screens/account-screen';

const meta = {
    title: 'Screens/AccountScreen',
    component: AccountScreen,
    parameters: {
        layout: 'padded',
        viewport: { value: 'iphone14pro', isRotated: false }
    }
} satisfies Meta<typeof AccountScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SignInButtonVisibleTest: Story = {
    args: {
        isSignedIn: false,
        onSignInPress: () => {
            console.log('Sign in pressed');
        },
        onSignOutPress: () => {
            console.log('Sign out pressed');
        }
    },
    play: async ({ canvas, step }) => {
        await step('Sign in button is visible in signed-out state', async () => {
            await expect(canvas.getByRole('button', { name: 'Sign in' })).toBeVisible();
        });
    }
};

export const SignOutButtonVisibleTest: Story = {
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
    },
    play: async ({ canvas, step }) => {
        await step('Sign out button is visible in signed-in state', async () => {
            await expect(canvas.getByRole('button', { name: 'Sign out' })).toBeVisible();
        });
    }
};
