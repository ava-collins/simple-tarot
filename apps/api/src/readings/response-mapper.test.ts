import { describe, expect, it } from 'vitest';
import { mapGeneratedReadingResponse } from './response-mapper';

describe('mapGeneratedReadingResponse', () => {
    it('maps generated text, citations, and request items into the API response shape', () => {
        const response = mapGeneratedReadingResponse(
            {
                spread: 'celtic_cross',
                items: [
                    {
                        cardIndex: 0,
                        cardName: 'The Fool',
                        position: 'situation',
                        reversed: false
                    },
                    {
                        cardIndex: 1,
                        cardName: 'The Magician',
                        position: 'challenge',
                        reversed: true
                    }
                ],
                question: 'What energy should I pay attention to?'
            },
            {
                text: [
                    'The reading asks you to notice beginnings and agency.',
                    '',
                    'Situation: The Fool opens a fresh path.',
                    'Challenge: The Magician reversed asks you to use skill honestly.'
                ].join('\n'),
                citations: [
                    {
                        sourceId: 'card-fool-celtic-cross-situation-upright',
                        text: 'A new opening is available.',
                        metadata: {
                            cardName: 'The Fool',
                            orientation: 'upright',
                            position: 'situation',
                            spread: 'celtic_cross'
                        }
                    }
                ],
                mode: 'local',
                modelId: 'placeholder-local-model'
            }
        );

        expect(response).toEqual({
            readingId: 'local-celtic_cross-0-1',
            spread: 'celtic_cross',
            summary: 'The reading asks you to notice beginnings and agency.',
            positions: [
                {
                    cardIndex: 0,
                    cardName: 'The Fool',
                    position: 'situation',
                    reversed: false,
                    text: 'Situation: The Fool opens a fresh path.'
                },
                {
                    cardIndex: 1,
                    cardName: 'The Magician',
                    position: 'challenge',
                    reversed: true,
                    text: 'Challenge: The Magician reversed asks you to use skill honestly.'
                }
            ],
            citations: [
                {
                    sourceId: 'card-fool-celtic-cross-situation-upright',
                    text: 'A new opening is available.',
                    metadata: {
                        cardName: 'The Fool',
                        orientation: 'upright',
                        position: 'situation',
                        spread: 'celtic_cross'
                    }
                }
            ],
            metadata: {
                itemCount: 2,
                mode: 'local',
                modelId: 'placeholder-local-model'
            }
        });
    });

    it('labels Bedrock responses and IDs from the generated mode', () => {
        const response = mapGeneratedReadingResponse(
            {
                items: [
                    {
                        cardIndex: 0,
                        cardName: 'The Star',
                        position: 'guidance',
                        reversed: false
                    }
                ],
                spread: 'single_card'
            },
            {
                citations: [],
                mode: 'bedrock',
                modelId:
                    'arn:aws:bedrock:us-east-2:123456789012:application-inference-profile/profile-id',
                text: [
                    'Trust the wider pattern.',
                    'guidance: The Star restores perspective.'
                ].join('\n')
            }
        );

        expect(response.readingId).toBe('bedrock-single_card-0');
        expect(response.metadata).toEqual({
            itemCount: 1,
            mode: 'bedrock',
            modelId:
                'arn:aws:bedrock:us-east-2:123456789012:application-inference-profile/profile-id'
        });
    });
});
