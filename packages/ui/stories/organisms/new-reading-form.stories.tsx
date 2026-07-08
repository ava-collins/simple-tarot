import { Meta, StoryObj } from '@storybook/react-native-web-vite';

import mdx from './new-reading-form.mdx';
import NewReadingForm from './new-reading-form';

const latestReading = {
    positions: [
        {
            cardIndex: 0,
            cardName: 'The Fool',
            position: 'guidance',
            text: 'Begin with a lighter grip and let the first step teach you.'
        }
    ],
    summary: 'A clear beginning asks for curiosity before certainty.'
};

const baseArgs = {
    onBackPress: () => console.log('Back pressed'),
    onGeneratePress: (question: string) => console.log('Generate reading:', question),
    onHistoryPress: () => console.log('History pressed')
};

const meta = {
    title: 'Organisms/NewReadingForm',
    component: NewReadingForm,
    parameters: {
        docs: {
            page: mdx
        }
    }
} satisfies Meta<typeof NewReadingForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const EmptyForm: Story = {
    args: {
        ...baseArgs,
        isGenerating: false,
        latestReading: null
    }
};

export const Generating: Story = {
    args: {
        ...baseArgs,
        isGenerating: true,
        latestReading: null
    }
};

export const LatestResult: Story = {
    args: {
        ...baseArgs,
        isGenerating: false,
        latestReading
    }
};

export const WithError: Story = {
    args: {
        ...baseArgs,
        error: 'Unable to generate reading.',
        isGenerating: false,
        latestReading: null
    }
};
