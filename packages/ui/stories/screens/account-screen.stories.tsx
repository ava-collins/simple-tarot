import { Meta, StoryObj } from '@storybook/react-native-web-vite';
import React from 'react';
import { Text, View } from 'react-native';
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
        onSignInPress: () => {
            console.log('Sign in pressed');
        },
        onSignOutPress: () => {
            console.log('Sign out pressed');
        }
    }
};

export const SignedInWithAvatarSlot: Story = {
    args: {
        isSignedIn: true,
        email: 'user@example.com',
        displayName: 'Jane Doe',
        avatarSlot: (
            <View
                style={{
                    alignItems: 'center',
                    borderColor: '#333',
                    borderRadius: 100,
                    borderWidth: 1,
                    height: 200,
                    justifyContent: 'center',
                    width: 200
                }}>
                <Text>Avatar slot</Text>
            </View>
        ),
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
