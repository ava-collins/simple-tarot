import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
    CorpusDocument,
    CorpusOrientation,
    FirestoreCard,
    FirestoreCorpusExport
} from './types';

const OUTPUT_FILE_NAME = 'tarot-corpus.jsonl';

const isNonEmptyString = (value: unknown): value is string =>
    typeof value === 'string' && value.trim().length > 0;

const toText = (value: unknown): string => (isNonEmptyString(value) ? value.trim() : '');

const splitKeywords = (value: unknown): string[] =>
    toText(value)
        .split(',')
        .map(keyword => keyword.trim())
        .filter(keyword => keyword.length > 0);

const slugify = (value: string): string =>
    value
        .toLowerCase()
        .replace(/&/g, ' and ')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

const cardIndex = (card: FirestoreCard): number =>
    typeof card.index === 'number' && Number.isFinite(card.index) ? card.index : -1;

const cardSort = (a: [string, FirestoreCard], b: [string, FirestoreCard]): number => {
    const indexDiff = cardIndex(a[1]) - cardIndex(b[1]);
    return indexDiff === 0 ? a[0].localeCompare(b[0]) : indexDiff;
};

const buildCardContextDocument = (
    cardName: string,
    card: FirestoreCard
): CorpusDocument | undefined => {
    const description = toText(card.description);
    const keywords = splitKeywords(card.keywords);
    const reversedKeywords = splitKeywords(card.reversedKeywords);

    if (!description && keywords.length === 0 && reversedKeywords.length === 0) {
        return undefined;
    }

    const title = toText(card.title) || cardName;
    const type = toText(card.type) || 'unknown';

    return {
        id: `card-${slugify(cardName)}-context`,
        kind: 'card-context',
        text: [
            `Card: ${cardName}`,
            `Title: ${title}`,
            `Type: ${type}`,
            `Description: ${description}`,
            `Upright keywords: ${keywords.join(', ')}`,
            `Reversed keywords: ${reversedKeywords.join(', ')}`
        ].join('\n'),
        metadata: {
            cardIndex: cardIndex(card),
            cardName,
            keywords,
            orientation: 'general',
            position: 'general',
            sourceCollection: 'cards',
            sourcePath: `cards/${cardName}`,
            spread: 'general'
        }
    };
};

const buildPositionMeaningDocument = (
    cardName: string,
    card: FirestoreCard,
    orientation: Exclude<CorpusOrientation, 'general'>,
    position: string,
    meaning: string
): CorpusDocument => {
    const keywords =
        orientation === 'reversed'
            ? splitKeywords(card.reversedKeywords)
            : splitKeywords(card.keywords);

    return {
        id: `card-${slugify(cardName)}-celtic-cross-${slugify(position)}-${orientation}`,
        kind: 'position-meaning',
        text: [
            'Spread: celtic_cross',
            `Position: ${position}`,
            `Card: ${cardName}`,
            `Orientation: ${orientation}`,
            `Meaning: ${meaning}`,
            `Keywords: ${keywords.join(', ')}`
        ].join('\n'),
        metadata: {
            cardIndex: cardIndex(card),
            cardName,
            keywords,
            orientation,
            position,
            sourceCollection: 'cards',
            sourcePath: `cards/${cardName}/celtic_cross/${orientation}/${position}`,
            spread: 'celtic_cross'
        }
    };
};

const positionDocumentsForOrientation = (
    cardName: string,
    card: FirestoreCard,
    orientation: Exclude<CorpusOrientation, 'general'>
): CorpusDocument[] => {
    const meanings = card.celtic_cross?.[orientation] ?? {};

    return Object.entries(meanings)
        .filter((entry): entry is [string, string] => isNonEmptyString(entry[1]))
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([position, meaning]) =>
            buildPositionMeaningDocument(
                cardName,
                card,
                orientation,
                position,
                meaning.trim()
            )
        );
};

export function normalizeFirestoreCorpus(
    source: FirestoreCorpusExport
): CorpusDocument[] {
    const cards = source.__collections__?.cards ?? {};

    return Object.entries(cards)
        .sort(cardSort)
        .flatMap(([cardName, card]) => {
            const contextDocument = buildCardContextDocument(cardName, card);
            const positionDocuments = [
                ...positionDocumentsForOrientation(cardName, card, 'upright'),
                ...positionDocumentsForOrientation(cardName, card, 'reversed')
            ];

            return contextDocument
                ? [contextDocument, ...positionDocuments]
                : positionDocuments;
        });
}

export function writeNormalizedCorpus(
    documents: CorpusDocument[],
    outputDir: string
): string {
    mkdirSync(outputDir, { recursive: true });
    const outputPath = join(outputDir, OUTPUT_FILE_NAME);
    const body = `${documents.map(document => JSON.stringify(document)).join('\n')}\n`;

    writeFileSync(outputPath, body, 'utf8');

    return outputPath;
}
