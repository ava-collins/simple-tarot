import { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { expect, fn } from 'storybook/test';

import mdx from './new-reading-form.mdx';
import NewReadingForm from './new-reading-form';

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
    onBackPress: () => console.log('Back pressed'),
    onGeneratePress: (question: string) => console.log('Generate reading:', question),
    onHistoryPress: () => console.log('History pressed')
};

const meta = {
    title: 'Organisms/NewReadingForm',
    component: NewReadingForm,
    parameters: {
        docs: {
            page: mdx,
            description: {
                component:
                    'Neutral presentation uses the shared black, white, and grey theme tokens; status feedback uses its semantic theme color.'
            }
        }
    },
    tags: ['autodocs']
} satisfies Meta<typeof NewReadingForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const EmptyForm: Story = {
    args: {
        ...baseArgs,
        isGenerating: false,
        latestReading: null,
        onGeneratePress: fn()
    },
    play: async ({ args, canvas, userEvent }) => {
        await userEvent.type(
            canvas.getByLabelText('Question'),
            'What should I notice today?'
        );
        await userEvent.click(
            canvas.getByRole('button', { name: 'Generate reading' })
        );
        await expect(args.onGeneratePress).toHaveBeenCalledWith(
            'What should I notice today?'
        );
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
