import { Meta, StoryObj } from '@storybook/react-native-web-vite';

import ScreenState from './screen-state';
import mdx from './screen-state.mdx';

const meta = {
    title: 'Molecules/ScreenState',
    component: ScreenState,
    parameters: {
        docs: {
            page: mdx
        }
    },
    tags: ['autodocs']
} satisfies Meta<typeof ScreenState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const LoadingStatus: Story = {
    args: {
        kind: 'status',
        message: 'Checking session...'
    }
};

export const ErrorStatusWithAction: Story = {
    args: {
        action: {
            label: 'Try again',
            onPress: () => console.log('Try again pressed')
        },
        kind: 'status',
        message: 'Unable to continue.',
        tone: 'error'
    }
};

export const Prompt: Story = {
    args: {
        action: {
            label: 'Sign in',
            onPress: () => console.log('Sign in pressed')
        },
        kind: 'prompt',
        message: 'Sign in to continue.',
        title: 'Account'
    }
};

export const PromptWithFeedback: Story = {
    args: {
        action: {
            label: 'Sign in',
            onPress: () => console.log('Sign in pressed')
        },
        feedback: 'Your session expired.',
        kind: 'prompt',
        message: 'Sign in to continue.',
        title: 'Account'
    }
};

export const PromptWithDisabledAction: Story = {
    args: {
        action: {
            disabled: true,
            label: 'Continue',
            onPress: () => console.log('Continue pressed')
        },
        kind: 'prompt',
        message: 'Continue with the secure sign-in page.',
        title: 'Sign in'
    }
};
