import { Meta, StoryObj } from '@storybook/react-native-web-vite';

import React from 'react';
import ShuffleCard from './shuffle-card';
import { View } from 'react-native';
import mdx from './shuffle-card.mdx';

const meta: Meta = {
    title: 'Molecules/Dev/ShuffleCard',
    component: ShuffleCard,
    parameters: {
        controls: { expanded: true },
        docs: {
            page: mdx
        }
    },
    argTypes: {
        cardIndex: { control: 'number' },
        isShuffling: { control: 'boolean' },
        cutCards: { action: 'cutCards' },
        cutCardIndex: { control: 'number' }
    },
    decorators: [
        Story => (
            <View style={{ width: 400 }}>
                <Story />
            </View>
        )
    ],
    tags: ['autodocs']
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        cardIndex: 0,
        isShuffling: true,
        cutCards: () => {},
        cutCardIndex: 0
    }
};

export const NotShuffling: Story = {
    args: {
        cardIndex: 0,
        isShuffling: false,
        cutCards: () => {},
        cutCardIndex: 0
    }
};
