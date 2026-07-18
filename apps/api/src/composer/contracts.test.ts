import { describe, expect, it } from 'vitest';
import { ComposerDomainError, ComposerUnavailableError } from './errors';
import { sanitizedComposerBundle } from './test-fixture';

describe('composer public contract', () => {
    it('uses a sanitized schema-one fixture without real tarot corpus content', () => {
        expect(sanitizedComposerBundle.schemaVersion).toBe(1);
        expect(sanitizedComposerBundle.corpusVersion).toMatch(/^[a-f0-9]{64}$/);
        expect(JSON.stringify(sanitizedComposerBundle)).not.toMatch(
            /Fool|Celtic|Wands/
        );
    });

    it('exposes stable safe domain errors', () => {
        const error = new ComposerDomainError('INVALID_CARD_SELECTION');

        expect(error).toMatchObject({
            code: 'INVALID_CARD_SELECTION',
            message:
                'The reading selection is not supported by the active tarot corpus.',
            name: 'ComposerDomainError',
            status: 400
        });
    });

    it('exposes retryable safe availability errors without putting the reason in the message', () => {
        const error = new ComposerUnavailableError('INVALID_COMPOSER_ARTIFACT');

        expect(error).toMatchObject({
            code: 'COMPOSER_UNAVAILABLE',
            message: 'Tarot reading context is temporarily unavailable.',
            name: 'ComposerUnavailableError',
            reason: 'INVALID_COMPOSER_ARTIFACT',
            retryable: true,
            status: 503
        });
        expect(error.message).not.toContain(error.reason);
    });
});
