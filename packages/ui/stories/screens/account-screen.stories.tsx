import { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { expect, fn } from 'storybook/test';
import React from 'react';
import { Text, View } from 'react-native';
import AccountScreen from './account-screen';
import mdx from './account-screen.mdx';
import theme from '../utils/theme';

const meta = {
    title: 'Screens/AccountScreen',
    component: AccountScreen,
    parameters: {
        layout: 'padded',
        viewport: { value: 'iphone14pro', isRotated: false },
        docs: {
            page: mdx
        }
    },
    tags: ['autodocs']
} satisfies Meta<typeof AccountScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        isSignedIn: false,
        onSignInPress: fn(),
        onSignOutPress: () => {
            console.log('Sign out pressed');
        }
    },
    play: async ({ args, canvas, userEvent }) => {
        await userEvent.click(
            canvas.getByRole('button', { name: 'Sign in' })
        );
        await expect(args.onSignInPress).toHaveBeenCalledTimes(1);
    }
};

export const SignedIn: Story = {
    args: {
        isSignedIn: true,
        email: 'user@example.com',
        displayName: 'Jane Doe',
        onNewReadingPress: () => {
            console.log('New reading pressed');
        },
        onReadingHistoryPress: () => {
            console.log('Reading history pressed');
        },
        onSignInPress: () => {
            console.log('Sign in pressed');
        },
        onSignOutPress: fn()
    },
    play: async ({ args, canvas, userEvent }) => {
        await userEvent.click(
            canvas.getByRole('button', { name: 'Sign out' })
        );
        await expect(args.onSignOutPress).toHaveBeenCalledTimes(1);
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
                    borderColor: theme.colors.grey5,
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
