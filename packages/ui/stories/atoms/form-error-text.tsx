import { StyleSheet, Text } from 'react-native';

import type { FormError } from '@simpletarot/hooks';
import React from 'react';

export interface ErrorProp {
    error: FormError | false;
}

const styles = StyleSheet.create({
    errorText: {
        fontSize: 18,
        marginTop: 10,
        marginBottom: 20,
        color: 'red'
    }
});

const FormErrorText: React.FC<ErrorProp> = ({ error }) => (
    <Text style={styles.errorText}>{error && error?.message}</Text>
);

export default FormErrorText;
