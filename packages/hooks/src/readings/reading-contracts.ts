export type ReadingItem = {
    cardIndex: number;
    cardName: string;
    position: string;
    reversed: boolean;
};

export type ReadingRequest = {
    spread: string;
    items: ReadingItem[];
    question?: string;
};

export type ReadingCitation = {
    sourceId: string;
    text: string;
    metadata: Record<string, unknown>;
};

export type ReadingPositionResponse = ReadingItem & {
    text: string;
};

export type ReadingResponse = {
    readingId: string;
    spread: string;
    summary: string;
    positions: ReadingPositionResponse[];
    citations: ReadingCitation[];
    metadata: {
        mode: 'local' | 'bedrock';
        itemCount: number;
        modelId?: string;
    };
};

export type ReadingHistoryItem = {
    createdAt: string;
    metadata: ReadingResponse['metadata'];
    question?: string;
    readingId: string;
    spread: string;
    summary: string;
};

export type ReadingHistoryResponse = {
    readings: ReadingHistoryItem[];
};
