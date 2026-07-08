import { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { expect } from 'storybook/test';
import { errorMessages } from '@simpletarot/hooks/server';

import React from 'react';
import LoginScreen from '../screens/login-screen';
const meta = {
    title: 'Screens/LoginScreen',
    component: LoginScreen,
    parameters: {
        layout: 'padded',
        viewport: { value: 'iphone14pro', isRotated: false }
    }
} satisfies Meta<typeof LoginScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const InvalidEmailTest = {
    args: {
        onSubmit: (emailAddress: string, password: string) => {
            console.log('Submitted:', { emailAddress, password });
        }
    },
    play: async ({ canvas, userEvent, step }) => {
        await step('Enter email and password', async () => {
            await userEvent.type(canvas.getByPlaceholderText('Enter your email'), 'test');

            await userEvent.type(
                canvas.getByPlaceholderText('Enter your password', 'password'),
                'password'
            );
        });

        const LoginBtn = canvas.getByRole('button');
        await step('Click login button', async () => {
            await userEvent.click(LoginBtn);
        });

        await step('Check for error message', async () => {
            await expect(LoginBtn).toBeDisabled();
            await expect(
                canvas.getByText(errorMessages.INVALID_EMAIL.message)
            ).toBeVisible();
        });

        await step('Correct email check button is enabled', async () => {
            await userEvent.clear(
                canvas.getByPlaceholderText('Enter your email', 'test@test.com')
            );
            await expect(LoginBtn).toBeEnabled();
        });
    }
};

export const InvalidPasswordTest: Story = {
    args: {
        onSubmit: (emailAddress: string, password: string) => {
            console.log('Submitted:', { emailAddress, password });
        }
    },
    play: async ({ canvas, userEvent, step }) => {
        const LoginBtn = canvas.getByRole('button');

        await step('Enter invalid password', async () => {
            await userEvent.type(
                canvas.getByPlaceholderText('Enter your email'),
                'test@test.com'
            );

            await userEvent.type(
                canvas.getByPlaceholderText('Enter your password'),
                'pass'
            );
            await userEvent.click(LoginBtn);
        });

        await step('Check for password error message', async () => {
            await expect(LoginBtn).toBeDisabled();
            await expect(
                canvas.getByText(errorMessages.PASSWORD_TOO_SHORT.message)
            ).toBeVisible();
        });

        await step('Correct password check button is enabled', async () => {
            await userEvent.clear(canvas.getByPlaceholderText('Enter your password'));
            await expect(LoginBtn).toBeEnabled();
        });
    }
};
