import { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { expect, fireEvent, fn, waitFor } from 'storybook/test';
import QuickNav from './quick-nav';
import mdx from './quick-nav.mdx';
import { forceReloadDecorator } from '../tests/force-reload-decorator';

const meta: Meta<typeof QuickNav> = {
    title: 'Molecules/QuickNav',
    component: QuickNav,
    decorators: [forceReloadDecorator],
    parameters: {
        docs: {
            page: mdx,
            story: { height: '400px' }
        },
        viewport: { value: 'iphone14pro', isRotated: false }
    },
    tags: ['autodocs']
} satisfies Meta<typeof QuickNav>;

export default meta;

type Story = StoryObj<typeof QuickNav>;

export const Default: Story = {
    args: {
        onNewReadingPress: fn(),
        onProfilePress: fn(),
        onReadingHistoryPress: fn()
    },
    play: async ({ args, canvas, step }) => {
        const toggle = canvas.getByRole('button', {
            name: 'Open quick navigation'
        });

        await step('open the quick navigation', async () => {
            fireEvent.click(toggle);
            fireEvent.animationEnd(toggle);
            await waitFor(() =>
                expect(
                    canvas.getByRole('button', { name: 'Open profile' })
                ).toBeVisible()
            );
        });

        await step('invoke an action and close', async () => {
            fireEvent.click(
                canvas.getByRole('button', { name: 'Open profile' })
            );
            await expect(args.onProfilePress).toHaveBeenCalledTimes(1);
            await waitFor(() =>
                expect(
                    canvas.queryByRole('button', { name: 'Open profile' })
                ).not.toBeVisible()
            );
        });
    }
};
