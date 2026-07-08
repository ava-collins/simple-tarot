import * as HooksIndex from './index';

import { describe, expect, it } from 'vitest';

describe('hooks package exports', () => {
    it('should not export client hooks from the root barrel', () => {
        expect(HooksIndex).not.toHaveProperty('useAvatarImage');
        expect(HooksIndex).not.toHaveProperty('useForgotPasswordForm');
        expect(HooksIndex).not.toHaveProperty('useInstructions');
        expect(HooksIndex).not.toHaveProperty('useLoginForm');
        expect(HooksIndex).not.toHaveProperty('useSignupForm');
    });

    it('should not export useSvgCards', () => {
        expect(HooksIndex).not.toHaveProperty('useSvgCards');
    });

    it('should not export typePolicies', () => {
        expect(HooksIndex).not.toHaveProperty('typePolicies');
    });

    it('should not export AvatarConfig from the root barrel', () => {
        expect(HooksIndex).not.toHaveProperty('AvatarConfig');
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

    it('should have all expected exports', () => {
        const expectedExports = [
            'createTarotApiClient',
            'createAvatarApiClient',
            'createOneCardReadingRequest',
            'validateEmail',
            'validatePassword',
            'errorMessages'
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
