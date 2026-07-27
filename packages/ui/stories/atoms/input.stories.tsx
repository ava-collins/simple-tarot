import { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { expect, fn } from 'storybook/test';

import Input from './input';
import mdx from './input.mdx';

const meta = {
    title: 'Atoms/Input',
    component: Input,
    args: {
        label: 'Question',
        onChangeText: text => console.log('Input changed', text),
        placeholder: 'Enter your question'
    },
    parameters: {
        docs: {
            page: mdx
        }
    },
    tags: ['autodocs']
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        onChangeText: fn()
    },
    play: async ({ args, canvas, userEvent }) => {
        const input = canvas.getByLabelText('Question');
        await userEvent.type(input, 'What should I notice?');
        await expect(args.onChangeText).toHaveBeenLastCalledWith(
            'What should I notice?'
        );
    }
};

export const Error: Story = {
    args: {
        hasError: true
    }
};

export const Password: Story = {
    args: {
        label: 'Password',
        placeholder: 'Enter your password',
        textContentType: 'password',
        value: 'secret'
    }
};

export const Multiline: Story = {
    args: {
        multiline: true,
        value: 'What should I pay attention to this week?'
    }
};

export const Disabled: Story = {
    args: {
        disabled: true,
        value: 'Unavailable'
    }
};
