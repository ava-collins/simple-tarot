import { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { StyleSheet, Text, View } from 'react-native';

import Background from './background';
import React from 'react';

const styles = StyleSheet.create({
    text: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
        backgroundColor: 'rgba(0,0,0,0.4)',
        padding: 12,
        borderRadius: 8
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
