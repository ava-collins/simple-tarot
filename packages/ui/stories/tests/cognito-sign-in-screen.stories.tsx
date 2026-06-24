import { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { expect } from 'storybook/test';

import React from 'react';
import CognitoSignInScreen from '../screens/cognito-sign-in-screen';

const meta = {
    title: 'Screens/CognitoSignInScreen',
    component: CognitoSignInScreen,
    parameters: {
        layout: 'padded',
        viewport: { value: 'iphone14pro', isRotated: false }
    }
} satisfies Meta<typeof CognitoSignInScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ButtonDisabledWhenNotReadyTest: Story = {
    args: {
        authRequestReady: false,
        onContinuePress: () => {
            console.log('Continue pressed');
        }
    },
    play: async ({ canvas, step }) => {
        await step('Continue button is disabled when auth request is not ready', async () => {
            await expect(canvas.getByRole('button')).toBeDisabled();
        });
    }
};

export const ButtonEnabledWhenReadyTest: Story = {
    args: {
        authRequestReady: true,
        onContinuePress: () => {
            console.log('Continue pressed');
        }
    },
    play: async ({ canvas, step }) => {
        await step('Continue button is enabled when auth request is ready', async () => {
            await expect(canvas.getByRole('button')).toBeEnabled();
        });
    }
};

export const ButtonDisabledWhileLoadingTest: Story = {
    args: {
        authRequestReady: true,
        isLoading: true,
        onContinuePress: () => {
            console.log('Continue pressed');
        }
    },
    play: async ({ canvas, step }) => {
        await step('Continue button is disabled while loading', async () => {
            await expect(canvas.getByRole('button')).toBeDisabled();
        });

        await step('Button label shows Opening... while loading', async () => {
            await expect(canvas.getByText('Opening...')).toBeVisible();
        });
    }
};
