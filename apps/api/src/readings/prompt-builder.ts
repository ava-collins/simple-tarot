import { ReadingRequest } from './contracts';

const orientationFor = (reversed: boolean): 'upright' | 'reversed' =>
    reversed ? 'reversed' : 'upright';

export function buildReadingPrompt(request: ReadingRequest): string {
    const orderedItems = request.items
        .map(
            (item, index) =>
                `${index + 1}. Card: ${item.cardName} | Index: ${item.cardIndex} | Position: ${
                    item.position
                } | Orientation: ${orientationFor(item.reversed)}`
        )
        .join('\n');

    return [
        'Generate a tarot reading grounded only in retrieved corpus context.',
        `Spread: ${request.spread}`,
        `User question: ${request.question ?? 'General reading.'}`,
        '',
        'Ordered cards:',
        orderedItems,
        '',
        'Instructions:',
        'Respect each card position and upright/reversed orientation.',
        'Return an overall summary and one interpretation per ordered card.',
        'Do not invent source material that is not present in retrieved context.',
        'Use clear, direct language suitable for a mobile tarot game.'
    ].join('\n');
}
