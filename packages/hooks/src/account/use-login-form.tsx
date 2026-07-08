'use client';

import { errorMessages, validateEmail, validatePassword } from './validators';

import type { FormError } from './form-error';
import React from 'react';

interface useSignUpFormProps {
    errors: FormError[];
    handleChange: () => void;
    handleSubmit: (email: string, password: string) => void;
}

const useLoginForm = (
    submit: (emailAddress: string, password: string) => void
): useSignUpFormProps => {
    const [errors, setErrors] = React.useState<FormError[]>([]);

    const handleChange = () => {
        setErrors([]);
    };

    const handleSubmit = (email: string, password: string) => {
        let valid = true;
        const newErrors: FormError[] = [];

        if (!validateEmail(email)) {
            newErrors.push(errorMessages.INVALID_EMAIL as FormError);
        }

        if (!validatePassword(password)) {
            newErrors.push(errorMessages.PASSWORD_TOO_SHORT as FormError);
        }

        if (newErrors.length > 0) {
            valid = false;
        } else {
            // Clear errors if validation passes
            setErrors(newErrors);
        }

        setErrors(newErrors);

        if (valid) {
            submit(email, password);
        }
    };

    return {
        errors,
        handleChange,
        handleSubmit
    };
};

export default useLoginForm;
