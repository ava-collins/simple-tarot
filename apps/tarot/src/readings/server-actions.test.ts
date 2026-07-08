import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@simpletarot/hooks/server', async importOriginal => {
    const actual = await importOriginal<typeof import('@simpletarot/hooks/server')>();

    return {
        ...actual,
        createTarotApiClient: vi.fn()
    };
});
vi.mock('@/api/tarot-api', () => ({
    getTarotApiConfig: vi.fn(() => ({
        baseUrl: 'https://api.example.com'
    }))
}));
vi.mock('server-only', () => ({}));

import { createTarotApiClient } from '@simpletarot/hooks/server';
import { createOneCardReadingOnServer, listReadingsOnServer } from './server-actions';

const createClientMock = vi.mocked(createTarotApiClient);

describe('reading server actions', () => {
    beforeEach(() => {
        createClientMock.mockReset();
    });

    it('lists readings through the existing API client with the access token', async () => {
        const response = { readings: [] };
        const listReadings = vi.fn().mockResolvedValue(response);
        createClientMock.mockReturnValue({
            createReading: vi.fn(),
            listReadings
        });

        await expect(listReadingsOnServer('access-token')).resolves.toEqual(response);

        expect(createClientMock).toHaveBeenCalledWith({
            accessToken: 'access-token',
            baseUrl: 'https://api.example.com'
        });
        expect(listReadings).toHaveBeenCalledOnce();
    });

    it('creates the canonical one-card reading request through the existing API client', async () => {
        const response = {
            citations: [],
            metadata: { itemCount: 1, mode: 'local' as const },
            positions: [],
            readingId: 'reading-1',
            spread: 'single_card',
            summary: 'A clear beginning.'
        };
        const createReading = vi.fn().mockResolvedValue(response);
        createClientMock.mockReturnValue({
            createReading,
            listReadings: vi.fn()
        });

        await expect(
            createOneCardReadingOnServer({
                accessToken: 'access-token',
                question: '  What should I notice today?  '
            })
        ).resolves.toEqual(response);

        expect(createReading).toHaveBeenCalledWith({
            spread: 'single_card',
            question: 'What should I notice today?',
            items: [
                {
                    cardIndex: 0,
                    cardName: 'The Fool',
                    position: 'guidance',
                    reversed: false
                }
            ]
        });
    });

    it('omits a blank question from the request payload', async () => {
        const createReading = vi.fn().mockResolvedValue({
            citations: [],
            metadata: { itemCount: 1, mode: 'local' as const },
            positions: [],
            readingId: 'reading-1',
            spread: 'single_card',
            summary: 'A clear beginning.'
        });
        createClientMock.mockReturnValue({
            createReading,
            listReadings: vi.fn()
        });

        await createOneCardReadingOnServer({
            accessToken: 'access-token',
            question: '   '
        });

        expect(createReading).toHaveBeenCalledWith({
            spread: 'single_card',
            items: [
                {
                    cardIndex: 0,
                    cardName: 'The Fool',
                    position: 'guidance',
                    reversed: false
                }
            ]
        });
    });
});
