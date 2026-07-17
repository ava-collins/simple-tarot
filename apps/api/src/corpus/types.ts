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
    arcana?: unknown;
    celtic_cross?: {
        reversed?: Record<string, unknown>;
        upright?: Record<string, unknown>;
    };
    color?: unknown;
    decan?: unknown;
    description?: unknown;
    element?: unknown;
    hex?: unknown;
    image?: unknown;
    index?: unknown;
    keywords?: unknown;
    name?: unknown;
    number?: unknown;
    path?: unknown;
    reversedKeywords?: unknown;
    title?: unknown;
    type?: unknown;
};

export type FirestoreSpreadPosition = {
    description?: unknown;
    displayName?: unknown;
    name?: unknown;
};

export type FirestoreSpread = {
    displayName?: unknown;
    name?: unknown;
    positions?: unknown;
};

export type FirestoreCorrespondence = Record<string, unknown>;

export type FirestoreCorpusExport = {
    __collections__?: {
        alphabet?: Record<string, FirestoreCorrespondence>;
        cards?: Record<string, FirestoreCard>;
        elements?: Record<string, FirestoreCorrespondence>;
        sephiroth?: Record<string, FirestoreCorrespondence>;
        spreads?: Record<string, FirestoreSpread>;
        suits?: Record<string, FirestoreCorrespondence>;
    };
};
