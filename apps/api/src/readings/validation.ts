import { ReadingItem, ReadingRequest, ReadingValidationResult } from './contracts';

const isRecord = (input: unknown): input is Record<string, unknown> =>
    typeof input === 'object' && input !== null && !Array.isArray(input);

const isNonEmptyString = (input: unknown): input is string =>
    typeof input === 'string' && input.trim().length > 0;

const validateReadingItem = (
    input: unknown,
    index: number
): { item?: ReadingItem; errors: string[] } => {
    if (!isRecord(input)) {
        return {
            errors: [`items[${index}] must be an object`]
        };
    }

    const errors: string[] = [];

    if (typeof input.cardIndex !== 'number') {
        errors.push(`items[${index}].cardIndex must be a number`);
    }

    if (!isNonEmptyString(input.cardName)) {
        errors.push(`items[${index}].cardName must be a non-empty string`);
    }

    if (!isNonEmptyString(input.position)) {
        errors.push(`items[${index}].position must be a non-empty string`);
    }

    if (typeof input.reversed !== 'boolean') {
        errors.push(`items[${index}].reversed must be a boolean`);
    }

    if (errors.length > 0) {
        return { errors };
    }

    return {
        errors,
        item: {
            cardIndex: input.cardIndex as number,
            cardName: (input.cardName as string).trim(),
            position: (input.position as string).trim(),
            reversed: input.reversed as boolean
        }
    };
};

export function validateReadingRequest(input: unknown): ReadingValidationResult {
    if (!isRecord(input)) {
        return {
            ok: false,
            errors: ['request body must be an object']
        };
    }

    const errors: string[] = [];
    let items: ReadingItem[] = [];

    if (!isNonEmptyString(input.spread)) {
        errors.push('spread must be a non-empty string');
    }

    if (!Array.isArray(input.items)) {
        errors.push('items must be an array');
    } else if (input.items.length === 0) {
        errors.push('items must include at least one card');
    } else {
        const itemResults = input.items.map(validateReadingItem);
        items = itemResults.flatMap(result => (result.item ? [result.item] : []));
        errors.push(...itemResults.flatMap(result => result.errors));
    }

    if (input.question !== undefined && typeof input.question !== 'string') {
        errors.push('question must be a string when provided');
    }

    if (errors.length > 0) {
        return {
            ok: false,
            errors
        };
    }

    const request: ReadingRequest = {
        spread: (input.spread as string).trim(),
        items
    };

    if (typeof input.question === 'string' && input.question.trim().length > 0) {
        request.question = input.question.trim();
    }

    return {
        ok: true,
        value: request
    };
}
