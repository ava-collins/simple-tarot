import { StyleSheet, Text } from 'react-native';

import React from 'react';
import theme from '../utils/theme';

export type FeedbackTone = 'error' | 'success' | 'warning' | 'muted';

export interface FeedbackTextProps {
    children?: React.ReactNode;
    tone?: FeedbackTone;
}

const FeedbackText: React.FC<FeedbackTextProps> = ({
    children,
    tone = 'error'
}) => {
    if (
        children === null ||
        children === undefined ||
        children === false ||
        children === ''
    ) {
        return null;
    }

    return <Text style={[styles.base, styles[tone]]}>{children}</Text>;
};

export default FeedbackText;

const styles = StyleSheet.create({
    base: {
        fontSize: 14,
        lineHeight: 20
    },
    error: {
        color: theme.colors.error
    },
    muted: {
        color: theme.colors.grey5
    },
    success: {
        color: theme.colors.success
    },
    warning: {
        color: theme.colors.warning
    }
});
