import { Meta, StoryObj } from '@storybook/react-native-web-vite';

import React from 'react';
import Shuffle from './shuffle';
import { View } from 'react-native';
import mdx from './shuffle.mdx';

const meta: Meta<typeof Shuffle> = {
    title: 'Organisms/Dev/Shuffle',
    component: Shuffle,
    parameters: {
        layout: 'centered',
        controls: {
            expanded: true
        },
        docs: {
            page: mdx
        }
    },
    decorators: [
        Story => (
            <View
                style={{
                    flex: 1,
                    justifyContent: 'center',
                    alignItems: 'center'
                }}>
                <Story />
            </View>
        )
    ]
};

export default meta;

type Story = StoryObj<typeof Shuffle>;

export const Default: Story = {
    args: {
        done: () => console.log('Done'),
        shuffleDeck: () => console.log('Shuffle Deck'),
        cutDeck: () => console.log('Cut Deck')
    }
};
