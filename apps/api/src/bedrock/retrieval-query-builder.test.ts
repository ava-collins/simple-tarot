import { describe, expect, it } from 'vitest';
import { composeReadingContext } from '../composer/compose-reading';
import {
    sanitizedCelticCrossRequest,
    sanitizedComposerBundle,
    sanitizedSingleCardRequest
} from '../composer/test-fixture';
import { buildRetrievalQuery } from './retrieval-query-builder';

describe('buildRetrievalQuery', () => {
    it('renders user intent, whole-spread facts, then named-position facts', () => {
        const request = {
            ...sanitizedCelticCrossRequest,
            question: '  How should I respond?  '
        };
        const context = composeReadingContext(request, sanitizedComposerBundle);

        expect(buildRetrievalQuery(request, context)).toBe(
            [
                'User intent: How should I respond?',
                'Whole-spread themes:',
                ...context.wholeSpreadResults.map(result => `- ${result.fact}`),
                'Named-position themes:',
                ...context.namedPairResults.map(result => `- ${result.fact}`)
            ].join('\n')
        );
    });

    it('uses general intent and omits empty relationship sections', () => {
        const request = {
            ...sanitizedSingleCardRequest,
            question: '   '
        };
        const context = composeReadingContext(request, sanitizedComposerBundle);

        expect(buildRetrievalQuery(request, context)).toBe(
            'User intent: General tarot reading.'
        );
    });

    it('does not render structural rule or support identifiers', () => {
        const context = composeReadingContext(
            sanitizedCelticCrossRequest,
            sanitizedComposerBundle
        );
        const query = buildRetrievalQuery(sanitizedCelticCrossRequest, context);

        for (const result of [
            ...context.wholeSpreadResults,
            ...context.namedPairResults
        ]) {
            expect(query).not.toContain(result.ruleId);
            for (const support of result.supports) {
                expect(query).not.toContain(support.cardId);
            }
        }
    });
});
