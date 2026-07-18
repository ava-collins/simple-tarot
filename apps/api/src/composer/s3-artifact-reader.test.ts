import { Readable } from 'node:stream';
import { describe, expect, it, vi } from 'vitest';
import { ComposerUnavailableError } from './errors';
import { createS3ArtifactReader } from './s3-artifact-reader';

const bytes = (...values: number[]) => Uint8Array.from(values);

describe('createS3ArtifactReader', () => {
    it('reads exact bytes with the configured bucket and requested key', async () => {
        const send = vi.fn().mockResolvedValue({
            Body: Readable.from([bytes(1, 2), bytes(3, 4)]),
            ContentLength: 4
        });
        const reader = createS3ArtifactReader({
            bucketName: 'invented-corpus-bucket',
            client: { send }
        });

        await expect(reader.readObject('safe/object.json', 4)).resolves.toEqual(
            bytes(1, 2, 3, 4)
        );
        expect(send).toHaveBeenCalledTimes(1);
        expect(send.mock.calls[0]?.[0].input).toEqual({
            Bucket: 'invented-corpus-bucket',
            Key: 'safe/object.json'
        });
    });

    it('rejects content length above the requested bound before reading', async () => {
        const body = Readable.from([bytes(1, 2, 3)]);
        const iterator = vi.spyOn(body, Symbol.asyncIterator);
        const reader = createS3ArtifactReader({
            bucketName: 'invented-corpus-bucket',
            client: {
                send: vi.fn().mockResolvedValue({ Body: body, ContentLength: 5 })
            }
        });

        await expect(reader.readObject('safe/object.json', 4)).rejects.toBeInstanceOf(
            ComposerUnavailableError
        );
        expect(iterator).not.toHaveBeenCalled();
    });

    it('rejects a stream that grows beyond the requested bound', async () => {
        const reader = createS3ArtifactReader({
            bucketName: 'invented-corpus-bucket',
            client: {
                send: vi.fn().mockResolvedValue({
                    Body: Readable.from([bytes(1, 2, 3), bytes(4, 5)])
                })
            }
        });

        await expect(reader.readObject('safe/object.json', 4)).rejects.toMatchObject({
            reason: 'COMPOSER_OBJECT_TOO_LARGE',
            status: 503
        });
    });

    it('maps a missing body and SDK failures to safe availability errors', async () => {
        const missingBody = createS3ArtifactReader({
            bucketName: 'invented-corpus-bucket',
            client: { send: vi.fn().mockResolvedValue({}) }
        });
        const sdkFailure = createS3ArtifactReader({
            bucketName: 'invented-corpus-bucket',
            client: { send: vi.fn().mockRejectedValue(new Error('private SDK detail')) }
        });

        await expect(missingBody.readObject('safe/object.json', 4)).rejects.toMatchObject({
            message: 'Tarot reading context is temporarily unavailable.'
        });
        await expect(sdkFailure.readObject('safe/object.json', 4)).rejects.toMatchObject({
            message: 'Tarot reading context is temporarily unavailable.'
        });
    });
});

