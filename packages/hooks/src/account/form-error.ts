import type { TextInputProps } from 'react-native';

export type FormError = {
    message: string;
    type: TextInputProps['textContentType'];
};
