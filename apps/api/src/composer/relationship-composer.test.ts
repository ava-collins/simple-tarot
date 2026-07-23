import { describe, expect, it } from 'vitest';
import { RelationshipRule, RelationshipRuleType } from './contracts';
import { normalizeComposerRequest } from './reading-normalizer';
import { composeRelationshipResults } from './relationship-composer';
import {
    sanitizedCelticCrossRequest,
    sanitizedComposerBundle,
    sanitizedComposerBundleV2,
    sanitizedSingleCardRequest
} from './test-fixture';

const normalizedCelticCross = () =>
    normalizeComposerRequest(sanitizedCelticCrossRequest, sanitizedComposerBundle);

const onlyRule = (ruleType: RelationshipRuleType) => {
    const bundle = structuredClone(sanitizedComposerBundle);
    bundle.relationshipRules = bundle.relationshipRules.filter(
        rule => rule.ruleType === ruleType
    );

    return bundle;
};

describe('composeRelationshipResults', () => {
    it('evaluates only rules for declared narrative edges with exact supports', () => {
        const results = composeRelationshipResults(
            normalizedCelticCross(),
            onlyRule('named-position-edge')
        );

        expect(results.namedPairResults).toEqual([
            {
                id: 'edge-rule:origin-to-response',
                ruleId: 'edge-rule',
                priority: 80,
                fact: 'The response develops directly from the origin.',
                supports: [
                    { cardId: 'dawn-keeper', positionId: 'origin' },
                    { cardId: 'tide-weaver', positionId: 'response' }
                ]
            }
        ]);
    });

    it('does not evaluate a named-pair rule for an undeclared edge', () => {
        const bundle = onlyRule('named-position-edge');
        const rule = bundle.relationshipRules[0];
        if (!rule || rule.condition.type !== 'named-position-edge') {
            throw new Error('Sanitized named rule is missing.');
        }
        rule.condition.edgeId = 'origin-to-outcome';

        expect(
            composeRelationshipResults(
                normalizeComposerRequest(sanitizedCelticCrossRequest, bundle),
                bundle
            ).namedPairResults
        ).toEqual([]);
    });

    it.each([
        ['element-dominance', 'element-rule:ember', 10],
        ['suit-dominance', 'suit-rule:lantern', 10],
        ['major-arcana-weight', 'major-rule', 5],
        ['number-repetition', 'number-rule:two', 10],
        ['orientation-balance', 'orientation-rule:upright', 7]
    ] as const)(
        'evaluates the allowlisted %s whole-spread calculation',
        (ruleType, expectedId, supportCount) => {
            const bundle = onlyRule(ruleType);
            const normalized = normalizeComposerRequest(
                sanitizedCelticCrossRequest,
                bundle
            );
            const results = composeRelationshipResults(normalized, bundle);

            expect(results.wholeSpreadResults).toHaveLength(1);
            expect(results.wholeSpreadResults[0]).toMatchObject({
                id: expectedId,
                ruleId: bundle.relationshipRules[0]?.id
            });
            expect(results.wholeSpreadResults[0]?.supports).toHaveLength(supportCount);
        }
    );

    it('emits one value-qualified result for each qualifying dominance value', () => {
        const bundle = onlyRule('element-dominance');
        bundle.correspondencesById.mist = {
            id: 'mist',
            kind: 'element',
            name: 'Mist',
            attributes: {},
            sourceIds: ['invented-source']
        };
        for (const card of Object.values(bundle.cardsById)) {
            card.correspondenceIds.push('mist');
        }
        const normalized = normalizeComposerRequest(sanitizedCelticCrossRequest, bundle);

        expect(
            composeRelationshipResults(normalized, bundle).wholeSpreadResults.map(
                result => result.id
            )
        ).toEqual(['element-rule:ember', 'element-rule:mist']);
    });

    it('sorts by descending priority then stable id and applies category caps', () => {
        const bundle = structuredClone(sanitizedComposerBundle);
        const extraNamedRules: RelationshipRule[] = Array.from(
            { length: 5 },
            (_, index) => ({
                id: `edge-extra-${index}`,
                scope: 'named-pair',
                ruleType: 'named-position-edge',
                priority: 80,
                condition: {
                    type: 'named-position-edge',
                    edgeId: 'origin-to-response'
                },
                fact: `Invented edge fact ${index}.`,
                sourceIds: ['invented-source']
            })
        );
        bundle.relationshipRules.push(...extraNamedRules);
        const normalized = normalizeComposerRequest(sanitizedCelticCrossRequest, bundle);
        const results = composeRelationshipResults(normalized, bundle);

        expect(results.namedPairResults.map(result => result.id)).toEqual([
            'edge-extra-0:origin-to-response',
            'edge-extra-1:origin-to-response',
            'edge-extra-2:origin-to-response',
            'edge-extra-3:origin-to-response'
        ]);
        expect(results.wholeSpreadResults.map(result => result.ruleId)).toEqual([
            'element-rule',
            'suit-rule',
            'major-rule'
        ]);
    });

    it('ignores a rule whose type and condition disagree', () => {
        const bundle = onlyRule('element-dominance');
        bundle.relationshipRules[0] = {
            ...bundle.relationshipRules[0],
            condition: { type: 'major-arcana-weight', minimumCount: 1 }
        } as RelationshipRule;
        const normalized = normalizeComposerRequest(sanitizedCelticCrossRequest, bundle);

        expect(composeRelationshipResults(normalized, bundle).wholeSpreadResults).toEqual(
            []
        );
    });

    it('emits no relationships for single-card mode', () => {
        const normalized = normalizeComposerRequest(
            sanitizedSingleCardRequest,
            sanitizedComposerBundle
        );

        expect(
            composeRelationshipResults(normalized, sanitizedComposerBundle)
        ).toEqual({ namedPairResults: [], wholeSpreadResults: [] });
    });

    it('emits no relationships for schema-2 single-card mode', () => {
        const normalized = normalizeComposerRequest(
            sanitizedSingleCardRequest,
            sanitizedComposerBundleV2
        );

        expect(
            composeRelationshipResults(normalized, sanitizedComposerBundleV2)
        ).toEqual({ namedPairResults: [], wholeSpreadResults: [] });
    });
});
