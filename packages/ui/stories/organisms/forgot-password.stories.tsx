import { Meta, StoryObj } from '@storybook/react-native-web-vite';

import ForgotPasswordForm from './forgot-password-form';
import React from 'react';
import mdx from './forgot-password-form.mdx';

const meta = {
    title: 'Organisms/ForgotPasswordForm',
    component: ForgotPasswordForm,
    parameters: {
        docs: {
            page: mdx
        }
    },
    tags: ['autodocs']
} satisfies Meta<typeof ForgotPasswordForm>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        email: '',
        errors: [],
        onEmailChange: (text: string) => console.log('Email changed:', text),
        onSubmit: () => console.log('Form submitted')
    }
};

export const WithEmailError: Story = {
    args: {
        email: 'test@test',
        errors: [{ message: 'Invalid email address', type: 'emailAddress' }],
        onEmailChange: (text: string) => console.log('Email changed:', text),
        onSubmit: () => console.log('Form submitted')
    }
};
