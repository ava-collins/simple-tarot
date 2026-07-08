import { Meta, StoryObj } from '@storybook/react-native-web-vite';
import QuickNav from '../molecules/quick-nav';
import React from 'react';

import { forceReloadDecorator } from './force-reload-decorator';
import { expect, fireEvent, screen, within, waitFor } from 'storybook/test';

const meta: Meta<typeof QuickNav> = {
    title: 'Molecules/Dev/QuickNav',
    component: QuickNav,
    decorators: [forceReloadDecorator]
} satisfies Meta<typeof QuickNav>;

export default meta;

type Story = StoryObj<typeof QuickNav>;

export const QuickNavOpenTest: Story = {
    play: async ({ mount, step }) => {
        await mount(<QuickNav />);
        await new Promise(resolve => setTimeout(resolve, 1000));

        const canvas = within(screen.getByTestId('quick-nav-container'));

        await step('Click open button', async () => {
            const toggleButton = canvas.getByTestId('quick-nav-toggle');
            expect(toggleButton).toBeVisible();
            fireEvent.click(toggleButton);
            fireEvent.animationEnd(toggleButton);
        });

        await step('Check if quick nav is open', async () => {
            await waitFor(() =>
                expect(canvas.getByTestId('quick-nav-profile-action')).toBeVisible()
            );
            await waitFor(() =>
                expect(canvas.getByTestId('quick-nav-history-action')).toBeVisible()
            );
            await waitFor(() =>
                expect(canvas.getByTestId('quick-nav-new-reading-action')).toBeVisible()
            );
        });

        await step('Click close button', async () => {
            const closeButton = canvas.getByTestId('quick-nav-toggle');
            expect(closeButton).toBeVisible();
            fireEvent.click(closeButton);
            fireEvent.animationEnd(closeButton);
        });

        await step('Check if quick nav is closed', async () => {
            await waitFor(() =>
                expect(canvas.queryByTestId('quick-nav-profile-action')).not.toBeVisible()
            );
            await waitFor(() =>
                expect(canvas.queryByTestId('quick-nav-history-action')).not.toBeVisible()
            );
            await waitFor(() =>
                expect(
                    canvas.queryByTestId('quick-nav-new-reading-action')
                ).not.toBeVisible()
            );
        });
    }
};
