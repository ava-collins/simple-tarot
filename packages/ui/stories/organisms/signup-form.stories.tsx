import { Meta, StoryObj } from '@storybook/react-native-web-vite';
import SignupForm from './signup-form';
import mdx from './signup-form.mdx';
import React from 'react';

const meta = {
    title: 'Organisms/SignupForm',
    component: SignupForm,
    parameters: {
        docs: {
            page: mdx
        }
    }
} satisfies Meta<typeof SignupForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        email: '',
        password: '',
        confirmPassword: '',
        errors: [],
        onEmailChange: (text: string) => console.log('Email changed:', text),
        onPasswordChange: (text: string) => console.log('Password changed:', text),
        onConfirmPasswordChange: (text: string) =>
            console.log('Confirm Password changed:', text),
        onVerificationCodeChange: (text: string) =>
            console.log('Verification Code changed:', text),
        onConfirmSubmit: () => console.log('Verification submitted'),
        onSubmit: () => console.log('Form submitted')
    }
};

export const WithEmailError: Story = {
    args: {
        email: '',
        password: '',
        confirmPassword: '',
        errors: [{ message: 'Invalid email address', type: 'emailAddress' }],
        onEmailChange: (text: string) => console.log('Email changed:', text),
        onPasswordChange: (text: string) => console.log('Password changed:', text),
        onConfirmPasswordChange: (text: string) =>
            console.log('Confirm Password changed:', text),
        onVerificationCodeChange: (text: string) =>
            console.log('Verification Code changed:', text),
        onConfirmSubmit: () => console.log('Verification submitted'),
        onSubmit: () => console.log('Form submitted')
    }
};

export const WithPasswordError: Story = {
    args: {
        email: 'admin@dev.com',
        password: '',
        confirmPassword: '',
        errors: [
            {
                message: 'Password must be at least 12 characters',
                type: 'password'
            }
        ],
        onEmailChange: (text: string) => console.log('Email changed:', text),
        onPasswordChange: (text: string) => console.log('Password changed:', text),
        onConfirmPasswordChange: (text: string) =>
            console.log('Confirm Password changed:', text),
        onVerificationCodeChange: (text: string) =>
            console.log('Verification Code changed:', text),
        onConfirmSubmit: () => console.log('Verification submitted'),
        onSubmit: () => console.log('Form submitted')
    }
};

export const WithConfirmPasswordError: Story = {
    args: {
        email: 'admin@dev.com',
        password: 'password123',
        confirmPassword: 'password1234',
        errors: [{ message: 'Passwords do not match', type: 'newPassword' }],
        onEmailChange: (text: string) => console.log('Email changed:', text),
        onPasswordChange: (text: string) => console.log('Password changed:', text),
        onConfirmPasswordChange: (text: string) =>
            console.log('Confirm Password changed:', text),
        onVerificationCodeChange: (text: string) =>
            console.log('Verification Code changed:', text),
        onConfirmSubmit: () => console.log('Verification submitted'),
        onSubmit: () => console.log('Form submitted')
    }
};

export const CreatingAccount: Story = {
    args: {
        email: 'admin@dev.com',
        password: 'password12345',
        confirmPassword: 'password12345',
        errors: [],
        isLoading: true,
        onEmailChange: (text: string) => console.log('Email changed:', text),
        onPasswordChange: (text: string) => console.log('Password changed:', text),
        onConfirmPasswordChange: (text: string) =>
            console.log('Confirm Password changed:', text),
        onVerificationCodeChange: (text: string) =>
            console.log('Verification Code changed:', text),
        onConfirmSubmit: () => console.log('Verification submitted'),
        onSubmit: () => console.log('Form submitted')
    }
};

export const AwaitingVerification: Story = {
    args: {
        email: 'admin@dev.com',
        password: 'password12345',
        confirmPassword: 'password12345',
        verificationCode: '',
        isAwaitingVerification: true,
        message: 'Account created. Enter the verification code from your email.',
        errors: [],
        onEmailChange: (text: string) => console.log('Email changed:', text),
        onPasswordChange: (text: string) => console.log('Password changed:', text),
        onConfirmPasswordChange: (text: string) =>
            console.log('Confirm Password changed:', text),
        onVerificationCodeChange: (text: string) =>
            console.log('Verification Code changed:', text),
        onConfirmSubmit: () => console.log('Verification submitted'),
        onSubmit: () => console.log('Form submitted')
    }
};

export const VerifyingAccount: Story = {
    args: {
        email: 'admin@dev.com',
        password: 'password12345',
        confirmPassword: 'password12345',
        verificationCode: '123456',
        isAwaitingVerification: true,
        isLoading: true,
        message: 'Account created. Enter the verification code from your email.',
        errors: [],
        onEmailChange: (text: string) => console.log('Email changed:', text),
        onPasswordChange: (text: string) => console.log('Password changed:', text),
        onConfirmPasswordChange: (text: string) =>
            console.log('Confirm Password changed:', text),
        onVerificationCodeChange: (text: string) =>
            console.log('Verification Code changed:', text),
        onConfirmSubmit: () => console.log('Verification submitted'),
        onSubmit: () => console.log('Form submitted')
    }
};
