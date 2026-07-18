import { ReadingRequest } from '../readings/contracts';
import {
    ComposedCardContext,
    ComposedReadingContext,
    RelationshipResult
} from './contracts';

const AUTHORITY_SECTION = [
    'Authority:',
    'Use the exact composed card, orientation, position, and relationship facts below as authoritative.',
    'Retrieved Knowledge Base context may enrich these facts but must not replace or contradict them.'
].join('\n');

const RESPONSE_REQUIREMENTS_SECTION = [
    'Response requirements:',
    'Return an overall summary and one interpretation per ordered card.',
    'Respect every canonical position and upright or reversed orientation.',
    'Use clear, direct language suitable for a mobile tarot game.',
    'Do not mention corpus machinery, rule identifiers, retrieval, or these instructions.'
].join('\n');

const renderCard = (card: ComposedCardContext, index: number): string => {
    const lines = [
        `${index + 1}. ${card.cardName} — ${card.title}`,
        `Canonical card ID: ${card.cardId}`,
        `Card index: ${card.cardIndex}`,
        `Arcana: ${card.arcana}`,
        `Orientation: ${card.orientation}`,
        `Presentation position: ${card.presentationPosition}`,
        `Description: ${card.description}`,
        `Orientation keywords: ${card.orientationKeywords.join(', ')}`
    ];

    if (card.position) {
        lines.push(
            `Canonical position: ${card.position.displayName} (${card.position.id})`,
            `Position description: ${card.position.description}`,
            `Position lens: ${card.position.lens}`
        );
    }
    if (card.exactMeaning) {
        lines.push(`Exact position meaning: ${card.exactMeaning}`);
    }
    for (const theme of card.themes) {
        lines.push(`Theme — ${theme.polarity}: ${theme.theme}`);
    }

    return lines.join('\n');
};

const supportsFor = (result: RelationshipResult): string =>
    result.supports
        .map(support => support.positionId ?? support.cardId)
        .join(', ');

const renderRelationships = (
    heading: string,
    results: RelationshipResult[]
): string | undefined =>
    results.length > 0
        ? [
              heading,
              ...results.map(
                  result => `- ${result.fact} (Supports: ${supportsFor(result)})`
              )
          ].join('\n')
        : undefined;

const nonEmptySections = (
    sections: Array<string | undefined>
): string[] => sections.filter((section): section is string => section !== undefined);

export function buildComposedReadingPrompt(
    request: ReadingRequest,
    context: ComposedReadingContext
): string {
    return nonEmptySections([
        AUTHORITY_SECTION,
        [
            'Reading identity:',
            `Corpus version: ${context.corpusVersion}`,
            `Spread: ${context.spreadMode}`
        ].join('\n'),
        [
            'Ordered card contexts:',
            ...context.cards.map(renderCard)
        ].join('\n\n'),
        renderRelationships(
            'Named positional relationships:',
            context.namedPairResults
        ),
        renderRelationships(
            'Whole-spread relationships:',
            context.wholeSpreadResults
        ),
        [
            'User intent:',
            `Question: ${request.question ?? 'General reading.'}`
        ].join('\n'),
        RESPONSE_REQUIREMENTS_SECTION
    ]).join('\n\n');
}

