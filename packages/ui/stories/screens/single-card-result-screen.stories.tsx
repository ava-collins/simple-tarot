import { Meta, StoryObj } from '@storybook/react-native-web-vite';

import mdx from './single-card-result-screen.mdx';
import SingleCardResultScreen from './single-card-result-screen';

const baseArgs = {
    cardIndex: 0,
    cardName: 'Fool',
    position: 'guidance',
    reversed: false,
    summary: 'A clear beginning asks for curiosity before certainty.',
    text: 'Begin with a lighter grip and let the first step teach you.',
    onDonePress: () => console.log('Done pressed'),
    onHistoryPress: () => console.log('History pressed')
};

const meta = {
    title: 'Screens/SingleCardResultScreen',
    component: SingleCardResultScreen,
    parameters: {
        layout: 'padded',
        viewport: { value: 'iphone14pro', isRotated: false },
        docs: {
            page: mdx
        }
    }
} satisfies Meta<typeof SingleCardResultScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: baseArgs
};

export const Reversed: Story = {
    args: {
        ...baseArgs,
        cardIndex: 22,
        cardName: 'Ace of Wands',
        reversed: true,
        text: 'A spark stalls until the doubt behind it is named.'
    }
};

export const LongText: Story = {
    args: {
        ...baseArgs,
        cardIndex: 15,
        cardName: 'Devil',
        text: 'Notice the chain you have mistaken for a wall. What looks fixed today loosens the moment you name the habit that keeps it in place, and the moment you name it, you already have more choice than the story allows.',
        summary: 'A pattern is asking to be seen clearly before it can be released.'
    }
};
