import { Meta, StoryObj } from '@storybook/react-native-web-vite';

import mdx from './new-reading-screen.mdx';
import NewReadingScreen from './new-reading-screen';

const latestReading = {
    positions: [
        {
            cardIndex: 0,
            cardName: 'Fool',
            position: 'guidance',
            text: 'Begin with a lighter grip and let the first step teach you.'
        }
    ],
    summary: 'A clear beginning asks for curiosity before certainty.'
};

const baseArgs = {
    isAuthLoading: false,
    isGenerating: false,
    isSignedIn: true,
    latestReading: null,
    onBackPress: () => console.log('Back pressed'),
    onGeneratePress: (question: string) => console.log('Generate reading:', question),
    onHistoryPress: () => console.log('History pressed'),
    onSignInPress: () => console.log('Sign in pressed')
};

const meta = {
    title: 'Screens/NewReadingScreen',
    component: NewReadingScreen,
    parameters: {
        layout: 'padded',
        viewport: { value: 'iphone14pro', isRotated: false },
        docs: {
            page: mdx
        }
    }
} satisfies Meta<typeof NewReadingScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const EmptyForm: Story = {
    args: baseArgs
};

export const Generating: Story = {
    args: {
        ...baseArgs,
        isGenerating: true
    }
};

export const LatestResult: Story = {
    args: {
        ...baseArgs,
        latestReading
    }
};

export const WithError: Story = {
    args: {
        ...baseArgs,
        error: 'Unable to generate reading.'
    }
};

export const AuthLoading: Story = {
    args: {
        ...baseArgs,
        isAuthLoading: true
    }
};

export const SignedOut: Story = {
    args: {
        ...baseArgs,
        isSignedIn: false
    }
};
