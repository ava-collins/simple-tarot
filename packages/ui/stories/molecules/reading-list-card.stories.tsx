import { Meta, StoryObj } from '@storybook/react-native-web-vite';

import mdx from './reading-list-card.mdx';
import ReadingListCard from './reading-list-card';

const meta = {
    title: 'Molecules/ReadingListCard',
    component: ReadingListCard,
    parameters: {
        docs: {
            page: mdx
        }
    }
} satisfies Meta<typeof ReadingListCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        createdAtLabel: 'Jul 2, 2026, 10:00 AM',
        question: 'What should I notice today?',
        spread: 'single_card',
        summary: 'A clear beginning asks for curiosity before certainty.'
    }
};

export const WithoutQuestion: Story = {
    args: {
        createdAtLabel: 'Jul 3, 2026, 8:15 PM',
        question: 'Reading without a question',
        spread: 'single_card',
        summary: 'The card points toward a steady next step.'
    }
};
