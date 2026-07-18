import {
    MAX_NAMED_PAIR_RESULTS,
    MAX_WHOLE_SPREAD_RESULTS
} from './constants';
import {
    ComposerBundle,
    NormalizedComposerCard,
    NormalizedComposerRequest,
    RelationshipResult,
    RelationshipRule,
    RelationshipSupport,
    SubjectKind
} from './contracts';

type RelationshipCollections = {
    namedPairResults: RelationshipResult[];
    wholeSpreadResults: RelationshipResult[];
};

const stableResultId = (ruleId: string, qualifier?: string): string =>
    qualifier ? `${ruleId}:${qualifier}` : ruleId;

const byPriorityThenId = (
    left: RelationshipResult,
    right: RelationshipResult
): number => right.priority - left.priority || left.id.localeCompare(right.id);

const supportFor = (item: NormalizedComposerCard): RelationshipSupport => ({
    cardId: item.card.id,
    ...(item.position ? { positionId: item.position.id } : {})
});

const resultFor = (
    rule: RelationshipRule,
    supports: NormalizedComposerCard[],
    qualifier?: string
): RelationshipResult => ({
    id: stableResultId(rule.id, qualifier),
    ruleId: rule.id,
    priority: rule.priority,
    fact: rule.fact,
    supports: supports.map(supportFor)
});

const groupedByCorrespondence = (
    cards: NormalizedComposerCard[],
    kind: SubjectKind,
    bundle: ComposerBundle
): Map<string, NormalizedComposerCard[]> => {
    const groups = new Map<string, NormalizedComposerCard[]>();

    for (const item of cards) {
        for (const correspondenceId of item.card.correspondenceIds) {
            if (bundle.correspondencesById[correspondenceId]?.kind !== kind) {
                continue;
            }

            const group = groups.get(correspondenceId) ?? [];
            group.push(item);
            groups.set(correspondenceId, group);
        }
    }

    return groups;
};

const namedPairResultsFor = (
    normalized: NormalizedComposerRequest,
    bundle: ComposerBundle
): RelationshipResult[] => {
    if (!normalized.spread) {
        return [];
    }

    const cardsByPosition = new Map(
        normalized.cards.flatMap(card =>
            card.position ? [[card.position.id, card] as const] : []
        )
    );

    return bundle.relationshipRules
        .flatMap(rule => {
            if (
                rule.scope !== 'named-pair' ||
                rule.ruleType !== 'named-position-edge' ||
                rule.condition.type !== 'named-position-edge'
            ) {
                return [];
            }
            const { condition } = rule;

            const edge = normalized.spread?.narrativeEdges.find(
                candidate => candidate.id === condition.edgeId
            );
            if (!edge) {
                return [];
            }

            const from = cardsByPosition.get(edge.fromPositionId);
            const to = cardsByPosition.get(edge.toPositionId);

            return from && to ? [resultFor(rule, [from, to], edge.id)] : [];
        })
        .sort(byPriorityThenId)
        .slice(0, MAX_NAMED_PAIR_RESULTS);
};

const dominanceResultsFor = (
    rule: RelationshipRule,
    normalized: NormalizedComposerRequest,
    bundle: ComposerBundle
): RelationshipResult[] => {
    if (rule.condition.type !== 'dominance') {
        return [];
    }
    const { condition } = rule;

    const expectedRuleType =
        condition.subject === 'element'
            ? 'element-dominance'
            : 'suit-dominance';
    if (rule.ruleType !== expectedRuleType) {
        return [];
    }

    return [...groupedByCorrespondence(
        normalized.cards,
        condition.subject,
        bundle
    ).entries()]
        .filter(([, cards]) => cards.length >= condition.minimumCount)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([value, cards]) => resultFor(rule, cards, value));
};

const majorArcanaResultFor = (
    rule: RelationshipRule,
    normalized: NormalizedComposerRequest
): RelationshipResult[] => {
    if (
        rule.ruleType !== 'major-arcana-weight' ||
        rule.condition.type !== 'major-arcana-weight'
    ) {
        return [];
    }

    const cards = normalized.cards.filter(item => item.card.arcana === 'major');

    return cards.length >= rule.condition.minimumCount
        ? [resultFor(rule, cards)]
        : [];
};

const numberRepetitionResultsFor = (
    rule: RelationshipRule,
    normalized: NormalizedComposerRequest,
    bundle: ComposerBundle
): RelationshipResult[] => {
    if (
        rule.ruleType !== 'number-repetition' ||
        rule.condition.type !== 'number-repetition'
    ) {
        return [];
    }
    const { condition } = rule;

    return [...groupedByCorrespondence(normalized.cards, 'number', bundle).entries()]
        .filter(([, cards]) => cards.length >= condition.minimumCount)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([value, cards]) => resultFor(rule, cards, value));
};

const orientationResultFor = (
    rule: RelationshipRule,
    normalized: NormalizedComposerRequest
): RelationshipResult[] => {
    if (
        rule.ruleType !== 'orientation-balance' ||
        rule.condition.type !== 'orientation-balance'
    ) {
        return [];
    }
    const { condition } = rule;

    const cards = normalized.cards.filter(
        item => item.orientation === condition.orientation
    );

    return cards.length >= condition.minimumCount
        ? [resultFor(rule, cards, condition.orientation)]
        : [];
};

const wholeSpreadResultsFor = (
    normalized: NormalizedComposerRequest,
    bundle: ComposerBundle
): RelationshipResult[] =>
    bundle.relationshipRules
        .flatMap(rule => {
            if (rule.scope !== 'whole-spread') {
                return [];
            }

            switch (rule.ruleType) {
                case 'element-dominance':
                case 'suit-dominance':
                    return dominanceResultsFor(rule, normalized, bundle);
                case 'major-arcana-weight':
                    return majorArcanaResultFor(rule, normalized);
                case 'number-repetition':
                    return numberRepetitionResultsFor(rule, normalized, bundle);
                case 'orientation-balance':
                    return orientationResultFor(rule, normalized);
                case 'named-position-edge':
                    return [];
                default:
                    return [];
            }
        })
        .sort(byPriorityThenId)
        .slice(0, MAX_WHOLE_SPREAD_RESULTS);

export function composeRelationshipResults(
    normalized: NormalizedComposerRequest,
    bundle: ComposerBundle
): RelationshipCollections {
    if (normalized.spreadMode === 'single-card') {
        return {
            namedPairResults: [],
            wholeSpreadResults: []
        };
    }

    return {
        namedPairResults: namedPairResultsFor(normalized, bundle),
        wholeSpreadResults: wholeSpreadResultsFor(normalized, bundle)
    };
}
