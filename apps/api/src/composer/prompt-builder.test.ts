import { describe, expect, it } from 'vitest';
import { composeReadingContext } from './compose-reading';
import { buildComposedReadingPrompt } from './prompt-builder';
import {
    sanitizedCelticCrossRequest,
    sanitizedComposerBundle,
    sanitizedSingleCardRequest
} from './test-fixture';

const sectionIndex = (prompt: string, heading: string): number => {
    const index = prompt.indexOf(heading);
    expect(index).toBeGreaterThanOrEqual(0);

    return index;
};

describe('buildComposedReadingPrompt', () => {
    it('renders controlled text in the approved evidence precedence', () => {
        const request = {
            ...sanitizedCelticCrossRequest,
            question: 'How can I respond thoughtfully?'
        };
        const context = composeReadingContext(request, sanitizedComposerBundle);
        const prompt = buildComposedReadingPrompt(request, context);
        const headings = [
            'Authority:',
            'Reading identity:',
            'Ordered card contexts:',
            'Named positional relationships:',
            'Whole-spread relationships:',
            'User intent:',
            'Response requirements:'
        ];
        const indexes = headings.map(heading => sectionIndex(prompt, heading));

        expect(indexes).toEqual([...indexes].sort((left, right) => left - right));
        expect(prompt).toContain(`Corpus version: ${context.corpusVersion}`);
        expect(prompt).toContain('Spread: celtic-cross');
        expect(prompt).toContain('Exact position meaning: A new possibility is already present.');
        expect(prompt).toContain(
            'The response develops directly from the origin. (Supports: origin, response)'
        );
        expect(prompt).toContain('Question: How can I respond thoughtfully?');
    });

    it('does not serialize private structural fields or JSON', () => {
        const context = composeReadingContext(
            sanitizedCelticCrossRequest,
            sanitizedComposerBundle
        );
        const prompt = buildComposedReadingPrompt(
            sanitizedCelticCrossRequest,
            context
        );

        for (const privateValue of [
            'edge-rule',
            'element-rule',
            'invented-source',
            'ruleId',
            'sourceIds'
        ]) {
            expect(prompt).not.toContain(privateValue);
        }
        expect(prompt).not.toMatch(/[{}\[\]"]/);
    });

    it('omits empty relationship sections for single-card context', () => {
        const context = composeReadingContext(
            sanitizedSingleCardRequest,
            sanitizedComposerBundle
        );
        const prompt = buildComposedReadingPrompt(sanitizedSingleCardRequest, context);

        expect(prompt).not.toContain('Named positional relationships:');
        expect(prompt).not.toContain('Whole-spread relationships:');
        expect(prompt).toContain('Question: General reading.');
    });

    it('returns identical text for identical request and context', () => {
        const context = composeReadingContext(
            sanitizedCelticCrossRequest,
            sanitizedComposerBundle
        );

        expect(
            buildComposedReadingPrompt(sanitizedCelticCrossRequest, context)
        ).toBe(buildComposedReadingPrompt(sanitizedCelticCrossRequest, context));
    });
});
