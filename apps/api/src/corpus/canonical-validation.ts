import {
    CanonicalCorpus,
    CorpusPredicate,
    RelationshipRule,
    ThemeFragment
} from './canonical-types';
import {
    CANONICAL_SCHEMA_VERSION,
    RELATIONSHIP_SCOPES,
    SUPPORTED_PREDICATE_OPERATORS,
    THEME_STATUSES
} from './corpus-constants';

export type ValidationIssueCode =
    | 'duplicate_id'
    | 'invalid_editorial_status'
    | 'invalid_narrative_edge'
    | 'invalid_predicate_field'
    | 'invalid_reference'
    | 'invalid_relationship_condition'
    | 'invalid_schema_version'
    | 'invalid_spread_order'
    | 'invalid_structure'
    | 'missing_optional_correspondence'
    | 'missing_optional_theme'
    | 'unsupported_predicate_operator';

export type ValidationIssue = {
    code: ValidationIssueCode;
    path: string;
    message: string;
};

export type ValidationResult<T> =
    | { ok: true; value: T; warnings: ValidationIssue[] }
    | { ok: false; errors: ValidationIssue[]; warnings: ValidationIssue[] };

const COLLECTION_KEYS = [
    'cards',
    'spreads',
    'correspondences',
    'themeFragments',
    'relationshipRules',
    'legacyPositionMeanings',
    'sources'
] as const;

const ALLOWED_PREDICATE_FIELDS = new Set([
    'card.arcana',
    'card.element',
    'card.id',
    'card.index',
    'card.name',
    'card.number',
    'card.orientation',
    'card.positionId',
    'card.suit',
    'pair.fromPositionId',
    'pair.relationship',
    'pair.toPositionId',
    'reading.question',
    'reading.topicCategory',
    'spread.cardCount',
    'spread.dominantElement',
    'spread.dominantSuit',
    'spread.id',
    'spread.majorArcanaCount',
    'spread.reversedCount',
    'spread.uprightCount'
]);

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

const isNonEmptyString = (value: unknown): value is string =>
    typeof value === 'string' && value.trim().length > 0;

const isStringArray = (value: unknown): value is string[] =>
    Array.isArray(value) && value.every(isNonEmptyString);

const issue = (
    code: ValidationIssueCode,
    path: string,
    message: string
): ValidationIssue => ({ code, path, message });

const sortIssues = (issues: ValidationIssue[]): ValidationIssue[] =>
    issues.sort(
        (left, right) =>
            left.path.localeCompare(right.path) || left.code.localeCompare(right.code)
    );

const pushUniqueIdIssues = (
    items: unknown[],
    path: string,
    errors: ValidationIssue[]
): void => {
    const seen = new Set<string>();

    items.forEach((item, index) => {
        if (!isRecord(item) || !isNonEmptyString(item.id)) {
            errors.push(
                issue('invalid_structure', `${path}.items[${index}].id`, 'ID must be non-empty.')
            );

            return;
        }

        if (seen.has(item.id)) {
            errors.push(
                issue('duplicate_id', `${path}.items[${index}].id`, `Duplicate ID: ${item.id}.`)
            );
        }
        seen.add(item.id);
    });
};

const validatePredicate = (
    value: unknown,
    path: string,
    errors: ValidationIssue[]
): value is CorpusPredicate => {
    if (!isRecord(value)) {
        errors.push(issue('invalid_structure', path, 'Predicate must be an object.'));

        return false;
    }

    const operators = Object.keys(value);
    if (operators.length !== 1) {
        errors.push(
            issue('unsupported_predicate_operator', path, 'Predicate must have one operator.')
        );

        return false;
    }

    const operator = operators[0]!;
    if (!(SUPPORTED_PREDICATE_OPERATORS as readonly string[]).includes(operator)) {
        errors.push(
            issue(
                'unsupported_predicate_operator',
                path,
                `Unsupported predicate operator: ${operator}.`
            )
        );

        return false;
    }

    const operand = value[operator];
    if (operator === 'all' || operator === 'any') {
        if (!Array.isArray(operand)) {
            errors.push(issue('invalid_structure', path, `${operator} must contain an array.`));

            return false;
        }
        operand.forEach((child, index) =>
            validatePredicate(child, `${path}.${operator}[${index}]`, errors)
        );

        return true;
    }

    if (operator === 'not') {
        return validatePredicate(operand, `${path}.not`, errors);
    }

    if (!Array.isArray(operand) || operand.length !== 2 || !isRecord(operand[0])) {
        errors.push(issue('invalid_structure', path, `${operator} has invalid operands.`));

        return false;
    }

    const { field } = operand[0];
    if (!isNonEmptyString(field) || !ALLOWED_PREDICATE_FIELDS.has(field)) {
        errors.push(
            issue('invalid_predicate_field', `${path}.${operator}[0].field`, 'Field is not allowed.')
        );
    }

    const expected = operand[1];
    const expectedIsValid =
        operator === 'eq'
            ? ['string', 'number', 'boolean'].includes(typeof expected)
            : Array.isArray(expected) &&
              expected.every(item => typeof item === 'string' || typeof item === 'number');

    if (!expectedIsValid) {
        errors.push(issue('invalid_structure', `${path}.${operator}[1]`, 'Value is invalid.'));
    }

    return expectedIsValid;
};

const relationshipConditionIsValid = (
    rule: Record<string, unknown>,
    edgeIds: Set<string>
): boolean => {
    if (
        !RELATIONSHIP_SCOPES.includes(
            rule.scope as (typeof RELATIONSHIP_SCOPES)[number]
        ) ||
        !isRecord(rule.condition)
    ) {
        return false;
    }

    const { condition } = rule;
    const minimumCountIsValid =
        Number.isInteger(condition.minimumCount) && Number(condition.minimumCount) > 0;

    switch (rule.ruleType) {
        case 'named-position-edge':
            return (
                rule.scope === 'named-pair' &&
                condition.type === 'named-position-edge' &&
                isNonEmptyString(condition.edgeId) &&
                edgeIds.has(condition.edgeId)
            );
        case 'element-dominance':
            return (
                rule.scope === 'whole-spread' &&
                condition.type === 'dominance' &&
                condition.subject === 'element' &&
                minimumCountIsValid
            );
        case 'suit-dominance':
            return (
                rule.scope === 'whole-spread' &&
                condition.type === 'dominance' &&
                condition.subject === 'suit' &&
                minimumCountIsValid
            );
        case 'major-arcana-weight':
        case 'number-repetition':
        case 'orientation-balance':
            return (
                rule.scope === 'whole-spread' &&
                condition.type === rule.ruleType &&
                minimumCountIsValid &&
                (rule.ruleType !== 'orientation-balance' ||
                    condition.orientation === 'upright' ||
                    condition.orientation === 'reversed')
            );
        default:
            return false;
    }
};

const validateSourceIds = (
    value: unknown,
    path: string,
    sourceIds: Set<string>,
    errors: ValidationIssue[]
): void => {
    if (!isStringArray(value)) {
        errors.push(issue('invalid_structure', path, 'Source IDs must be non-empty strings.'));

        return;
    }

    value.forEach((sourceId, index) => {
        if (!sourceIds.has(sourceId)) {
            errors.push(
                issue('invalid_reference', `${path}[${index}]`, 'Source reference does not resolve.')
            );
        }
    });
};

const validateTheme = (
    theme: Record<string, unknown>,
    index: number,
    cardIds: Set<string>,
    correspondenceIds: Set<string>,
    sourceIds: Set<string>,
    errors: ValidationIssue[]
): void => {
    const path = `themeFragments.items[${index}]`;

    if (!(THEME_STATUSES as readonly unknown[]).includes(theme.status)) {
        errors.push(
            issue('invalid_editorial_status', `${path}.status`, 'Theme status is not allowed.')
        );
    }

    validatePredicate(theme.when, `${path}.when`, errors);

    if (!Array.isArray(theme.subjects)) {
        errors.push(issue('invalid_structure', `${path}.subjects`, 'Subjects must be an array.'));
    } else {
        theme.subjects.forEach((subject, subjectIndex) => {
            const subjectPath = `${path}.subjects[${subjectIndex}]`;
            if (!isRecord(subject) || !isNonEmptyString(subject.id)) {
                errors.push(issue('invalid_structure', subjectPath, 'Subject is invalid.'));

                return;
            }
            const resolves =
                subject.type === 'card'
                    ? cardIds.has(subject.id)
                    : correspondenceIds.has(subject.id);
            if (!resolves) {
                errors.push(
                    issue('invalid_reference', `${subjectPath}.id`, 'Theme subject does not resolve.')
                );
            }
        });
    }

    validateSourceIds(theme.sourceIds, `${path}.sourceIds`, sourceIds, errors);
};

export function validateCanonicalCorpus(input: unknown): ValidationResult<CanonicalCorpus> {
    const errors: ValidationIssue[] = [];
    const warnings: ValidationIssue[] = [];

    if (!isRecord(input)) {
        return {
            ok: false,
            errors: [issue('invalid_structure', '$', 'Canonical corpus must be an object.')],
            warnings
        };
    }

    const collections = new Map<string, unknown[]>();
    COLLECTION_KEYS.forEach(key => {
        const collection = input[key];
        if (!isRecord(collection)) {
            errors.push(issue('invalid_structure', key, 'Canonical collection must be an object.'));
            collections.set(key, []);

            return;
        }
        if (collection.schemaVersion !== CANONICAL_SCHEMA_VERSION) {
            errors.push(
                issue(
                    'invalid_schema_version',
                    `${key}.schemaVersion`,
                    `Schema version must be ${CANONICAL_SCHEMA_VERSION}.`
                )
            );
        }
        if (!Array.isArray(collection.items)) {
            errors.push(issue('invalid_structure', `${key}.items`, 'Items must be an array.'));
            collections.set(key, []);

            return;
        }
        collections.set(key, collection.items);
        pushUniqueIdIssues(collection.items, key, errors);
    });

    const cards = collections.get('cards') ?? [];
    const spreads = collections.get('spreads') ?? [];
    const correspondences = collections.get('correspondences') ?? [];
    const themes = collections.get('themeFragments') ?? [];
    const rules = collections.get('relationshipRules') ?? [];
    const meanings = collections.get('legacyPositionMeanings') ?? [];
    const sources = collections.get('sources') ?? [];

    const idsFor = (items: unknown[]): Set<string> =>
        new Set(
            items
                .filter(isRecord)
                .map(item => item.id)
                .filter(isNonEmptyString)
        );

    const cardIds = idsFor(cards);
    const spreadIds = idsFor(spreads);
    const correspondenceIds = idsFor(correspondences);
    const sourceIds = idsFor(sources);
    const edgeIds = new Set<string>();

    spreads.forEach((spreadValue, spreadIndex) => {
        if (!isRecord(spreadValue)) return;
        const spreadPath = `spreads.items[${spreadIndex}]`;
        if (spreadValue.id === 'single_card') {
            errors.push(
                issue(
                    'invalid_reference',
                    `${spreadPath}.id`,
                    'single_card is position-less and cannot be modeled as a spread.'
                )
            );
        }

        const positions = Array.isArray(spreadValue.positions) ? spreadValue.positions : [];
        if (!Array.isArray(spreadValue.positions)) {
            errors.push(
                issue('invalid_structure', `${spreadPath}.positions`, 'Positions must be an array.')
            );
        }
        pushUniqueIdIssues(positions, `${spreadPath}.positions`, errors);
        const positionIds = idsFor(positions);
        positions.forEach((position, positionIndex) => {
            if (!isRecord(position) || position.order !== positionIndex) {
                errors.push(
                    issue(
                        'invalid_spread_order',
                        `${spreadPath}.positions[${positionIndex}].order`,
                        `Position order must be ${positionIndex}.`
                    )
                );
            }
        });

        const edges = Array.isArray(spreadValue.narrativeEdges)
            ? spreadValue.narrativeEdges
            : [];
        if (!Array.isArray(spreadValue.narrativeEdges)) {
            errors.push(
                issue(
                    'invalid_structure',
                    `${spreadPath}.narrativeEdges`,
                    'Narrative edges must be an array.'
                )
            );
        }
        pushUniqueIdIssues(edges, `${spreadPath}.narrativeEdges`, errors);
        edges.forEach((edge, edgeIndex) => {
            if (!isRecord(edge)) return;
            if (isNonEmptyString(edge.id)) edgeIds.add(edge.id);
            if (
                !isNonEmptyString(edge.fromPositionId) ||
                !isNonEmptyString(edge.toPositionId) ||
                !positionIds.has(edge.fromPositionId) ||
                !positionIds.has(edge.toPositionId)
            ) {
                errors.push(
                    issue(
                        'invalid_narrative_edge',
                        `${spreadPath}.narrativeEdges[${edgeIndex}]`,
                        'Narrative edge positions must resolve within the spread.'
                    )
                );
            }
        });
    });

    cards.forEach((card, cardIndex) => {
        if (!isRecord(card)) return;
        const path = `cards.items[${cardIndex}].correspondenceIds`;
        if (!isStringArray(card.correspondenceIds)) {
            errors.push(issue('invalid_structure', path, 'Correspondence IDs must be an array.'));

            return;
        }
        if (card.correspondenceIds.length === 0) {
            warnings.push(
                issue(
                    'missing_optional_correspondence',
                    path,
                    'Card has no optional correspondence coverage.'
                )
            );
        }
        card.correspondenceIds.forEach((correspondenceId, index) => {
            if (!correspondenceIds.has(correspondenceId)) {
                errors.push(
                    issue(
                        'invalid_reference',
                        `${path}[${index}]`,
                        'Card correspondence does not resolve.'
                    )
                );
            }
        });
    });

    correspondences.forEach((correspondence, index) => {
        if (!isRecord(correspondence)) return;
        validateSourceIds(
            correspondence.sourceIds,
            `correspondences.items[${index}].sourceIds`,
            sourceIds,
            errors
        );
    });

    themes.forEach((theme, index) => {
        if (isRecord(theme)) {
            validateTheme(theme, index, cardIds, correspondenceIds, sourceIds, errors);
        }
    });

    const approvedThemeSubjectIds = new Set(
        themes
            .filter(isRecord)
            .filter(theme => theme.status === 'approved' && Array.isArray(theme.subjects))
            .flatMap(theme => theme.subjects as unknown[])
            .filter(isRecord)
            .map(subject => subject.id)
            .filter(isNonEmptyString)
    );
    correspondences.forEach((correspondence, index) => {
        if (
            isRecord(correspondence) &&
            isNonEmptyString(correspondence.id) &&
            !approvedThemeSubjectIds.has(correspondence.id)
        ) {
            warnings.push(
                issue(
                    'missing_optional_theme',
                    `correspondences.items[${index}].id`,
                    'Correspondence has no approved theme fragment.'
                )
            );
        }
    });

    rules.forEach((rule, index) => {
        if (!isRecord(rule)) return;
        if (!relationshipConditionIsValid(rule, edgeIds)) {
            errors.push(
                issue(
                    'invalid_relationship_condition',
                    `relationshipRules.items[${index}].condition`,
                    'Relationship condition does not match its rule type and scope.'
                )
            );
        }
        validateSourceIds(
            rule.sourceIds,
            `relationshipRules.items[${index}].sourceIds`,
            sourceIds,
            errors
        );
    });

    meanings.forEach((meaning, index) => {
        if (!isRecord(meaning)) return;
        const path = `legacyPositionMeanings.items[${index}]`;
        if (meaning.status !== 'approved') {
            errors.push(
                issue(
                    'invalid_editorial_status',
                    `${path}.status`,
                    'Legacy position meaning status must be approved.'
                )
            );
        }
        if (!isNonEmptyString(meaning.cardId) || !cardIds.has(meaning.cardId)) {
            errors.push(
                issue('invalid_reference', `${path}.cardId`, 'Meaning card does not resolve.')
            );
        }
        const spread = spreads.find(
            candidate => isRecord(candidate) && candidate.id === meaning.spreadId
        );
        if (!isNonEmptyString(meaning.spreadId) || !spreadIds.has(meaning.spreadId)) {
            errors.push(
                issue('invalid_reference', `${path}.spreadId`, 'Meaning spread does not resolve.')
            );
        } else {
            const positionIds = isRecord(spread) && Array.isArray(spread.positions)
                ? idsFor(spread.positions)
                : new Set<string>();
            if (!isNonEmptyString(meaning.positionId) || !positionIds.has(meaning.positionId)) {
                errors.push(
                    issue(
                        'invalid_reference',
                        `${path}.positionId`,
                        'Meaning position does not resolve within its spread.'
                    )
                );
            }
        }
        validateSourceIds(meaning.sourceIds, `${path}.sourceIds`, sourceIds, errors);
    });

    sortIssues(errors);
    sortIssues(warnings);

    if (errors.length > 0) return { ok: false, errors, warnings };

    return { ok: true, value: input as CanonicalCorpus, warnings };
}

export type { RelationshipRule, ThemeFragment };
