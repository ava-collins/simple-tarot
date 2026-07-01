import { describe, expect, it } from 'vitest';
import { buildReadingPrompt } from './prompt-builder';

describe('buildReadingPrompt', () => {
    it('builds a grounded retrieval prompt from the ordered reading request', () => {
        const prompt = buildReadingPrompt({
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
        });

        expect(prompt).toContain('Generate a tarot reading grounded only in retrieved corpus context.');
        expect(prompt).toContain('Spread: celtic_cross');
        expect(prompt).toContain('User question: What energy should I pay attention to?');
        expect(prompt).toContain('1. Card: The Fool | Index: 0 | Position: situation | Orientation: upright');
        expect(prompt).toContain('2. Card: The Magician | Index: 1 | Position: challenge | Orientation: reversed');
        expect(prompt).toContain('Respect each card position and upright/reversed orientation.');
        expect(prompt).toContain('Return an overall summary and one interpretation per ordered card.');
        expect(prompt).toContain('Do not invent source material that is not present in retrieved context.');
    });

    it('uses a neutral question line when no user question is provided', () => {
        const prompt = buildReadingPrompt({
            spread: 'celtic_cross',
            items: [
                {
                    cardIndex: 0,
                    cardName: 'The Fool',
                    position: 'situation',
                    reversed: false
                }
            ]
        });

        expect(prompt).toContain('User question: General reading.');
    });
});
