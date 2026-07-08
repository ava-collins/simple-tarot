import { Meta, StoryObj } from '@storybook/react-native-web-vite';

import mdx from './reading-history-list.mdx';
import ReadingHistoryList from './reading-history-list';

const sampleReadings = [
    {
        createdAtLabel: 'Jul 2, 2026, 10:00 AM',
        key: 'reading-1',
        question: 'What should I notice today?',
        spread: 'single_card',
        summary: 'A clear beginning asks for curiosity before certainty.'
    },
    {
        createdAtLabel: 'Jul 3, 2026, 8:15 PM',
        key: 'reading-2',
        question: 'Where should I focus?',
        spread: 'single_card',
        summary: 'Small deliberate action will reveal the path.'
    }
];

const meta = {
    title: 'Organisms/ReadingHistoryList',
    component: ReadingHistoryList,
    parameters: {
        docs: {
            page: mdx
        }
    }
} satisfies Meta<typeof ReadingHistoryList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Populated: Story = {
    args: {
        emptyMessage: 'No saved readings yet.',
        isLoading: false,
        onCreateReadingPress: () => console.log('Generate reading pressed'),
        onRefresh: () => console.log('Refresh readings'),
        readings: sampleReadings
    }
};

export const Empty: Story = {
    args: {
        emptyMessage: 'No saved readings yet.',
        isLoading: false,
        onCreateReadingPress: () => console.log('Generate reading pressed'),
        onRefresh: () => console.log('Refresh readings'),
        readings: []
    }
};

export const LoadingEmpty: Story = {
    args: {
        emptyMessage: 'No saved readings yet.',
        isLoading: true,
        onCreateReadingPress: () => console.log('Generate reading pressed'),
        onRefresh: () => console.log('Refresh readings'),
        readings: []
    }
};
