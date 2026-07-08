import { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { StyleSheet, Text, View } from 'react-native';

import StartArrow from './start-arrow';
import React from 'react';

const meta = {
    title: 'Atoms/Dev/StartArrow',
    component: StartArrow,
    parameters: {
        docs: {
            disable: true
        }
    },
    tags: ['!autodocs']
} satisfies Meta<typeof StartArrow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
    args: {
        width: 54.667,
        height: 76
    }
};
