export type ComposerDomainErrorCode =
    | 'INVALID_CARD_SELECTION'
    | 'INVALID_COMPOSER_SPREAD';

export class ComposerDomainError extends Error {
    readonly status = 400;

    constructor(readonly code: ComposerDomainErrorCode) {
        super('The reading selection is not supported by the active tarot corpus.');
        this.name = 'ComposerDomainError';
    }
}

export class ComposerUnavailableError extends Error {
    readonly code = 'COMPOSER_UNAVAILABLE';
    readonly retryable = true;
    readonly status = 503;

    constructor(readonly reason: string, options?: ErrorOptions) {
        super('Tarot reading context is temporarily unavailable.', options);
        this.name = 'ComposerUnavailableError';
    }
}

