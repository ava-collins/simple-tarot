export class BedrockRetrievalUnavailableError extends Error {
    readonly code = 'BEDROCK_RETRIEVAL_UNAVAILABLE';
    readonly retryable = true;
    readonly status = 503;

    constructor(options?: ErrorOptions) {
        super('Tarot reading themes are temporarily unavailable.', options);
        this.name = 'BedrockRetrievalUnavailableError';
    }
}

export class BedrockGenerationUnavailableError extends Error {
    readonly code = 'BEDROCK_GENERATION_UNAVAILABLE';
    readonly retryable = true;
    readonly status = 503;

    constructor(options?: ErrorOptions) {
        super('Tarot reading generation is temporarily unavailable.', options);
        this.name = 'BedrockGenerationUnavailableError';
    }
}

export class BedrockThrottledError extends Error {
    constructor() {
        super('Bedrock request throttled.');
        this.name = 'ThrottlingException';
    }
}
