import { Meta, StoryObj } from '@storybook/react-native-web-vite';

import mdx from './single-card-reading-screen.mdx';
import SingleCardReadingScreen from './single-card-reading-screen';

const baseArgs = {
    isAuthLoading: false,
    isGenerating: false,
    isSignedIn: true,
    onSignInPress: () => console.log('Sign in pressed'),
    onStart: () => console.log('Start pressed')
};

const meta = {
    title: 'Screens/SingleCardReadingScreen',
    component: SingleCardReadingScreen,
    parameters: {
        layout: 'padded',
        viewport: { value: 'iphone14pro', isRotated: false },
        docs: {
            page: mdx
        }
    }
} satisfies Meta<typeof SingleCardReadingScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: baseArgs
};

export const Generating: Story = {
    args: {
        ...baseArgs,
        isGenerating: true
    }
};

export const WithError: Story = {
    args: {
        ...baseArgs,
        error: 'Unable to draw a card.'
    }
};

export const AuthLoading: Story = {
    args: {
        ...baseArgs,
        isAuthLoading: true
    }
};

export const SignedOut: Story = {
    args: {
        ...baseArgs,
        isSignedIn: false
    }
};
