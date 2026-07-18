import { describe, expect, it } from 'vitest';
import { validateReadingRequest } from './validation';

describe('validateReadingRequest', () => {
    it('returns a typed reading request for valid input', () => {
        const result = validateReadingRequest({
            spread: 'celtic_cross',
            items: [
                {
                    cardIndex: 0,
                    cardName: 'Fool',
                    position: 'situation',
                    reversed: false
                }
            ],
            question: 'What should I understand right now?'
        });

        expect(result).toEqual({
            ok: true,
            value: {
                spread: 'celtic_cross',
                items: [
                    {
                        cardIndex: 0,
                        cardName: 'Fool',
                        position: 'situation',
                        reversed: false
                    }
                ],
                question: 'What should I understand right now?'
            }
        });
    });

    it('returns validation errors when required reading fields are missing', () => {
        const result = validateReadingRequest({
            spread: '',
            items: [
                {
                    cardIndex: '0',
                    cardName: '',
                    position: '',
                    reversed: 'false'
                }
            ],
            question: 42
        });

        expect(result).toEqual({
            ok: false,
            errors: [
                'spread must be a non-empty string',
                'items[0].cardIndex must be a number',
                'items[0].cardName must be a non-empty string',
                'items[0].position must be a non-empty string',
                'items[0].reversed must be a boolean',
                'question must be a string when provided'
            ]
        });
    });

    it('requires at least one reading item', () => {
        const result = validateReadingRequest({
            spread: 'celtic_cross',
            items: []
        });

        expect(result).toEqual({
            ok: false,
            errors: ['items must include at least one card']
        });
    });
});
