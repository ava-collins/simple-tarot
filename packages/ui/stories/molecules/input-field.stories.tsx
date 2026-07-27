import { Meta, StoryObj } from '@storybook/react-native-web-vite';

import InputField from './input-field';
import mdx from './input-field.mdx';

const meta = {
    title: 'Molecules/InputField',
    component: InputField,
    args: {
        inputProps: {
            label: 'Email',
            onChangeText: text => console.log('Input changed', text),
            placeholder: 'Enter your email',
            textContentType: 'emailAddress'
        }
    },
    parameters: {
        docs: {
            page: mdx
        }
    },
    tags: ['autodocs']
} satisfies Meta<typeof InputField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Error: Story = {
    args: {
        feedback: 'Enter a valid email address.',
        inputProps: {
            hasError: true,
            label: 'Email',
            onChangeText: text => console.log('Input changed', text),
            placeholder: 'Enter your email',
            textContentType: 'emailAddress'
        }
    }
};
