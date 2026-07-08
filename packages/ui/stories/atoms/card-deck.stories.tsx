import { Meta, StoryObj } from '@storybook/react-native-web-vite';
import CardDeck from './card-deck';

const meta = {
    title: 'Atoms/Dev/CardDeck',
    component: CardDeck,
    parameters: {
        docs: {
            disable: true
        }
    },
    tags: ['!autodocs']
} satisfies Meta<typeof CardDeck>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
    args: {
        onPress: () => {
            console.log('Card deck pressed');
        }
    }
};
