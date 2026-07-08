'use client';

import { errorMessages, validateEmail, validateNewPassword } from './validators';

import type { FormError } from './form-error';
import React from 'react';

interface useSignUpFormProps {
    errors: FormError[];
    handleChange: () => void;
    handleSubmit: (email: string, password: string, confirmPassword: string) => void;
}

const useSignUpForm = (
    submit: (emailAddress: string, password: string) => void
): useSignUpFormProps => {
    const [errors, setErrors] = React.useState<FormError[]>([]);

    const handleChange = () => {
        setErrors([]);
    };

    const handleSubmit = (email: string, password: string, confirmPassword: string) => {
        let valid = true;
        const newErrors: FormError[] = [];

        if (!validateEmail(email)) {
            newErrors.push(errorMessages.INVALID_EMAIL as FormError);
        }

        if (!validateNewPassword(password)) {
            newErrors.push(errorMessages.NEW_PASSWORD_TOO_SHORT as FormError);
        }

        if (password !== confirmPassword) {
            newErrors.push(errorMessages.PASSWORD_MISMATCH as FormError);
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

export default useSignUpForm;
