import { GeneratedReading, ReadingRequest, ReadingResponse } from './contracts';

const nonEmptyLines = (text: string): string[] =>
    text
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

const readingIdFor = (
    request: ReadingRequest,
    mode: GeneratedReading['mode']
): string =>
    `${mode}-${request.spread}-${request.items.map(item => item.cardIndex).join('-')}`;

export function mapGeneratedReadingResponse(
    request: ReadingRequest,
    generated: GeneratedReading
): ReadingResponse {
    const lines = nonEmptyLines(generated.text);
    const [summary = '', ...positionLines] = lines;

    return {
        readingId: readingIdFor(request, generated.mode),
        spread: request.spread,
        summary,
        positions: request.items.map((item, index) => ({
            cardIndex: item.cardIndex,
            cardName: item.cardName,
            position: item.position,
            reversed: item.reversed,
            text:
                positionLines[index] ??
                `${item.cardName} ${item.reversed ? 'reversed' : 'upright'} in ${
                    item.position
                }.`
        })),
        citations: generated.citations,
        metadata: {
            itemCount: request.items.length,
            mode: generated.mode,
            ...(generated.modelId ? { modelId: generated.modelId } : {})
        }
    };
}
