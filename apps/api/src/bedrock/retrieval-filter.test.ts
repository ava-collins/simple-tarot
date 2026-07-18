import { describe, expect, it } from 'vitest';
import { ComposerUnavailableError } from '../composer/errors';
import { activeCorpusFilterFor } from './retrieval-filter';

describe('activeCorpusFilterFor', () => {
    it('requires the exact active approved correspondence-theme corpus version', () => {
        const corpusVersion = 'a'.repeat(64);

        expect(activeCorpusFilterFor(corpusVersion)).toEqual({
            andAll: [
                {
                    equals: {
                        key: 'corpusVersion',
                        value: corpusVersion
                    }
                },
                {
                    equals: {
                        key: 'status',
                        value: 'approved'
                    }
                },
                {
                    equals: {
                        key: 'documentKind',
                        value: 'correspondence-theme'
                    }
                }
            ]
        });
    });

    it.each(['A'.repeat(64), 'a'.repeat(63), 'not-a-version'])(
        'rejects invalid corpus version %s with a safe availability error',
        corpusVersion => {
            expect(() => activeCorpusFilterFor(corpusVersion)).toThrowError(
                ComposerUnavailableError
            );

            try {
                activeCorpusFilterFor(corpusVersion);
            } catch (error) {
                expect(error).toMatchObject({
                    code: 'COMPOSER_UNAVAILABLE',
                    message: 'Tarot reading context is temporarily unavailable.',
                    retryable: true,
                    status: 503
                });
            }
        }
    );
});
