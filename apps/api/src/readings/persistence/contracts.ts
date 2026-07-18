import {
    ComposerResponseMetadata,
    GeneratedReading,
    ReadingRequest,
    ReadingResponse
} from '../contracts';

export type GenerationMetadata = ComposerResponseMetadata & {
    itemCount: number;
    mode: 'local' | 'bedrock';
    modelId?: string;
};

export type ReadingFailure = {
    code: string;
    message: string;
    service?: string;
    statusCode: number;
};

export type SaveSuccessfulReadingInput = {
    createdAt: string;
    cognitoIssuer?: string;
    generatedReading: GeneratedReading;
    readingResponse: ReadingResponse;
    request: ReadingRequest;
    requestId?: string;
    userId: string;
};

export type SaveFailedReadingAttemptInput = {
    createdAt: string;
    failure: ReadingFailure;
    generationMetadata: GenerationMetadata;
    request: ReadingRequest;
    requestId: string;
    userId: string;
};

export type ReadingHistoryRecord = {
    createdAt: string;
    entityType: 'reading';
    generatedReading: GeneratedReading;
    generationMetadata: GenerationMetadata;
    pk: string;
    question?: string;
    readingId: string;
    readingResponse: ReadingResponse;
    request: ReadingRequest;
    requestId?: string;
    schemaVersion: 1;
    sk: string;
    spread: string;
    updatedAt: string;
    userId: string;
};

export type UserProfileRecord = {
    cognitoIssuer?: string;
    createdAt: string;
    entityType: 'userProfile';
    firstSeenAt: string;
    lastReadingAt: string;
    lastSeenAt: string;
    pk: string;
    readingCount: number;
    schemaVersion: 1;
    sk: 'PROFILE';
    updatedAt: string;
    userId: string;
};

export type FailedReadingAttemptRecord = {
    createdAt: string;
    entityType: 'readingAttempt';
    failure: ReadingFailure;
    generationMetadata: GenerationMetadata;
    pk: string;
    question?: string;
    request: ReadingRequest;
    requestId: string;
    schemaVersion: 1;
    sk: string;
    spread: string;
    status: 'failed';
    updatedAt: string;
    userId: string;
};

export type ListSuccessfulReadingsByUserInput = {
    limit?: number;
    userId: string;
};

export type ReadingHistoryStore = {
    listSuccessfulReadingsByUser(
        input: ListSuccessfulReadingsByUserInput
    ): Promise<ReadingHistoryRecord[]>;
    saveFailedReadingAttempt(input: SaveFailedReadingAttemptInput): Promise<void>;
    saveSuccessfulReading(input: SaveSuccessfulReadingInput): Promise<void>;
};
