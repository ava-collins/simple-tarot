import type { ReadingHistoryResponse } from './reading-contracts';

export type ReadingHistoryResource = Promise<ReadingHistoryResponse>;

export function createReadingHistoryResource(
    accessToken: string,
    listReadings: (accessToken: string) => Promise<ReadingHistoryResponse>
): ReadingHistoryResource {
    return listReadings(accessToken);
}
