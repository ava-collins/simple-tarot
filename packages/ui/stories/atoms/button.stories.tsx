import { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { expect, fireEvent, fn } from 'storybook/test';

import Button from './button';
import mdx from './button.mdx';

const meta = {
    title: 'Atoms/Button',
    component: Button,
    args: {
        label: 'Continue',
        onPress: () => console.log('Button pressed')
    },
    parameters: {
        docs: {
            page: mdx
        }
    },
    tags: ['autodocs']
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
    args: {
        onPress: fn()
    },
    play: async ({ args, canvas, userEvent }) => {
        await userEvent.click(
            canvas.getByRole('button', { name: 'Continue' })
        );
        await expect(args.onPress).toHaveBeenCalledTimes(1);
    }
};

export const Secondary: Story = {
    args: {
        variant: 'secondary'
    }
};

export const Muted: Story = {
    args: {
        variant: 'muted'
    }
};

export const Compact: Story = {
    args: {
        size: 'compact'
    }
};

export const Disabled: Story = {
    args: {
        disabled: true,
        onPress: fn()
    },
    play: async ({ args, canvas }) => {
        const button = canvas.getByRole('button', { name: 'Continue' });
        await expect(button).toBeDisabled();
        fireEvent.click(button);
        await expect(args.onPress).not.toHaveBeenCalled();
    }
};
