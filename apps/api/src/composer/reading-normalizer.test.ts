import { describe, expect, it } from 'vitest';
import { ReadingRequest } from '../readings/contracts';
import { ComposerUnavailableError } from './errors';
import { normalizeComposerRequest } from './reading-normalizer';
import {
    sanitizedCelticCrossRequest,
    sanitizedComposerBundle,
    sanitizedSingleCardRequest
} from './test-fixture';

describe('normalizeComposerRequest', () => {
    it('normalizes one single card while keeping its presentation position non-canonical', () => {
        const normalized = normalizeComposerRequest(
            sanitizedSingleCardRequest,
            sanitizedComposerBundle
        );

        expect(normalized).toEqual({
            spreadMode: 'single-card',
            cards: [
                {
                    card: sanitizedComposerBundle.cardsById['dawn-keeper'],
                    orientation: 'upright',
                    presentationPosition: 'guidance'
                }
            ]
        });
    });

    it('normalizes ten Celtic Cross items in the bundle position order', () => {
        const normalized = normalizeComposerRequest(
            sanitizedCelticCrossRequest,
            sanitizedComposerBundle
        );

        expect(normalized.spreadMode).toBe('celtic-cross');
        expect(normalized.spread?.id).toBe('celtic-cross');
        expect(normalized.cards).toHaveLength(10);
        expect(normalized.cards.map(card => card.position?.id)).toEqual(
            sanitizedCelticCrossRequest.items.map(item => item.position)
        );
        expect(normalized.cards[1]?.orientation).toBe('reversed');
    });

    it.each([
        {
            name: 'unsupported spread',
            request: { ...sanitizedSingleCardRequest, spread: 'unknown' },
            code: 'INVALID_COMPOSER_SPREAD'
        },
        {
            name: 'single-card item count',
            request: {
                ...sanitizedSingleCardRequest,
                items: [
                    ...sanitizedSingleCardRequest.items,
                    ...sanitizedSingleCardRequest.items
                ]
            },
            code: 'INVALID_COMPOSER_SPREAD'
        },
        {
            name: 'unknown card index',
            request: {
                ...sanitizedSingleCardRequest,
                items: [{ ...sanitizedSingleCardRequest.items[0], cardIndex: 99 }]
            },
            code: 'INVALID_CARD_SELECTION'
        },
        {
            name: 'card name mismatch',
            request: {
                ...sanitizedSingleCardRequest,
                items: [
                    { ...sanitizedSingleCardRequest.items[0], cardName: 'Wrong Name' }
                ]
            },
            code: 'INVALID_CARD_SELECTION'
        },
        {
            name: 'missing Celtic Cross item',
            request: {
                ...sanitizedCelticCrossRequest,
                items: sanitizedCelticCrossRequest.items.slice(0, 9)
            },
            code: 'INVALID_COMPOSER_SPREAD'
        },
        {
            name: 'out-of-order Celtic Cross position',
            request: {
                ...sanitizedCelticCrossRequest,
                items: sanitizedCelticCrossRequest.items.map((item, index) =>
                    index === 0 ? { ...item, position: 'response' } : item
                )
            },
            code: 'INVALID_COMPOSER_SPREAD'
        }
    ])('rejects $name with a safe domain error', ({ request, code }) => {
        expect(() =>
            normalizeComposerRequest(
                request as ReadingRequest,
                sanitizedComposerBundle
            )
        ).toThrow(expect.objectContaining({ code, status: 400 }));
    });

    it('rejects an incompatible spread definition as unavailable', () => {
        const bundle = structuredClone(sanitizedComposerBundle);
        bundle.spreadsById['celtic-cross'].positions[9].order = 8;

        expect(() =>
            normalizeComposerRequest(sanitizedCelticCrossRequest, bundle)
        ).toThrow(ComposerUnavailableError);
    });
});
