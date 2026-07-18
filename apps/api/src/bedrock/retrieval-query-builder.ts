import type {
    ComposedReadingContext,
    RelationshipResult
} from '../composer/contracts';
import type { ReadingRequest } from '../readings/contracts';
import { GENERAL_READING_INTENT } from './constants';

const relationshipSection = (
    heading: string,
    results: RelationshipResult[]
): string | undefined =>
    results.length === 0
        ? undefined
        : [heading, ...results.map(result => `- ${result.fact}`)].join('\n');

export function buildRetrievalQuery(
    request: ReadingRequest,
    context: ComposedReadingContext
): string {
    const question = request.question?.trim();
    const sections = [
        `User intent: ${question || GENERAL_READING_INTENT}`,
        relationshipSection(
            'Whole-spread themes:',
            context.wholeSpreadResults
        ),
        relationshipSection(
            'Named-position themes:',
            context.namedPairResults
        )
    ];

    return sections
        .filter((value): value is string => value !== undefined)
        .join('\n');
}
