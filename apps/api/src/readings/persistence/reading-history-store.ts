import { ReadingHistoryStore } from './contracts';

export type { ReadingHistoryStore } from './contracts';

export const USER_KEY_PREFIX = 'USER#';
export const READING_KEY_PREFIX = 'READING#';
export const READING_ATTEMPT_KEY_PREFIX = 'READING_ATTEMPT#';

export const userPartitionKey = (userId: string): string => `${USER_KEY_PREFIX}${userId}`;

export const readingSortKey = (createdAt: string, readingId: string): string =>
    `${READING_KEY_PREFIX}${createdAt}#${readingId}`;

export const readingAttemptSortKey = (createdAt: string, requestId: string): string =>
    `${READING_ATTEMPT_KEY_PREFIX}${createdAt}#${requestId}`;

export const assertReadingHistoryStore = (
    store: ReadingHistoryStore
): ReadingHistoryStore => store;
