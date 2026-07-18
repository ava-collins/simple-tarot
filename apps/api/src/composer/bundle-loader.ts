import { createHash } from 'node:crypto';
import {
    parseActiveReleaseState,
    parseComposerBundle,
    parseReleaseManifest
} from './artifact-validator';
import {
    ACTIVE_RELEASE_KEY,
    MAX_COMPOSER_BUNDLE_BYTES,
    RELEASE_MANIFEST_PATH
} from './constants';
import { ActiveReleaseState, ComposerBundle } from './contracts';
import { ComposerUnavailableError } from './errors';
import { ComposerArtifactReader } from './s3-artifact-reader';

export type LoadedComposerBundle = {
    bundle: ComposerBundle;
    pointer: ActiveReleaseState;
};

export type ComposerBundleLoader = {
    loadActiveBundle(): Promise<LoadedComposerBundle>;
};

export type ComposerBundleLoaderOptions = {
    dataSourceId: string;
    knowledgeBaseId: string;
    reader: ComposerArtifactReader;
};

const decoder = new TextDecoder('utf-8', { fatal: true });

const asUnavailable = (error: unknown): ComposerUnavailableError =>
    error instanceof ComposerUnavailableError
        ? error
        : new ComposerUnavailableError('COMPOSER_LOAD_FAILED', { cause: error });

const parseJson = (bytes: Uint8Array): unknown =>
    JSON.parse(decoder.decode(bytes)) as unknown;

const pointerIdentityFor = (pointer: ActiveReleaseState): string =>
    JSON.stringify([
        pointer.stateSchemaVersion,
        pointer.environment,
        pointer.corpusVersion,
        pointer.releasePrefix,
        pointer.knowledgeBaseId,
        pointer.dataSourceId,
        pointer.ingestionJobId,
        pointer.completedAt
    ]);

const checksumFor = (bytes: Uint8Array): string =>
    createHash('sha256').update(bytes).digest('hex');

const loadImmutableRelease = async (
    reader: ComposerArtifactReader,
    pointer: ActiveReleaseState
): Promise<LoadedComposerBundle> => {
    const manifestBytes = await reader.readObject(
        `${pointer.releasePrefix}${RELEASE_MANIFEST_PATH}`,
        MAX_COMPOSER_BUNDLE_BYTES
    );
    const { composerArtifact } = parseReleaseManifest(
        parseJson(manifestBytes),
        pointer.corpusVersion
    );
    const bundleBytes = await reader.readObject(
        `${pointer.releasePrefix}${composerArtifact.path}`,
        composerArtifact.byteSize
    );
    if (
        bundleBytes.byteLength !== composerArtifact.byteSize ||
        checksumFor(bundleBytes) !== composerArtifact.sha256
    ) {
        throw new ComposerUnavailableError('COMPOSER_OBJECT_INTEGRITY_FAILED');
    }

    return {
        bundle: parseComposerBundle(parseJson(bundleBytes), pointer.corpusVersion),
        pointer
    };
};

export function createComposerBundleLoader({
    dataSourceId,
    knowledgeBaseId,
    reader
}: ComposerBundleLoaderOptions): ComposerBundleLoader {
    let cached: { identity: string; value: LoadedComposerBundle } | undefined;
    const inFlight = new Map<string, Promise<LoadedComposerBundle>>();

    return {
        async loadActiveBundle(): Promise<LoadedComposerBundle> {
            try {
                const pointerBytes = await reader.readObject(
                    ACTIVE_RELEASE_KEY,
                    MAX_COMPOSER_BUNDLE_BYTES
                );
                const pointer = parseActiveReleaseState(parseJson(pointerBytes), {
                    dataSourceId,
                    knowledgeBaseId
                });
                const identity = pointerIdentityFor(pointer);

                if (cached?.identity === identity) {
                    return cached.value;
                }

                const existing = inFlight.get(identity);
                if (existing) {
                    return existing;
                }

                const pending = loadImmutableRelease(reader, pointer)
                    .then(value => {
                        cached = { identity, value };

                        return value;
                    })
                    .catch(error => {
                        throw asUnavailable(error);
                    })
                    .finally(() => {
                        inFlight.delete(identity);
                    });
                inFlight.set(identity, pending);

                return pending;
            } catch (error) {
                throw asUnavailable(error);
            }
        }
    };
}

