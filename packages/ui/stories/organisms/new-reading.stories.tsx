import { Meta, StoryObj } from '@storybook/react-native-web-vite';

import NewReading from './new-reading';

const meta = {
    title: 'Organisms/Dev/NewReading',
    component: NewReading,
    parameters: {
        docs: {
            disable: true
        }
    },
    tags: ['!autodocs']
} satisfies Meta<typeof NewReading>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
    args: {
        onStart: () => {
            console.log('New reading started');
        }
    }
};
