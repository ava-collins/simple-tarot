import { describe, expect, it } from 'vitest';
import { composeCardContexts, positionMeaningKeyFor } from './card-composer';
import { normalizeComposerRequest } from './reading-normalizer';
import {
    sanitizedCelticCrossRequest,
    sanitizedComposerBundle,
    sanitizedSingleCardRequest
} from './test-fixture';

describe('composeCardContexts', () => {
    it('composes canonical single-card context without a canonical position or exact meaning', () => {
        const normalized = normalizeComposerRequest(
            sanitizedSingleCardRequest,
            sanitizedComposerBundle
        );

        expect(composeCardContexts(normalized, sanitizedComposerBundle)).toEqual([
            {
                cardId: 'dawn-keeper',
                cardIndex: 0,
                cardName: 'Dawn Keeper',
                title: 'The First Lantern',
                arcana: 'major',
                description: 'A traveler notices a new horizon.',
                orientation: 'upright',
                orientationKeywords: ['beginning', 'wonder'],
                presentationPosition: 'guidance',
                themes: [
                    {
                        id: 'ember-theme-a',
                        polarity: 'reinforcing',
                        theme: 'Warmth gathers around deliberate action.'
                    },
                    {
                        id: 'lantern-theme-b',
                        polarity: 'contextual',
                        theme:
                            'A visible signal makes the next step easier to choose.'
                    }
                ]
            }
        ]);
    });

    it('adds position lenses, orientation keywords, and matching approved exact meanings', () => {
        const normalized = normalizeComposerRequest(
            sanitizedCelticCrossRequest,
            sanitizedComposerBundle
        );
        const contexts = composeCardContexts(normalized, sanitizedComposerBundle);

        expect(contexts[0]).toMatchObject({
            cardId: 'dawn-keeper',
            exactMeaning: 'A new possibility is already present.',
            orientation: 'upright',
            orientationKeywords: ['beginning', 'wonder'],
            position: { id: 'origin', order: 0 }
        });
        expect(contexts[1]).toMatchObject({
            cardId: 'tide-weaver',
            exactMeaning: 'Resistance slows the available response.',
            orientation: 'reversed',
            orientationKeywords: ['stagnation', 'resistance'],
            position: { id: 'response', order: 1 }
        });
        expect(contexts[2]).not.toHaveProperty('exactMeaning');
    });

    it('orders matching themes by card subject order then theme id and caps at two', () => {
        const bundle = structuredClone(sanitizedComposerBundle);
        bundle.approvedThemeFragments.push(
            {
                id: 'ember-theme-0',
                kind: 'correspondence-theme',
                subjects: [{ id: 'ember', type: 'element' }],
                theme: 'The earliest matching subject wins before lexical ties.',
                when: { eq: [{ field: 'card.element' }, 'ember'] },
                polarity: 'contextual',
                status: 'approved',
                sourceIds: ['invented-source']
            },
            {
                id: 'non-matching-theme',
                kind: 'correspondence-theme',
                subjects: [{ id: 'ember', type: 'element' }],
                theme: 'This predicate does not match.',
                when: { eq: [{ field: 'card.orientation' }, 'reversed'] },
                polarity: 'challenging',
                status: 'approved',
                sourceIds: ['invented-source']
            }
        );
        const normalized = normalizeComposerRequest(sanitizedSingleCardRequest, bundle);

        expect(composeCardContexts(normalized, bundle)[0]?.themes.map(theme => theme.id)).toEqual(
            ['ember-theme-0', 'ember-theme-a']
        );
    });

    it('omits an exact meaning whose stored fields disagree with its key', () => {
        const bundle = structuredClone(sanitizedComposerBundle);
        bundle.legacyPositionMeaningsByKey[
            'celtic-cross:origin:dawn-keeper:upright'
        ].cardId = 'tide-weaver';
        const normalized = normalizeComposerRequest(sanitizedCelticCrossRequest, bundle);

        expect(composeCardContexts(normalized, bundle)[0]).not.toHaveProperty(
            'exactMeaning'
        );
    });
});

describe('positionMeaningKeyFor', () => {
    it('builds the stable exact-meaning lookup key', () => {
        expect(
            positionMeaningKeyFor(
                'celtic-cross',
                'origin',
                'dawn-keeper',
                'upright'
            )
        ).toBe('celtic-cross:origin:dawn-keeper:upright');
    });
});
