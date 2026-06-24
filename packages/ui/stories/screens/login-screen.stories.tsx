import { Meta, StoryObj } from '@storybook/react-native-web-vite';
import React from 'react';
import LoginScreen from './login-screen';
import mdx from './login-screen.mdx';
const meta = {
    title: 'Screens/LoginScreen',
    component: LoginScreen,
    parameters: {
        layout: 'padded',
        viewport: { value: 'iphone14pro', isRotated: false },
        docs: {
            page: mdx
        }
    }
} satisfies Meta<typeof LoginScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        onSubmit: (emailAddress: string, password: string) => {
            console.log('Submitted:', { emailAddress, password });
        },
        onSignUpPress: () => {
            console.log('Create account pressed');
        }
    }
};

export const Loading: Story = {
    args: {
        isLoading: true,
        onSubmit: (emailAddress: string, password: string) => {
            console.log('Submitted:', { emailAddress, password });
        },
        onSignUpPress: () => {
            console.log('Create account pressed');
        }
    }
};

export const WithAuthError: Story = {
    args: {
        error: 'Incorrect username or password.',
        onSubmit: (emailAddress: string, password: string) => {
            console.log('Submitted:', { emailAddress, password });
        },
        onSignUpPress: () => {
            console.log('Create account pressed');
        }
    }
};
