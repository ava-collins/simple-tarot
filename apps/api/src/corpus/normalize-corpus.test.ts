import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { normalizeFirestoreCorpus, writeNormalizedCorpus } from './normalize-corpus';

const fixture = {
    __collections__: {
        cards: {
            'The Fool': {
                description: 'A traveler begins a new path.',
                index: 0,
                keywords: 'beginnings, innocence',
                reversedKeywords: 'recklessness, hesitation',
                title: 'The Fool',
                type: 'major',
                celtic_cross: {
                    upright: {
                        situation: 'A new opening is available.'
                    },
                    reversed: {
                        challenge: 'Impulsiveness clouds the next step.'
                    }
                },
                __collections__: {}
            }
        }
    }
};

describe('normalizeFirestoreCorpus', () => {
    it('creates a card-level context document with card metadata', () => {
        const documents = normalizeFirestoreCorpus(fixture);

        expect(documents).toContainEqual({
            id: 'card-the-fool-context',
            kind: 'card-context',
            text: [
                'Card: The Fool',
                'Title: The Fool',
                'Type: major',
                'Description: A traveler begins a new path.',
                'Upright keywords: beginnings, innocence',
                'Reversed keywords: recklessness, hesitation'
            ].join('\n'),
            metadata: {
                cardIndex: 0,
                cardName: 'The Fool',
                keywords: ['beginnings', 'innocence'],
                orientation: 'general',
                position: 'general',
                sourceCollection: 'cards',
                sourcePath: 'cards/The Fool',
                spread: 'general'
            }
        });
    });

    it('creates upright and reversed celtic cross documents', () => {
        const documents = normalizeFirestoreCorpus(fixture);

        expect(documents).toContainEqual({
            id: 'card-the-fool-celtic-cross-situation-upright',
            kind: 'position-meaning',
            text: [
                'Spread: celtic_cross',
                'Position: situation',
                'Card: The Fool',
                'Orientation: upright',
                'Meaning: A new opening is available.',
                'Keywords: beginnings, innocence'
            ].join('\n'),
            metadata: {
                cardIndex: 0,
                cardName: 'The Fool',
                keywords: ['beginnings', 'innocence'],
                orientation: 'upright',
                position: 'situation',
                sourceCollection: 'cards',
                sourcePath: 'cards/The Fool/celtic_cross/upright/situation',
                spread: 'celtic_cross'
            }
        });

        expect(documents).toContainEqual({
            id: 'card-the-fool-celtic-cross-challenge-reversed',
            kind: 'position-meaning',
            text: [
                'Spread: celtic_cross',
                'Position: challenge',
                'Card: The Fool',
                'Orientation: reversed',
                'Meaning: Impulsiveness clouds the next step.',
                'Keywords: recklessness, hesitation'
            ].join('\n'),
            metadata: {
                cardIndex: 0,
                cardName: 'The Fool',
                keywords: ['recklessness', 'hesitation'],
                orientation: 'reversed',
                position: 'challenge',
                sourceCollection: 'cards',
                sourcePath: 'cards/The Fool/celtic_cross/reversed/challenge',
                spread: 'celtic_cross'
            }
        });
    });
});

describe('writeNormalizedCorpus', () => {
    it('writes deterministic jsonl output', () => {
        const outputDir = mkdtempSync(join(tmpdir(), 'simple-tarot-corpus-'));
        const outputPath = writeNormalizedCorpus(normalizeFirestoreCorpus(fixture), outputDir);
        const lines = readFileSync(outputPath, 'utf8').trim().split('\n');

        expect(outputPath.endsWith('tarot-corpus.jsonl')).toBe(true);
        expect(lines).toHaveLength(3);
        expect(JSON.parse(lines[0] as string).id).toBe('card-the-fool-context');
    });
});
