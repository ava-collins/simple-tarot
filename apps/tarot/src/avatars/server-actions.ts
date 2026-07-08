'use server';

import 'server-only';

import { createAvatarApiClient, type AvatarsResponse } from '@simpletarot/hooks/server';

import { getAvatarApiConfig } from '@/config/tarot-api-config';

export async function listAvatarThumbnailsOnServer(
    accessToken: string
): Promise<AvatarsResponse> {
    return createAvatarApiClient({
        ...getAvatarApiConfig(),
        accessToken
    }).listAvatarThumbnails();
}
