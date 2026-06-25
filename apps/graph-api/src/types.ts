export type CardMetadata = {
    index: number;
    name: string;
    title: string;
    type: string;
    numeral: string;
    description: string;
    keywords: string;
    reversedKeywords: string;
};

export type SpreadPosition = {
    index: number;
    name: string;
    displayName: string;
    description: string;
};

export type ReadingItem = {
    cardIndex: number;
    spreadPositionIndex: number;
    reversed: boolean;
};

export type ReadingRequest = {
    items: ReadingItem[];
};

export type DealtCard = {
    positionDisplayName: string;
    positionDescription: string;
    spreadPositionIndex: number;
    card: CardMetadata & { reversed: boolean };
    cardReading: string;
};

export type ReadingResponse = {
    cards: DealtCard[];
    synthesis: string;
};
