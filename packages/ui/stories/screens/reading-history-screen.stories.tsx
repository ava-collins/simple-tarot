import { Meta, StoryObj } from '@storybook/react-native-web-vite';

import mdx from './reading-history-screen.mdx';
import ReadingHistoryScreen from './reading-history-screen';

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

const baseArgs = {
    isAuthLoading: false,
    isLoading: false,
    isSignedIn: true,
    onCreateReadingPress: () => console.log('Create reading pressed'),
    onRefresh: () => console.log('Refresh readings'),
    onSignInPress: () => console.log('Sign in pressed')
};

const meta = {
    title: 'Screens/ReadingHistoryScreen',
    component: ReadingHistoryScreen,
    parameters: {
        layout: 'padded',
        viewport: { value: 'iphone14pro', isRotated: false },
        docs: {
            page: mdx
        }
    }
} satisfies Meta<typeof ReadingHistoryScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const PopulatedHistory: Story = {
    args: {
        ...baseArgs,
        readings: sampleReadings
    }
};

export const EmptyHistory: Story = {
    args: {
        ...baseArgs,
        readings: []
    }
};

export const HistoryError: Story = {
    args: {
        ...baseArgs,
        error: 'Unable to load reading history.',
        readings: sampleReadings
    }
};

export const AuthLoading: Story = {
    args: {
        ...baseArgs,
        isAuthLoading: true,
        readings: []
    }
};

export const SignedOut: Story = {
    args: {
        ...baseArgs,
        isSignedIn: false,
        readings: []
    }
};
