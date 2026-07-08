import { parseJsonResponse, trimTrailingSlashes } from '../common/api-response';
import { AVATARS_ENDPOINT_PATH } from '../constants/tarot-api';
import type { AvatarsResponse } from './avatar-contracts';

export type AvatarApiConfig = {
    accessToken?: string;
    baseUrl: string;
};

export type AvatarApiClient = {
    listAvatarThumbnails: () => Promise<AvatarsResponse>;
};

export function createAvatarApiClient({
    accessToken,
    baseUrl
}: AvatarApiConfig): AvatarApiClient {
    const apiBaseUrl = trimTrailingSlashes(baseUrl);
    const authHeaders = accessToken
        ? {
              Authorization: `Bearer ${accessToken}`
          }
        : undefined;

    return {
        async listAvatarThumbnails() {
            const url = `${apiBaseUrl}${AVATARS_ENDPOINT_PATH}`;
            const method = 'GET';
            const response = await fetch(url, {
                ...(authHeaders ? { headers: authHeaders } : {}),
                method
            });

            return parseJsonResponse<AvatarsResponse>(response, {
                logPrefix: '[avatar-api]',
                method,
                url
            });
        }
    };
}
