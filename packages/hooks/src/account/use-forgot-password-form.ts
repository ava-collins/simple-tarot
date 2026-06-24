import { errorMessages, validateEmail } from './validators';

import type { FormError } from './form-error';
import React from 'react';

interface useForgotPasswordFormProps {
    errors: FormError[];
    handleChange: () => void;
    handleSubmit: (email: string) => void;
}

const useForgotPasswordForm = (
    submit: (emailAddress: string) => void
): useForgotPasswordFormProps => {
    const [errors, setErrors] = React.useState<FormError[]>([]);

    const handleChange = () => {
        setErrors([]);
    };

    const handleSubmit = (email: string) => {
        let valid = true;
        const newErrors: FormError[] = [];

        if (!validateEmail(email)) {
            newErrors.push(errorMessages.INVALID_EMAIL as FormError);
        }

        if (newErrors.length > 0) {
            valid = false;
        } else {
            // Clear errors if validation passes
            setErrors(newErrors);
        }

        setErrors(newErrors);

        if (valid) {
            submit(email);
        }
    };

    return {
        errors,
        handleChange,
        handleSubmit
    };
};

export default useForgotPasswordForm;
