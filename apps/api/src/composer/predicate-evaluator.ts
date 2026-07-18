import {
    CardPredicateInput,
    CorpusPredicate,
    PredicateValue,
    SubjectKind
} from './contracts';

const CARD_FIELD_PATTERN = /^card\.[A-Za-z][A-Za-z0-9]*$/;

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

const isPredicateValue = (value: unknown): value is PredicateValue =>
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean';

const isFieldReference = (value: unknown): value is { field: string } =>
    isRecord(value) &&
    Object.keys(value).length === 1 &&
    typeof value.field === 'string';

const isValidPredicate = (value: unknown): value is CorpusPredicate => {
    if (!isRecord(value)) {
        return false;
    }

    const [operator] = Object.keys(value);
    if (!operator || Object.keys(value).length !== 1) {
        return false;
    }

    const operand = value[operator];

    switch (operator) {
        case 'eq':
            return (
                Array.isArray(operand) &&
                operand.length === 2 &&
                isFieldReference(operand[0]) &&
                isPredicateValue(operand[1])
            );
        case 'in':
            return (
                Array.isArray(operand) &&
                operand.length === 2 &&
                isFieldReference(operand[0]) &&
                Array.isArray(operand[1]) &&
                operand[1].every(
                    item => typeof item === 'string' || typeof item === 'number'
                )
            );
        case 'all':
        case 'any':
            return Array.isArray(operand) && operand.every(isValidPredicate);
        case 'not':
            return isValidPredicate(operand);
        default:
            return false;
    }
};

const correspondenceValueFor = (
    kind: SubjectKind,
    input: CardPredicateInput
): string | undefined =>
    input.card.correspondenceIds.find(id => {
        const correspondence = input.correspondencesById[id];

        return correspondence?.kind === kind;
    });

const valueFor = (
    field: string,
    input: CardPredicateInput
): PredicateValue | undefined => {
    if (!CARD_FIELD_PATTERN.test(field)) {
        return undefined;
    }

    switch (field) {
        case 'card.id':
            return input.card.id;
        case 'card.index':
            return input.card.index;
        case 'card.name':
            return input.card.name;
        case 'card.title':
            return input.card.title;
        case 'card.arcana':
            return input.card.arcana;
        case 'card.orientation':
            return input.orientation;
        case 'card.element':
            return correspondenceValueFor('element', input);
        case 'card.suit':
            return correspondenceValueFor('suit', input);
        case 'card.number':
            return correspondenceValueFor('number', input);
        case 'card.alphabet':
            return correspondenceValueFor('alphabet', input);
        case 'card.sephiroth':
            return correspondenceValueFor('sephiroth', input);
        default: {
            const attributeName = field.slice('card.'.length);
            const attribute = Object.hasOwn(input.card.attributes, attributeName)
                ? input.card.attributes[attributeName]
                : undefined;

            return typeof attribute === 'string' || typeof attribute === 'number'
                ? attribute
                : undefined;
        }
    }
};

const evaluateEq = (operand: unknown, input: CardPredicateInput): boolean => {
    if (!Array.isArray(operand) || operand.length !== 2) {
        return false;
    }

    const [reference, expected] = operand;
    if (!isFieldReference(reference) || !isPredicateValue(expected)) {
        return false;
    }

    const actual = valueFor(reference.field, input);

    return actual !== undefined && actual === expected;
};

const evaluateIn = (operand: unknown, input: CardPredicateInput): boolean => {
    if (!Array.isArray(operand) || operand.length !== 2) {
        return false;
    }

    const [reference, expected] = operand;
    if (
        !isFieldReference(reference) ||
        !Array.isArray(expected) ||
        !expected.every(
            value => typeof value === 'string' || typeof value === 'number'
        )
    ) {
        return false;
    }

    const actual = valueFor(reference.field, input);

    return actual !== undefined && expected.includes(actual as string | number);
};

export function matchesCardPredicate(
    predicate: CorpusPredicate,
    input: CardPredicateInput
): boolean {
    if (!isValidPredicate(predicate)) {
        return false;
    }

    const operators = Object.keys(predicate);
    if (operators.length !== 1) {
        return false;
    }

    const [operator] = operators;
    if (!operator) {
        return false;
    }
    const operand = (predicate as Record<string, unknown>)[operator];

    switch (operator) {
        case 'eq':
            return evaluateEq(operand, input);
        case 'in':
            return evaluateIn(operand, input);
        case 'all':
            return (
                Array.isArray(operand) &&
                operand.every(child =>
                    matchesCardPredicate(child as CorpusPredicate, input)
                )
            );
        case 'any':
            return (
                Array.isArray(operand) &&
                operand.some(child =>
                    matchesCardPredicate(child as CorpusPredicate, input)
                )
            );
        case 'not':
            return (
                isRecord(operand) &&
                !matchesCardPredicate(operand as CorpusPredicate, input)
            );
        default:
            return false;
    }
}
