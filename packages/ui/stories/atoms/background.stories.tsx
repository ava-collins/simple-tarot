import { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { StyleSheet, Text, View } from 'react-native';

import Background from './background';
import React from 'react';
import theme from '../utils/theme';

const styles = StyleSheet.create({
    text: {
        backgroundColor: theme.colors.grey5,
        borderRadius: 8,
        color: theme.colors.white,
        fontSize: 24,
        fontWeight: 'bold',
        padding: 12
    }
});

const meta = {
    title: 'Atoms/Dev/Background',
    component: Background,
    parameters: {
        docs: {
            disable: true
        }
    },
    tags: ['!autodocs']
} satisfies Meta<typeof Background>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
    args: {
        children: (
            <View>
                <Text style={styles.text}>Background Story Example</Text>
            </View>
        )
    }
};
