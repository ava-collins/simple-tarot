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

export type TarotApiConfig = {
    baseUrl: string;
};

export type TarotApiClient = {
    createReading: (request: ReadingRequest) => Promise<ReadingResponse>;
    listReadings: () => Promise<ReadingHistoryResponse>;
};

type CreateTarotApiClientOptions = TarotApiConfig & {
    accessToken: string;
};

type RequestMetadata = {
    method: 'GET' | 'POST';
    url: string;
};

const readRequiredEnv = (key: 'EXPO_PUBLIC_TAROT_API_URL') => {
    const value = process.env[key]?.trim();

    if (!value) {
        throw new Error(`Missing required Expo public API config: ${key}`);
    }

    return value;
};

const trimTrailingSlashes = (value: string) => value.replace(/\/+$/, '');

const previewBody = (body: string) => body.slice(0, 240);

const contentTypeFor = (response: Response) => response.headers.get('content-type') ?? '';

async function parseJsonResponse<T>(
    response: Response,
    request: RequestMetadata
): Promise<T> {
    const contentType = contentTypeFor(response);
    const textBody = await response.text();

    if (!contentType.toLowerCase().includes('application/json')) {
        console.warn('[tarot-api] non-json response', {
            bodyPreview: previewBody(textBody),
            contentType,
            method: request.method,
            status: response.status,
            url: request.url
        });

        throw new Error(
            `Tarot API returned ${contentType || 'non-JSON content'} for ${request.method} ${request.url} with status ${response.status}.`
        );
    }

    let body: unknown;

    try {
        body = textBody ? JSON.parse(textBody) : null;
    } catch (error) {
        console.warn('[tarot-api] invalid-json response', {
            bodyPreview: previewBody(textBody),
            contentType,
            method: request.method,
            status: response.status,
            url: request.url
        });

        throw error;
    }

    if (!response.ok) {
        const message =
            body &&
            typeof body === 'object' &&
            'message' in body &&
            typeof body.message === 'string'
                ? body.message
                : `Request failed with status ${response.status}.`;

        throw new Error(message);
    }

    return body as T;
}

export function getTarotApiConfig(): TarotApiConfig {
    return {
        baseUrl: trimTrailingSlashes(readRequiredEnv('EXPO_PUBLIC_TAROT_API_URL'))
    };
}

export function createTarotApiClient({
    accessToken,
    baseUrl
}: CreateTarotApiClientOptions): TarotApiClient {
    const apiBaseUrl = trimTrailingSlashes(baseUrl);
    const authHeaders = {
        Authorization: `Bearer ${accessToken}`
    };

    return {
        async createReading(request) {
            const url = `${apiBaseUrl}/readings`;
            const method = 'POST';
            const response = await fetch(url, {
                body: JSON.stringify(request),
                headers: {
                    ...authHeaders,
                    'Content-Type': 'application/json'
                },
                method: 'POST'
            });

            return parseJsonResponse<ReadingResponse>(response, { method, url });
        },
        async listReadings() {
            const url = `${apiBaseUrl}/readings`;
            const method = 'GET';
            const response = await fetch(url, {
                headers: authHeaders,
                method
            });

            return parseJsonResponse<ReadingHistoryResponse>(response, { method, url });
        }
    };
}
