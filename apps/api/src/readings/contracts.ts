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

export type ReadingCitation = {
    sourceId: string;
    text: string;
    metadata: Record<string, unknown>;
};

export type ComposerResponseMetadata = {
    composerMode: 'disabled' | 'enabled';
    corpusVersion?: string;
    namedPairCount?: number;
    wholeSpreadCount?: number;
};

export type ReadingResponse = {
    readingId: string;
    spread: string;
    summary: string;
    positions: ReadingPositionResponse[];
    citations: ReadingCitation[];
    metadata: ComposerResponseMetadata & {
        mode: 'local' | 'bedrock';
        itemCount: number;
        modelId?: string;
    };
};

export type GeneratedReading = {
    text: string;
    citations: ReadingCitation[];
    mode: 'local' | 'bedrock';
    modelId?: string;
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
