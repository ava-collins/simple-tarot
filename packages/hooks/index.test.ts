import * as HooksIndex from './index';

import { describe, expect, it } from 'vitest';

describe('hooks package exports', () => {
    it('should export useAvatarImage', () => {
        expect(HooksIndex.useAvatarImage).toBeDefined();
        expect(typeof HooksIndex.useAvatarImage).toBe('function');
    });

    it('should export useForgotPasswordForm', () => {
        expect(HooksIndex.useForgotPasswordForm).toBeDefined();
        expect(typeof HooksIndex.useForgotPasswordForm).toBe('function');
    });

    it('should export useInstructions', () => {
        expect(HooksIndex.useInstructions).toBeDefined();
        expect(typeof HooksIndex.useInstructions).toBe('function');
    });

    it('should export useLoginForm', () => {
        expect(HooksIndex.useLoginForm).toBeDefined();
        expect(typeof HooksIndex.useLoginForm).toBe('function');
    });

    it('should export useSignupForm', () => {
        expect(HooksIndex.useSignupForm).toBeDefined();
        expect(typeof HooksIndex.useSignupForm).toBe('function');
    });

    it('should not export useSvgCards', () => {
        expect(HooksIndex).not.toHaveProperty('useSvgCards');
    });

    it('should export AvatarConfig enum', () => {
        expect(HooksIndex.AvatarConfig).toBeDefined();
        expect(HooksIndex.AvatarConfig.DEFAULT_AVATAR_IMAGE).toBeDefined();
        expect(typeof HooksIndex.AvatarConfig.DEFAULT_AVATAR_IMAGE).toBe('string');
    });

    it('should export validator functions', () => {
        expect(HooksIndex.validateEmail).toBeDefined();
        expect(typeof HooksIndex.validateEmail).toBe('function');

        expect(HooksIndex.validatePassword).toBeDefined();
        expect(typeof HooksIndex.validatePassword).toBe('function');
    });

    it('should export errorMessages', () => {
        expect(HooksIndex.errorMessages).toBeDefined();
        expect(HooksIndex.errorMessages.INVALID_EMAIL).toBeDefined();
        expect(HooksIndex.errorMessages.PASSWORD_TOO_SHORT).toBeDefined();
        expect(HooksIndex.errorMessages.PASSWORD_MISMATCH).toBeDefined();
    });

    it('should export type policies', () => {
        expect(HooksIndex.typePolicies).toBeDefined();
        expect(typeof HooksIndex.typePolicies).toBe('object');
    });

    it('should have all expected exports', () => {
        const expectedExports = [
            'useSignupForm',
            'useLoginForm',
            'useAvatarImage',
            'useForgotPasswordForm',
            'AvatarConfig',
            'validateEmail',
            'validatePassword',
            'errorMessages',
            'typePolicies'
        ];

        expectedExports.forEach(exportName => {
            expect(HooksIndex).toHaveProperty(exportName);
        });
    });

    it('should export correct number of items', () => {
        const exportKeys = Object.keys(HooksIndex);
        expect(exportKeys.length).toBeGreaterThan(0);
    });
});
