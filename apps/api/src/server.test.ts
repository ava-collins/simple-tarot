import type { Server } from 'node:http';
import { once } from 'node:events';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { CognitoJwtVerifier } from './auth/auth-context';
import { UnauthorizedError } from './auth/auth-context';
import type { ApiConfig } from './config';
import { composeReadingContext } from './composer/compose-reading';
import {
    sanitizedComposerBundleV2,
    sanitizedSingleCardRequest
} from './composer/test-fixture';
import type { GeneratedReading } from './readings/contracts';
import type { ReadingExecutor } from './readings/reading-executor';
import { mapGeneratedReadingResponse } from './readings/response-mapper';
import type { ReadingRuntime } from './readings/runtime';
import { createApiServer } from './server';

const localConfig: ApiConfig = {
    apiLog: {},
    auth: { mode: 'disabled' },
    bedrock: { maxAttempts: 5, mode: 'local', retrievalResults: 5 },
    composer: { mode: 'disabled' },
    evaluation: { mode: 'disabled' },
    hostname: 'localhost',
    port: 4100,
    userData: {}
};

const enabledConfig: ApiConfig = {
    ...localConfig,
    auth: {
        clientId: 'client-id',
        issuer: 'https://cognito-idp.us-east-2.amazonaws.com/us-east-2_example',
        mode: 'cognito'
    },
    bedrock: {
        knowledgeBaseId: 'KB123',
        maxAttempts: 5,
        mode: 'bedrock',
        modelArn: 'test-model',
        region: 'us-east-2',
        retrievalResults: 5
    },
    composer: {
        bucketName: 'corpus-bucket',
        dataSourceId: 'DS123',
        mode: 'enabled'
    },
    evaluation: { mode: 'enabled' }
};

const context = composeReadingContext(
    sanitizedSingleCardRequest,
    sanitizedComposerBundleV2
);
const generated: GeneratedReading = {
    citations: [],
    mode: 'bedrock',
    modelId: 'test-model',
    text: 'Summary.\nMeaning.'
};
const composerMetadata = {
    composerMode: 'enabled' as const,
    corpusVersion: context.corpusVersion,
    namedPairCount: context.namedPairResults.length,
    wholeSpreadCount: context.wholeSpreadResults.length
};

const createRuntime = (): ReadingRuntime => {
    const executor: ReadingExecutor = {
        execute: vi.fn().mockResolvedValue({
            composerMetadata,
            context,
            generated,
            reading: mapGeneratedReadingResponse(
                sanitizedSingleCardRequest,
                generated,
                composerMetadata
            ),
            trace: {
                mode: 'deterministic',
                generation: {
                    durationMs: 1,
                    modelId: 'test-model',
                    outputCharacterCount: generated.text.length
                },
                prompt: {
                    system: 'private-system-marker',
                    user: 'private-theme-marker'
                }
            }
        })
    };

    return { executor, generationMode: 'bedrock' };
};

const validVerifier: CognitoJwtVerifier = {
    verifyAuthorizationHeader: vi.fn().mockResolvedValue({
        claims: { sub: 'user-sub-123' },
        userId: 'user-sub-123'
    })
};

const servers: Server[] = [];

const startServer = async (
    config: ApiConfig,
    readingRuntime: ReadingRuntime,
    tokenVerifier?: CognitoJwtVerifier
) => {
    const server = createApiServer({
        config,
        readingRuntime,
        ...(tokenVerifier === undefined ? {} : { tokenVerifier })
    }).listen(0, '127.0.0.1');
    servers.push(server);
    await once(server, 'listening');
    const address = server.address();

    if (!address || typeof address === 'string') {
        throw new Error('Test server address unavailable.');
    }

    return `http://127.0.0.1:${address.port}`;
};

const post = (baseUrl: string, path: string, authenticated = false) =>
    fetch(`${baseUrl}${path}`, {
        body: JSON.stringify(sanitizedSingleCardRequest),
        headers: {
            ...(authenticated ? { authorization: 'Bearer test-token' } : {}),
            'content-type': 'application/json'
        },
        method: 'POST'
    });

afterEach(async () => {
    await Promise.all(
        servers.splice(0).map(
            server =>
                new Promise<void>((resolve, reject) =>
                    server.close(error => (error ? reject(error) : resolve()))
                )
        )
    );
});

describe('createApiServer evaluation mounting', () => {
    it('does not mount the evaluation route when evaluation mode is disabled', async () => {
        const runtime = createRuntime();
        const baseUrl = await startServer(localConfig, runtime);

        const response = await post(baseUrl, '/reading-evaluations');

        expect(response.status).toBe(404);
        expect(runtime.executor.execute).not.toHaveBeenCalled();
    });

    it('protects an enabled evaluation route with Cognito authentication', async () => {
        const verifier: CognitoJwtVerifier = {
            verifyAuthorizationHeader: vi
                .fn()
                .mockRejectedValue(new UnauthorizedError())
        };
        const baseUrl = await startServer(
            enabledConfig,
            createRuntime(),
            verifier
        );

        const response = await post(baseUrl, '/reading-evaluations');

        expect(response.status).toBe(401);
        expect(verifier.verifyAuthorizationHeader).toHaveBeenCalledWith(undefined);
    });

    it('reuses one executor for normal and evaluation routes', async () => {
        const runtime = createRuntime();
        const baseUrl = await startServer(
            enabledConfig,
            runtime,
            validVerifier
        );

        const evaluationResponse = await post(
            baseUrl,
            '/reading-evaluations',
            true
        );
        const readingResponse = await post(baseUrl, '/readings', true);

        expect(evaluationResponse.status).toBe(200);
        expect(readingResponse.status).toBe(200);
        expect(runtime.executor.execute).toHaveBeenCalledTimes(2);

        const evaluationBody = await evaluationResponse.json();
        const readingBody = await readingResponse.json();

        expect(evaluationBody.trace).toEqual(
            expect.objectContaining({
                mode: 'deterministic',
                prompt: {
                    system: 'private-system-marker',
                    user: 'private-theme-marker'
                },
                resolvedContext: expect.objectContaining({
                    composerSchemaVersion: 2,
                    spreadMode: 'single-card'
                })
            })
        );
        expect(JSON.stringify(readingBody)).not.toMatch(
            /private-system-marker|private-theme-marker|resolvedContext|prompt|trace|orientationKeywords|singleCardThemes|sourceIds|ruleIds/
        );
    });
});
