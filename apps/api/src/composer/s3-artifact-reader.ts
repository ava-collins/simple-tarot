import {
    GetObjectCommand,
    GetObjectCommandOutput,
    S3Client
} from '@aws-sdk/client-s3';
import { ComposerUnavailableError } from './errors';

type S3ObjectClient = {
    send(command: GetObjectCommand): Promise<GetObjectCommandOutput>;
};

export type ComposerArtifactReader = {
    readObject(key: string, maximumBytes: number): Promise<Uint8Array>;
};

export type S3ArtifactReaderOptions = {
    bucketName: string;
    client?: S3ObjectClient;
};

const asUnavailable = (error: unknown): ComposerUnavailableError =>
    error instanceof ComposerUnavailableError
        ? error
        : new ComposerUnavailableError('COMPOSER_OBJECT_READ_FAILED', {
              cause: error
          });

const asyncChunksFor = (body: unknown): AsyncIterable<unknown> => {
    if (
        typeof body !== 'object' ||
        body === null ||
        !(Symbol.asyncIterator in body)
    ) {
        throw new ComposerUnavailableError('COMPOSER_OBJECT_BODY_MISSING');
    }

    return body as AsyncIterable<unknown>;
};

const bytesFor = (chunk: unknown): Uint8Array => {
    if (chunk instanceof Uint8Array) {
        return chunk;
    }

    throw new ComposerUnavailableError('COMPOSER_OBJECT_BODY_INVALID');
};

const combineChunks = (chunks: Uint8Array[], totalBytes: number): Uint8Array => {
    const combined = new Uint8Array(totalBytes);
    let offset = 0;

    for (const chunk of chunks) {
        combined.set(chunk, offset);
        offset += chunk.byteLength;
    }

    return combined;
};

export function createS3ArtifactReader({
    bucketName,
    client = new S3Client({})
}: S3ArtifactReaderOptions): ComposerArtifactReader {
    return {
        async readObject(key: string, maximumBytes: number): Promise<Uint8Array> {
            try {
                if (!Number.isInteger(maximumBytes) || maximumBytes <= 0) {
                    throw new ComposerUnavailableError('COMPOSER_OBJECT_BOUND_INVALID');
                }

                const output = await client.send(
                    new GetObjectCommand({ Bucket: bucketName, Key: key })
                );
                if (
                    typeof output.ContentLength === 'number' &&
                    output.ContentLength > maximumBytes
                ) {
                    throw new ComposerUnavailableError('COMPOSER_OBJECT_TOO_LARGE');
                }

                const chunks: Uint8Array[] = [];
                let totalBytes = 0;

                for await (const rawChunk of asyncChunksFor(output.Body)) {
                    const chunk = bytesFor(rawChunk);
                    totalBytes += chunk.byteLength;
                    if (totalBytes > maximumBytes) {
                        throw new ComposerUnavailableError('COMPOSER_OBJECT_TOO_LARGE');
                    }
                    chunks.push(chunk);
                }

                return combineChunks(chunks, totalBytes);
            } catch (error) {
                throw asUnavailable(error);
            }
        }
    };
}

