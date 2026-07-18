import { describe, expect, it } from 'vitest';
import {
    ComposerDomainError,
    ComposerUnavailableError
} from './composer/errors';
import {
    BedrockGenerationUnavailableError,
    BedrockRetrievalUnavailableError,
    BedrockThrottledError
} from './bedrock/errors';
import { toApiError } from './errors';

describe('toApiError', () => {
    it('maps unauthorized errors to a generic 401 response', () => {
        const error = Object.assign(new Error('token details should not leak'), {
            name: 'UnauthorizedError',
            status: 401
        });

        expect(toApiError(error)).toEqual({
            status: 401,
            body: {
                code: 'UNAUTHORIZED',
                message: 'Authentication is required.'
            }
        });
    });

    it('maps Bedrock throttling errors to a retryable 429 response', () => {
        const error = Object.assign(new Error('Your request rate is too high.'), {
            name: 'ThrottlingException'
        });

        expect(toApiError(error)).toEqual({
            status: 429,
            body: {
                code: 'BEDROCK_THROTTLED',
                message:
                    'Bedrock is throttling reading generation. Wait a moment and retry the request.'
            }
        });
    });

    it('maps the safe Bedrock throttling boundary error to the existing 429 response', () => {
        const error = new BedrockThrottledError();
        const mapped = toApiError(error);

        expect(mapped).toEqual({
            status: 429,
            body: {
                code: 'BEDROCK_THROTTLED',
                message:
                    'Bedrock is throttling reading generation. Wait a moment and retry the request.'
            }
        });
        expect(JSON.stringify({ error: mapped })).not.toContain(
            'private-throttling-marker'
        );
    });

    it('maps retrieval boundary failures to a safe retryable 503 response', () => {
        const mapped = toApiError(
            new BedrockRetrievalUnavailableError({
                cause: new Error('private-retrieval-marker')
            })
        );

        expect(mapped).toEqual({
            status: 503,
            body: {
                code: 'BEDROCK_RETRIEVAL_UNAVAILABLE',
                message: 'Tarot reading themes are temporarily unavailable.',
                retryable: true
            }
        });
        expect(JSON.stringify(mapped)).not.toContain('private-retrieval-marker');
    });

    it('maps generation boundary failures to a safe retryable 503 response', () => {
        const mapped = toApiError(
            new BedrockGenerationUnavailableError({
                cause: new Error('private-generation-marker')
            })
        );

        expect(mapped).toEqual({
            status: 503,
            body: {
                code: 'BEDROCK_GENERATION_UNAVAILABLE',
                message: 'Tarot reading generation is temporarily unavailable.',
                retryable: true
            }
        });
        expect(JSON.stringify(mapped)).not.toContain('private-generation-marker');
    });

    it('maps unknown errors to a generic 500 response', () => {
        expect(toApiError(new Error('boom'))).toEqual({
            status: 500,
            body: {
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Unexpected API error.'
            }
        });
    });

    it('maps composer domain errors to a safe 400 response', () => {
        expect(toApiError(new ComposerDomainError('INVALID_CARD_SELECTION'))).toEqual({
            status: 400,
            body: {
                code: 'INVALID_COMPOSER_REQUEST',
                message:
                    'The reading selection is not supported by the active tarot corpus.'
            }
        });
    });

    it('maps composer availability errors to a safe retryable 503 response', () => {
        const mapped = toApiError(
            new ComposerUnavailableError('PRIVATE_REASON_MARKER', {
                cause: new Error('private-object-key-marker')
            })
        );

        expect(mapped).toEqual({
            status: 503,
            body: {
                code: 'COMPOSER_UNAVAILABLE',
                message: 'Tarot reading context is temporarily unavailable.',
                retryable: true
            }
        });
        expect(JSON.stringify(mapped)).not.toMatch(
            /PRIVATE_REASON_MARKER|private-object-key-marker/
        );
    });
});
