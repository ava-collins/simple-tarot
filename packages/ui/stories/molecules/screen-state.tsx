import { StyleSheet, Text, View } from 'react-native';

import Button from '../atoms/button';
import FeedbackText from '../atoms/feedback-text';
import React from 'react';
import theme from '../utils/theme';
import type { ButtonVariant } from '../atoms/button';
import type { FeedbackTone } from '../atoms/feedback-text';

export interface ScreenStateAction {
    disabled?: boolean;
    label: string;
    onPress: () => void;
    variant?: ButtonVariant;
}

export type ScreenStateProps =
    | {
          action?: ScreenStateAction;
          kind: 'status';
          message: React.ReactNode;
          title?: string;
          tone?: FeedbackTone;
      }
    | {
          action?: ScreenStateAction;
          feedback?: React.ReactNode;
          feedbackTone?: FeedbackTone;
          kind: 'prompt';
          message?: React.ReactNode;
          title: string;
      };

const ScreenState: React.FC<ScreenStateProps> = props => {
    const { action, kind, title } = props;

    return (
        <View
            style={[
                styles.container,
                kind === 'status' ? styles.status : styles.prompt
            ]}>
            {title ? (
                <Text
                    style={[
                        styles.title,
                        kind === 'status' ? styles.centeredText : undefined
                    ]}>
                    {title}
                </Text>
            ) : null}

            {kind === 'status' ? (
                <FeedbackText tone={props.tone ?? 'muted'}>
                    {props.message}
                </FeedbackText>
            ) : (
                <>
                    {props.message ? (
                        <Text style={styles.message}>{props.message}</Text>
                    ) : null}
                    <FeedbackText tone={props.feedbackTone}>
                        {props.feedback}
                    </FeedbackText>
                </>
            )}

            {action ? (
                <View style={styles.action}>
                    <Button
                        disabled={action.disabled}
                        label={action.label}
                        onPress={action.onPress}
                        variant={action.variant}
                    />
                </View>
            ) : null}
        </View>
    );
};

export default ScreenState;

const styles = StyleSheet.create({
    action: {
        alignSelf: 'stretch'
    },
    centeredText: {
        textAlign: 'center'
    },
    container: {
        backgroundColor: theme.colors.grey0,
        flex: 1,
        gap: 16,
        justifyContent: 'center',
        paddingHorizontal: 32,
        width: '100%'
    },
    message: {
        color: theme.colors.grey5,
        fontSize: 16,
        lineHeight: 22
    },
    prompt: {
        alignItems: 'stretch'
    },
    status: {
        alignItems: 'center'
    },
    title: {
        color: theme.colors.primary,
        fontSize: 30,
        fontWeight: '700',
        letterSpacing: 0
    }
});
