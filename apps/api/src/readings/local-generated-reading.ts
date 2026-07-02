import { GeneratedReading, ReadingRequest } from './contracts';

export const LOCAL_READING_FAILURE_QUESTION = '__simple_tarot_local_failure__';

export class LocalReadingGenerationError extends Error {
    readonly code = 'LOCAL_READING_GENERATION_FAILED';
    readonly status = 500;

    constructor() {
        super('Local reading generation failed for test flow.');
        this.name = 'LocalReadingGenerationError';
    }
}

const orientationFor = (reversed: boolean): string => (reversed ? 'reversed' : 'upright');

const positionLineFor = (item: ReadingRequest['items'][number]): string =>
    `${item.position}: ${item.cardName} ${orientationFor(
        item.reversed
    )} highlights a simple next step.`;

const progressionLineFor = (item: ReadingRequest['items'][number]): string =>
    `${item.position}: ${item.cardName} ${orientationFor(
        item.reversed
    )} ${item.reversed ? 'asks for careful attention' : 'marks the starting pattern'}.`;

const citationFor = (variant: 'local-test-variant-1' | 'local-test-variant-2') => ({
    metadata: {
        mode: 'local',
        variant
    },
    sourceId: variant,
    text:
        variant === 'local-test-variant-1'
            ? 'Deterministic local single-card fixture for API flow tests.'
            : 'Deterministic local multi-card fixture for API flow tests.'
});

const singleCardReading = (request: ReadingRequest): GeneratedReading => ({
    citations: [citationFor('local-test-variant-1')],
    modelId: 'local-test-variant-1',
    text: [
        'Local test reading variant 1: one clear card anchors the moment.',
        ...request.items.map(positionLineFor)
    ].join('\n')
});

const multiCardReading = (request: ReadingRequest): GeneratedReading => ({
    citations: [citationFor('local-test-variant-2')],
    modelId: 'local-test-variant-2',
    text: [
        'Local test reading variant 2: the cards form a short progression.',
        ...request.items.map(progressionLineFor)
    ].join('\n')
});

export const createLocalGeneratedReading = (
    request: ReadingRequest
): GeneratedReading => {
    if (request.question === LOCAL_READING_FAILURE_QUESTION) {
        throw new LocalReadingGenerationError();
    }

    return request.items.length === 1 ? singleCardReading(request) : multiCardReading(request);
};
