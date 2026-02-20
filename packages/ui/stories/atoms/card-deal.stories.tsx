import DealCard, { DealCardProps } from './card-deal';
import { Meta, StoryObj } from '@storybook/react-native-web-vite';

import React from 'react';
import mdx from './card-deal.mdx';

const meta: Meta<DealCardProps> = {
    title: 'Atoms/DealCard',
    component: DealCard,
    parameters: {
        docs: {
            page: mdx
        }
    }
};

export default meta;

type Story = StoryObj<DealCardProps>;

export const Default: Story = {
    args: {
        cardIndex: 0,
        spreadIndex: 0,
        reversed: false,
        dealt: false,
        onPress: () => {}
    }
};
export const Dealt: Story = {
    args: {
        cardIndex: 0,
        spreadIndex: 0,
        reversed: false,
        dealt: true,
        onPress: () => {}
    }
};

export const Reversed: Story = {
    args: {
        cardIndex: 0,
        spreadIndex: 0,
        reversed: true,
        dealt: true,
        onPress: () => {}
    }
};
