import { Meta, StoryObj } from '@storybook/react-native-web-vite';
import QuickNav from './quick-nav';
import mdx from './quick-nav.mdx';

const meta: Meta<typeof QuickNav> = {
    title: 'Molecules/QuickNav',
    component: QuickNav,
    parameters: {
        docs: {
            page: mdx,
            story: { height: '400px' }
        },
        viewport: { value: 'iphone14pro', isRotated: false }
    }
} satisfies Meta<typeof QuickNav>;

export default meta;

type Story = StoryObj<typeof QuickNav>;

export const Default: Story = {};
