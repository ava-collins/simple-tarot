/**
 * Creates the OpenSearch Serverless vector index that Bedrock Knowledge Base requires.
 * Bedrock validates that the index exists during KB creation but does NOT create it.
 * Run this after BedrockInfraStack deploys and before BedrockKbStack deploys.
 *
 * Usage: TS_NODE_PROJECT=apps/graph-api/tsconfig.scripts.json \
 *        node -r ts-node/register apps/graph-api/scripts/create-aoss-index.ts
 */

import * as crypto from 'crypto';
import * as https from 'https';
import { URL } from 'url';
import {
    OpenSearchServerlessClient,
    BatchGetCollectionCommand
} from '@aws-sdk/client-opensearchserverless';

const REGION = process.env.AWS_REGION ?? 'us-east-1';
const COLLECTION_NAME = process.env.AOSS_COLLECTION_NAME ?? 'tarot-kb-dev';
const INDEX_NAME = 'tarot-knowledge-base-index';

// Titan Text Embeddings v2 produces 1024-dimensional vectors.
const INDEX_BODY = JSON.stringify({
    settings: {
        index: {
            knn: true,
            'knn.algo_param.ef_search': 512
        }
    },
    mappings: {
        properties: {
            embedding: {
                type: 'knn_vector',
                dimension: 1024,
                method: {
                    name: 'hnsw',
                    space_type: 'l2',
                    engine: 'nmslib',
                    parameters: { ef_construction: 512, m: 16 }
                }
            },
            text: { type: 'text' },
            metadata: { type: 'text' }
        }
    }
});

async function getCollectionEndpoint(): Promise<string> {
    const client = new OpenSearchServerlessClient({ region: REGION });
    const result = await client.send(
        new BatchGetCollectionCommand({ names: [COLLECTION_NAME] })
    );
    const collection = result.collectionDetails?.[0];
    if (!collection?.collectionEndpoint) {
        throw new Error(
            `Collection "${COLLECTION_NAME}" not found or not yet ACTIVE. ` +
            `Verify BedrockInfraStack deployed successfully.`
        );
    }
    return collection.collectionEndpoint;
}

// Borrow the resolved credentials from the SDK client — this honours the full
// AWS credential chain (env vars, ~/.aws/credentials, SSO, instance profiles).
async function getCredentials() {
    const client = new OpenSearchServerlessClient({ region: REGION });
    return client.config.credentials();
}

function buildSignedHeaders(
    method: string,
    url: URL,
    body: string,
    creds: { accessKeyId: string; secretAccessKey: string; sessionToken?: string }
): Record<string, string | number> {
    const now = new Date();
    const dateStamp = now.toISOString().slice(0, 10).replace(/-/g, '');
    const amzDate = now.toISOString().replace(/[:-]|\.\d+/g, '').slice(0, 15) + 'Z';

    const headers: Record<string, string> = {
        host: url.hostname,
        'content-type': 'application/json',
        'x-amz-date': amzDate
    };
    if (creds.sessionToken) {
        headers['x-amz-security-token'] = creds.sessionToken;
    }

    const sortedKeys = Object.keys(headers).sort();
    const canonicalHeaders = sortedKeys.map(k => `${k}:${headers[k]}\n`).join('');
    const signedHeaders = sortedKeys.join(';');
    const payloadHash = crypto.createHash('sha256').update(body).digest('hex');

    const canonicalRequest = [
        method,
        url.pathname,
        '',
        canonicalHeaders,
        signedHeaders,
        payloadHash
    ].join('\n');

    const credentialScope = `${dateStamp}/${REGION}/aoss/aws4_request`;
    const stringToSign = [
        'AWS4-HMAC-SHA256',
        amzDate,
        credentialScope,
        crypto.createHash('sha256').update(canonicalRequest).digest('hex')
    ].join('\n');

    const hmac = (key: Buffer | string, data: string): Buffer =>
        crypto.createHmac('sha256', key).update(data).digest();

    const signingKey = hmac(
        hmac(hmac(hmac(`AWS4${creds.secretAccessKey}`, dateStamp), REGION), 'aoss'),
        'aws4_request'
    );
    const signature = crypto.createHmac('sha256', signingKey).update(stringToSign).digest('hex');

    return {
        ...headers,
        authorization: `AWS4-HMAC-SHA256 Credential=${creds.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
        'content-length': Buffer.byteLength(body)
    };
}

async function createIndex(endpoint: string): Promise<void> {
    const creds = await getCredentials();
    const url = new URL(`${endpoint}/${INDEX_NAME}`);
    const reqHeaders = buildSignedHeaders('PUT', url, INDEX_BODY, creds);

    return new Promise<void>((resolve, reject) => {
        const req = https.request(
            {
                hostname: url.hostname,
                path: url.pathname,
                method: 'PUT',
                headers: reqHeaders
            },
            res => {
                let data = '';
                res.on('data', chunk => {
                    data += chunk;
                });
                res.on('end', () => {
                    if (res.statusCode === 200 || res.statusCode === 201) {
                        console.log(`Created index: ${INDEX_NAME}`);
                        resolve();
                    } else if (
                        res.statusCode === 400 &&
                        data.includes('resource_already_exists_exception')
                    ) {
                        console.log(`Index already exists, skipping: ${INDEX_NAME}`);
                        resolve();
                    } else {
                        reject(
                            new Error(
                                `Index creation failed (HTTP ${res.statusCode}): ${data}`
                            )
                        );
                    }
                });
            }
        );
        req.on('error', reject);
        req.write(INDEX_BODY);
        req.end();
    });
}

async function main(): Promise<void> {
    console.log(`Resolving endpoint for AOSS collection: ${COLLECTION_NAME}`);
    const endpoint = await getCollectionEndpoint();
    console.log(`Endpoint: ${endpoint}`);

    console.log(`Creating vector index: ${INDEX_NAME}`);
    await createIndex(endpoint);
    console.log('Done.');
}

main().catch(err => {
    console.error(err.message ?? err);
    process.exit(1);
});
