import { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { expect } from 'storybook/test';

import FeedbackText from './feedback-text';
import mdx from './feedback-text.mdx';

const meta = {
    title: 'Atoms/FeedbackText',
    component: FeedbackText,
    args: {
        children: 'Please review this message.'
    },
    parameters: {
        docs: {
            page: mdx
        }
    },
    tags: ['autodocs']
} satisfies Meta<typeof FeedbackText>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Error: Story = {
    play: async ({ canvas }) => {
        await expect(
            canvas.getByText('Please review this message.')
        ).toBeVisible();
    }
};

export const Success: Story = {
    args: {
        tone: 'success'
    }
};

export const Warning: Story = {
    args: {
        tone: 'warning'
    }
};

export const Muted: Story = {
    args: {
        tone: 'muted'
    }
};

export const Empty: Story = {
    args: {
        children: ''
    }
};
