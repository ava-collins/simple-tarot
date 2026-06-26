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

export type ReadingPositionResponse = {
    cardIndex: number;
    cardName: string;
    position: string;
    reversed: boolean;
    text: string;
};

export type ReadingResponse = {
    readingId: string;
    spread: string;
    summary: string;
    positions: ReadingPositionResponse[];
    citations: [];
    metadata: {
        mode: 'placeholder';
        itemCount: number;
    };
};

export type ReadingValidationResult =
    | {
          ok: true;
          value: ReadingRequest;
      }
    | {
          ok: false;
          errors: string[];
      };
