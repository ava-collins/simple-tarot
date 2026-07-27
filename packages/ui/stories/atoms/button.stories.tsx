import { Meta, StoryObj } from '@storybook/react-native-web-vite';

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

export const Primary: Story = {};

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
        disabled: true
    }
};
