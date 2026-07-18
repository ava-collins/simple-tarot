import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { createComposerBundleLoader } from './bundle-loader';
import {
    ACTIVE_RELEASE_KEY,
    COMPOSER_BUNDLE_PATH
} from './constants';
import { ComposerArtifactReader } from './s3-artifact-reader';
import {
    SANITIZED_CORPUS_VERSION,
    sanitizedComposerBundle
} from './test-fixture';

const encoder = new TextEncoder();
const jsonBytes = (value: unknown) => encoder.encode(JSON.stringify(value));
const sha256 = (value: Uint8Array) =>
    createHash('sha256').update(value).digest('hex');

const EXPECTED_IDENTITIES = {
    dataSourceId: 'DS1234567890',
    knowledgeBaseId: 'KB1234567890'
};

const releaseFor = (corpusVersion: string) => {
    const bundle = {
        ...structuredClone(sanitizedComposerBundle),
        corpusVersion
    };
    const bundleBytes = jsonBytes(bundle);
    const releasePrefix = `releases/${corpusVersion}/`;
    const pointer = {
        stateSchemaVersion: 1,
        environment: 'dev',
        corpusVersion,
        releasePrefix,
        knowledgeBaseId: EXPECTED_IDENTITIES.knowledgeBaseId,
        dataSourceId: EXPECTED_IDENTITIES.dataSourceId,
        ingestionJobId: `JOB-${corpusVersion.slice(0, 6)}`,
        completedAt: '2026-07-18T12:00:00.000Z'
    };
    const manifest = {
        manifestSchemaVersion: 1,
        corpusSchemaVersion: 1,
        corpusVersion,
        artifacts: [
            {
                path: COMPOSER_BUNDLE_PATH,
                role: 'composer',
                mediaType: 'application/json',
                byteSize: bundleBytes.byteLength,
                sha256: sha256(bundleBytes)
            }
        ],
        runtimeObjects: [COMPOSER_BUNDLE_PATH],
        coverageObjects: [],
        ingestibleObjects: []
    };

    return {
        bundle,
        bundleBytes,
        manifestBytes: jsonBytes(manifest),
        pointer,
        pointerBytes: jsonBytes(pointer),
        releasePrefix
    };
};

class MutableArtifactReader implements ComposerArtifactReader {
    readonly calls: Array<{ key: string; maximumBytes: number }> = [];
    currentVersion = SANITIZED_CORPUS_VERSION;
    readonly releases = new Map<string, ReturnType<typeof releaseFor>>();
    failureKey?: string;
    manifestGate?: Promise<void>;

    constructor(...releases: Array<ReturnType<typeof releaseFor>>) {
        for (const release of releases) {
            this.releases.set(release.pointer.corpusVersion, release);
        }
    }

    async readObject(key: string, maximumBytes: number): Promise<Uint8Array> {
        this.calls.push({ key, maximumBytes });
        if (key === this.failureKey) {
            throw new Error('private reader detail');
        }
        const release = this.releases.get(this.currentVersion);
        if (!release) throw new Error('Missing invented release.');
        if (key === ACTIVE_RELEASE_KEY) return release.pointerBytes;
        if (key === `${release.releasePrefix}manifest.json`) {
            await this.manifestGate;
            return release.manifestBytes;
        }
        if (key === `${release.releasePrefix}${COMPOSER_BUNDLE_PATH}`) {
            return release.bundleBytes;
        }
        throw new Error(`Unexpected invented key: ${key}`);
    }
}

const loaderFor = (reader: ComposerArtifactReader) =>
    createComposerBundleLoader({ reader, ...EXPECTED_IDENTITIES });

describe('createComposerBundleLoader', () => {
    it('reads pointer, manifest, and verified bundle for the first request', async () => {
        const release = releaseFor(SANITIZED_CORPUS_VERSION);
        const reader = new MutableArtifactReader(release);

        await expect(loaderFor(reader).loadActiveBundle()).resolves.toEqual({
            bundle: release.bundle,
            pointer: release.pointer
        });
        expect(reader.calls.map(call => call.key)).toEqual([
            ACTIVE_RELEASE_KEY,
            `${release.releasePrefix}manifest.json`,
            `${release.releasePrefix}${COMPOSER_BUNDLE_PATH}`
        ]);
        expect(reader.calls[2]?.maximumBytes).toBe(release.bundleBytes.byteLength);
    });

    it('reads the pointer for every request but reuses matching immutable objects', async () => {
        const release = releaseFor(SANITIZED_CORPUS_VERSION);
        const reader = new MutableArtifactReader(release);
        const loader = loaderFor(reader);

        const first = await loader.loadActiveBundle();
        const second = await loader.loadActiveBundle();

        expect(second).toBe(first);
        expect(reader.calls.map(call => call.key)).toEqual([
            ACTIVE_RELEASE_KEY,
            `${release.releasePrefix}manifest.json`,
            `${release.releasePrefix}${COMPOSER_BUNDLE_PATH}`,
            ACTIVE_RELEASE_KEY
        ]);
    });

    it('loads and atomically replaces the cache when the complete pointer changes', async () => {
        const firstRelease = releaseFor(SANITIZED_CORPUS_VERSION);
        const secondRelease = releaseFor('b'.repeat(64));
        const reader = new MutableArtifactReader(firstRelease, secondRelease);
        const loader = loaderFor(reader);

        const first = await loader.loadActiveBundle();
        reader.currentVersion = secondRelease.pointer.corpusVersion;
        const second = await loader.loadActiveBundle();

        expect(first.bundle.corpusVersion).toBe(SANITIZED_CORPUS_VERSION);
        expect(second.bundle.corpusVersion).toBe('b'.repeat(64));
        expect(second).not.toBe(first);
    });

    it('does not use the old cache when a changed pointer fails', async () => {
        const firstRelease = releaseFor(SANITIZED_CORPUS_VERSION);
        const secondRelease = releaseFor('b'.repeat(64));
        const reader = new MutableArtifactReader(firstRelease, secondRelease);
        const loader = loaderFor(reader);
        await loader.loadActiveBundle();

        reader.currentVersion = secondRelease.pointer.corpusVersion;
        reader.failureKey = `${secondRelease.releasePrefix}manifest.json`;

        await expect(loader.loadActiveBundle()).rejects.toMatchObject({
            code: 'COMPOSER_UNAVAILABLE',
            retryable: true,
            status: 503
        });
    });

    it('shares one immutable load across concurrent same-pointer misses', async () => {
        const release = releaseFor(SANITIZED_CORPUS_VERSION);
        const reader = new MutableArtifactReader(release);
        let releaseManifest: (() => void) | undefined;
        reader.manifestGate = new Promise<void>(resolve => {
            releaseManifest = resolve;
        });
        const loader = loaderFor(reader);

        const first = loader.loadActiveBundle();
        const second = loader.loadActiveBundle();
        await new Promise(resolve => setImmediate(resolve));
        releaseManifest?.();
        const [firstValue, secondValue] = await Promise.all([first, second]);

        expect(secondValue).toBe(firstValue);
        expect(
            reader.calls.filter(
                call => call.key === `${release.releasePrefix}manifest.json`
            )
        ).toHaveLength(1);
        expect(reader.calls.filter(call => call.key === ACTIVE_RELEASE_KEY)).toHaveLength(
            2
        );
    });

    it.each(['size', 'checksum', 'json', 'schema'] as const)(
        'maps an invalid bundle %s to a safe retryable 503',
        async failure => {
            const release = releaseFor(SANITIZED_CORPUS_VERSION);
            if (failure === 'size') {
                release.bundleBytes = Uint8Array.from([...release.bundleBytes, 32]);
            }
            if (failure === 'checksum') {
                const manifest = JSON.parse(new TextDecoder().decode(release.manifestBytes));
                manifest.artifacts[0].sha256 = 'f'.repeat(64);
                release.manifestBytes = jsonBytes(manifest);
            }
            if (failure === 'json') {
                release.bundleBytes = encoder.encode('{broken');
                const manifest = JSON.parse(new TextDecoder().decode(release.manifestBytes));
                manifest.artifacts[0].byteSize = release.bundleBytes.byteLength;
                manifest.artifacts[0].sha256 = sha256(release.bundleBytes);
                release.manifestBytes = jsonBytes(manifest);
            }
            if (failure === 'schema') {
                const bundle = { ...release.bundle, schemaVersion: 2 };
                release.bundleBytes = jsonBytes(bundle);
                const manifest = JSON.parse(new TextDecoder().decode(release.manifestBytes));
                manifest.artifacts[0].byteSize = release.bundleBytes.byteLength;
                manifest.artifacts[0].sha256 = sha256(release.bundleBytes);
                release.manifestBytes = jsonBytes(manifest);
            }

            await expect(
                loaderFor(new MutableArtifactReader(release)).loadActiveBundle()
            ).rejects.toMatchObject({
                message: 'Tarot reading context is temporarily unavailable.',
                retryable: true,
                status: 503
            });
        }
    );
});
