import { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { expect } from 'storybook/test';
import mdx from './signup-screen.mdx';

import React from 'react';
import SignupScreen from './signup-screen';

const meta = {
    title: 'Screens/SignupScreen',
    component: SignupScreen,
    parameters: {
        layout: 'padded',
        docs: {
            page: mdx
        },
        viewport: { value: 'iphone14pro', isRotated: false }
    }
} satisfies Meta<typeof SignupScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        onSubmit: (emailAddress: string, password: string) => {
            console.log('Submitted:', { emailAddress, password });
        },
        onConfirmSubmit: (emailAddress: string, verificationCode: string) => {
            console.log('Verification submitted:', {
                emailAddress,
                verificationCode
            });
        }
    }
};

export const CreatingAccount: Story = {
    args: {
        isLoading: true,
        onSubmit: (emailAddress: string, password: string) => {
            console.log('Submitted:', { emailAddress, password });
        },
        onConfirmSubmit: (emailAddress: string, verificationCode: string) => {
            console.log('Verification submitted:', {
                emailAddress,
                verificationCode
            });
        }
    }
};

export const AwaitingVerification: Story = {
    args: {
        isAwaitingVerification: true,
        message: 'Account created. Enter the verification code from your email.',
        onSubmit: (emailAddress: string, password: string) => {
            console.log('Submitted:', { emailAddress, password });
        },
        onConfirmSubmit: (emailAddress: string, verificationCode: string) => {
            console.log('Verification submitted:', {
                emailAddress,
                verificationCode
            });
        }
    }
};

export const VerifyingAccount: Story = {
    args: {
        isAwaitingVerification: true,
        isLoading: true,
        message: 'Account created. Enter the verification code from your email.',
        onSubmit: (emailAddress: string, password: string) => {
            console.log('Submitted:', { emailAddress, password });
        },
        onConfirmSubmit: (emailAddress: string, verificationCode: string) => {
            console.log('Verification submitted:', {
                emailAddress,
                verificationCode
            });
        }
    }
};
