import { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { expect, fn } from 'storybook/test';

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
            onPress: fn()
        },
        kind: 'status',
        message: 'Unable to continue.',
        tone: 'error'
    },
    play: async ({ args, canvas, userEvent }) => {
        await userEvent.click(
            canvas.getByRole('button', { name: 'Try again' })
        );

        if (!args.action) {
            throw new Error('ErrorStatusWithAction requires an action');
        }

        await expect(args.action.onPress).toHaveBeenCalledTimes(1);
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
