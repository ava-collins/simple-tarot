import type { AvatarsResponse } from './avatar-contracts';

export type AvatarThumbnailsResource = Promise<AvatarsResponse>;

export function createAvatarThumbnailsResource(
    accessToken: string,
    listAvatarThumbnails: (accessToken: string) => Promise<AvatarsResponse>
): AvatarThumbnailsResource {
    return listAvatarThumbnails(accessToken);
}
