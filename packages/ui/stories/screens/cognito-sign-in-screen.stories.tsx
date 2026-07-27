import { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { expect, fireEvent, fn } from 'storybook/test';
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
    },
    tags: ['autodocs']
} satisfies Meta<typeof CognitoSignInScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        authRequestReady: true,
        onContinuePress: fn()
    },
    play: async ({ args, canvas, userEvent }) => {
        await userEvent.click(
            canvas.getByRole('button', { name: 'Continue' })
        );
        await expect(args.onContinuePress).toHaveBeenCalledTimes(1);
    }
};

export const NotReady: Story = {
    args: {
        authRequestReady: false,
        onContinuePress: fn()
    },
    play: async ({ args, canvas }) => {
        const button = canvas.getByRole('button', { name: 'Continue' });
        await expect(button).toBeDisabled();
        fireEvent.click(button);
        await expect(args.onContinuePress).not.toHaveBeenCalled();
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
