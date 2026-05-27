import { StyleSheet, View } from 'react-native';

import Button from '@rneui/themed/dist/Button';
import React from 'react';
import theme from '../utils/theme';

export interface ButtonProps {
    buttonLabel: string;
    btnEnabled?: boolean;
    onPress: () => void;
    buttonStyle?: object;
    titleStyle?: object;
}

const t = theme();

const FormButton: React.FC<ButtonProps> = ({
    buttonLabel,
    btnEnabled = true,
    onPress,
    buttonStyle,
    titleStyle
}) => {
    const styles = StyleSheet.create({
        base: {
            height: 60,
            backgroundColor: t.colors.grey5,
            marginBottom: 20,
            paddingHorizontal: 40
        },
        baseTitle: {
            color: '#fff',
            fontSize: 16,
            fontWeight: 'bold'
        },
        formRow: {
            alignItems: 'flex-start',
            marginTop: 10,
            marginBottom: 10
        }
    });

    return (
        <Button
            title={buttonLabel}
            buttonStyle={[styles.base, buttonStyle]}
            disabled={!btnEnabled}
            titleStyle={[styles.baseTitle, titleStyle]}
            accessibilityLabel={buttonLabel}
            onPress={onPress}
        />
    );
};

export default FormButton;
