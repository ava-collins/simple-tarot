import { Meta, StoryObj } from '@storybook/react-native-web-vite';

import mdx from './avatar-display.mdx';
import AvatarDisplay from './avatar-display';

const defaultImage =
    'https://images.rawpixel.com/image_png_social_square/czNmcy1wcml2YXRlL3Jhd3BpeGVsX2ltYWdlcy93ZWJzaXRlX2NvbnRlbnQvam9iNjY4LTExNS1wXzEtbDE0YW1vbXgucG5n.png';

const meta = {
    title: 'Atoms/AvatarDisplay',
    component: AvatarDisplay,
    parameters: {
        docs: {
            page: mdx
        }
    }
} satisfies Meta<typeof AvatarDisplay>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DefaultAvatarImage: Story = {
    args: {
        imageUri: defaultImage
    }
};

export const CustomNumericSize: Story = {
    args: {
        imageUri: defaultImage,
        size: 350
    }
};

export const PressCallbacks: Story = {
    args: {
        imageUri: defaultImage,
        onLongPress: () => console.log('Avatar long pressed'),
        onPress: () => console.log('Avatar pressed'),
        size: 160
    }
};
