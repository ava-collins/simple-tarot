export type CorpusOrientation = 'general' | 'upright' | 'reversed';

export type CorpusDocumentKind = 'card-context' | 'position-meaning';

export type CorpusDocumentMetadata = {
    cardIndex: number;
    cardName: string;
    keywords: string[];
    orientation: CorpusOrientation;
    position: string;
    sourceCollection: 'cards';
    sourcePath: string;
    spread: string;
};

export type CorpusDocument = {
    id: string;
    kind: CorpusDocumentKind;
    text: string;
    metadata: CorpusDocumentMetadata;
};

export type FirestoreCard = {
    celtic_cross?: {
        reversed?: Record<string, unknown>;
        upright?: Record<string, unknown>;
    };
    description?: unknown;
    index?: unknown;
    keywords?: unknown;
    reversedKeywords?: unknown;
    title?: unknown;
    type?: unknown;
};

export type FirestoreCorpusExport = {
    __collections__?: {
        cards?: Record<string, FirestoreCard>;
    };
};
