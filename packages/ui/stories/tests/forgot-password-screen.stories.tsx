import { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { expect } from 'storybook/test';
import { errorMessages } from '@simpletarot/hooks/server';

import React from 'react';
import ForgotPasswordScreen from '../screens/forgot-password-screen';

const meta = {
    title: 'Screens/ForgotPasswordScreen',
    component: ForgotPasswordScreen,
    parameters: {
        layout: 'padded',
        viewport: { value: 'iphone14pro', isRotated: false }
    }
} satisfies Meta<typeof ForgotPasswordScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const InvalidEmailTest = {
    args: {
        onSubmit: (emailAddress: string, password: string) => {
            console.log('Submitted:', { emailAddress, password });
        }
    },
    play: async ({ canvas, userEvent, step }) => {
        await step('Enter email', async () => {
            await userEvent.type(
                canvas.getByPlaceholderText('Enter your email'),
                'test@test'
            );
        });

        const SubmitBtn = canvas.getByRole('button');
        await step('Click submit button', async () => {
            await userEvent.click(SubmitBtn);
        });

        await step('Check for error message', async () => {
            await expect(SubmitBtn).toBeDisabled();
            await expect(
                canvas.getByText(errorMessages.INVALID_EMAIL.message)
            ).toBeVisible();
        });

        await step('Correct email check button is enabled', async () => {
            await userEvent.clear(
                canvas.getByPlaceholderText('Enter your email', 'test@test.com')
            );
            await expect(SubmitBtn).toBeEnabled();
        });
    }
};
