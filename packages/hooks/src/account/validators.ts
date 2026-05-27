import type { FormError } from './form-error';

export const validateEmail = (email: string) => {
    // This regex checks for:
    // - A valid local part (before the @) that does not contain consecutive dots
    // - A valid domain part (after the @) that does not contain consecutive dots
    // - At least one dot in the domain part
    const re = /^[^\s@.]+(\.[^\s@.]+)*@[^\s@.]+(\.[^\s@.]+)+$/;

    return re.test(email);
};

export const validatePassword = (password: string) => password.length >= 6;

export const errorMessages = {
    INVALID_EMAIL: { message: 'Invalid email address', type: 'emailAddress' },
    PASSWORD_TOO_SHORT: {
        message: 'Password must be at least 6 characters',
        type: 'password'
    },
    PASSWORD_MISMATCH: { message: 'Passwords do not match', type: 'newPassword' }
};
