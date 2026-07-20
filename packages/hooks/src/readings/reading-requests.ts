import type { ReadingRequest } from './reading-contracts';

export type CreateOneCardReadingInput = {
    accessToken: string;
    question?: string;
};

export const SINGLE_CARD_SPREAD = 'single_card';
export const GUIDANCE_POSITION = 'guidance';

// Same 0-77 ordering as @simpletarot/cards' useSvgCards component array:
// major arcana (0-21), then Wands/Cups/Swords/Coins (22-77), each suit
// Ace..10, Page, Knight, Queen, King.
const CARD_NAMES: readonly string[] = [
    'Fool',
    'Magician',
    'High Priestess',
    'Empress',
    'Emperor',
    'Hierophant',
    'Lovers',
    'Chariot',
    'Strength',
    'Hermit',
    'Wheel of Fortune',
    'Justice',
    'Hanged Man',
    'Death',
    'Temperance',
    'Devil',
    'Tower',
    'Star',
    'Moon',
    'Sun',
    'Judgment',
    'Universe',
    'Ace of Wands',
    'Two of Wands',
    'Three of Wands',
    'Four of Wands',
    'Five of Wands',
    'Six of Wands',
    'Seven of Wands',
    'Eight of Wands',
    'Nine of Wands',
    'Ten of Wands',
    'Page of Wands',
    'Knight of Wands',
    'Queen of Wands',
    'King of Wands',
    'Ace of Cups',
    'Two of Cups',
    'Three of Cups',
    'Four of Cups',
    'Five of Cups',
    'Six of Cups',
    'Seven of Cups',
    'Eight of Cups',
    'Nine of Cups',
    'Ten of Cups',
    'Page of Cups',
    'Knight of Cups',
    'Queen of Cups',
    'King of Cups',
    'Ace of Swords',
    'Two of Swords',
    'Three of Swords',
    'Four of Swords',
    'Five of Swords',
    'Six of Swords',
    'Seven of Swords',
    'Eight of Swords',
    'Nine of Swords',
    'Ten of Swords',
    'Page of Swords',
    'Knight of Swords',
    'Queen of Swords',
    'King of Swords',
    'Ace of Coins',
    'Two of Coins',
    'Three of Coins',
    'Four of Coins',
    'Five of Coins',
    'Six of Coins',
    'Seven of Coins',
    'Eight of Coins',
    'Nine of Coins',
    'Ten of Coins',
    'Page of Coins',
    'Knight of Coins',
    'Queen of Coins',
    'King of Coins'
];

function drawRandomCardIndex(random: () => number): number {
    const index = Math.floor(random() * CARD_NAMES.length);

    return Math.min(Math.max(index, 0), CARD_NAMES.length - 1);
}

function cardNameForIndex(cardIndex: number): string {
    return CARD_NAMES[cardIndex] ?? 'Fool';
}

export function createOneCardReadingRequest(
    question?: string,
    random: () => number = Math.random
): ReadingRequest {
    const trimmedQuestion = question?.trim();
    const cardIndex = drawRandomCardIndex(random);

    return {
        spread: SINGLE_CARD_SPREAD,
        ...(trimmedQuestion ? { question: trimmedQuestion } : {}),
        items: [
            {
                cardIndex,
                cardName: cardNameForIndex(cardIndex),
                position: GUIDANCE_POSITION,
                reversed: false
            }
        ]
    };
}
