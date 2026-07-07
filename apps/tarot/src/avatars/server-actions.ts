'use server';

import 'server-only';

import { createAvatarApiClient, getAvatarApiConfig } from './avatar-api';
import type { AvatarsResponse } from './avatar-contracts';

export async function listAvatarThumbnailsOnServer(): Promise<AvatarsResponse> {
    return createAvatarApiClient(getAvatarApiConfig()).listAvatarThumbnails();
}
