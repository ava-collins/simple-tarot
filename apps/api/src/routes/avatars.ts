import { Router } from 'express';
import { getJson } from 'serpapi';

export const avatarsRouter = Router();

const SERPAPI_SEARCH_PARAMS = {
    engine: 'google_images',
    google_domain: 'google.com',
    q: 'esoteric tarot art',
    hl: 'en',
    gl: 'us',
    licenses: 'cl',
    safe: 'active',
    imgar: 's',
    nfpr: '1'
};

avatarsRouter.get('/avatars', async (_req, res) => {
    const apiKey = process.env.SERPAPI_API_KEY;
    if (!apiKey) {
        res.json({ thumbnails: [] });

        return;
    }

    try {
        const response = await getJson({ ...SERPAPI_SEARCH_PARAMS, api_key: apiKey });
        console.log('[avatars] SerpAPI response:', response);
        const thumbnails = (response.images_results ?? []).map(
            (image: { thumbnail: string }) => image.thumbnail
        );
        res.json({ thumbnails });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('[avatars] SerpAPI error:', message);
        res.status(500).json({ message: 'Failed to fetch avatar images' });
    }
});
