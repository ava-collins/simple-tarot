import { describe, expect, it } from 'vitest';
import {
    LOCAL_READING_FAILURE_QUESTION,
    LocalReadingGenerationError,
    createLocalGeneratedReading
} from './local-generated-reading';
import { ReadingRequest } from './contracts';

const singleCardRequest: ReadingRequest = {
    spread: 'single_card',
    question: 'What should I notice today?',
    items: [
        {
            cardIndex: 0,
            cardName: 'The Star',
            position: 'guidance',
            reversed: false
        }
    ]
};

const multiCardRequest: ReadingRequest = {
    spread: 'past-present-future',
    items: [
        {
            cardIndex: 0,
            cardName: 'The Fool',
            position: 'past',
            reversed: false
        },
        {
            cardIndex: 1,
            cardName: 'The Magician',
            position: 'present',
            reversed: true
        }
    ]
};

describe('createLocalGeneratedReading', () => {
    it('returns deterministic local variant 1 for single-card readings', () => {
        expect(createLocalGeneratedReading(singleCardRequest)).toEqual({
            citations: [
                {
                    metadata: {
                        mode: 'local',
                        variant: 'local-test-variant-1'
                    },
                    sourceId: 'local-test-variant-1',
                    text: 'Deterministic local single-card fixture for API flow tests.'
                }
            ],
            modelId: 'local-test-variant-1',
            text: [
                'Local test reading variant 1: one clear card anchors the moment.',
                'guidance: The Star upright highlights a simple next step.'
            ].join('\n')
        });
    });

    it('returns deterministic local variant 2 for multi-card readings', () => {
        expect(createLocalGeneratedReading(multiCardRequest)).toEqual({
            citations: [
                {
                    metadata: {
                        mode: 'local',
                        variant: 'local-test-variant-2'
                    },
                    sourceId: 'local-test-variant-2',
                    text: 'Deterministic local multi-card fixture for API flow tests.'
                }
            ],
            modelId: 'local-test-variant-2',
            text: [
                'Local test reading variant 2: the cards form a short progression.',
                'past: The Fool upright marks the starting pattern.',
                'present: The Magician reversed asks for careful attention.'
            ].join('\n')
        });
    });

    it('throws a sanitized local generation error for the test-only failure trigger', () => {
        expect(() =>
            createLocalGeneratedReading({
                ...singleCardRequest,
                question: LOCAL_READING_FAILURE_QUESTION
            })
        ).toThrow(LocalReadingGenerationError);
    });
});
