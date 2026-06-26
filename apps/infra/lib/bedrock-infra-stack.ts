import * as cdk from 'aws-cdk-lib/core';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as opensearchserverless from 'aws-cdk-lib/aws-opensearchserverless';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import { InfraConfig } from './config';

export interface BedrockInfraStackProps extends cdk.StackProps {
    config: Pick<InfraConfig, 'environmentName' | 'awsRegion'>;
}

const VECTOR_INDEX_NAME = 'tarot-knowledge-base-index';

// Inline Lambda that creates the AOSS vector index and handles AOSS eventual
// consistency by retrying on 403 until the data access policy propagates.
// Uses only Node built-ins (https, crypto) — no external packages needed.
const INDEX_CREATOR_CODE = `
'use strict';
const https = require('https');
const crypto = require('crypto');

const REGION = process.env.REGION;
const COLLECTION_ENDPOINT = process.env.COLLECTION_ENDPOINT;
const INDEX_NAME = process.env.INDEX_NAME;

const INDEX_BODY = JSON.stringify({
  settings: { index: { knn: true, 'knn.algo_param.ef_search': 512 } },
  mappings: {
    properties: {
      embedding: {
        type: 'knn_vector', dimension: 1024,
        method: { name: 'hnsw', space_type: 'l2', engine: 'nmslib',
          parameters: { ef_construction: 512, m: 16 } }
      },
      text: { type: 'text' },
      metadata: { type: 'text' }
    }
  }
});

function hmac(key, data) { return crypto.createHmac('sha256', key).update(data).digest(); }
function sha256hex(data) { return crypto.createHash('sha256').update(data).digest('hex'); }

function signedHeaders(method, hostname, path, body) {
  const now = new Date();
  const ts = now.toISOString();
  const dateStamp = ts.slice(0, 10).replace(/-/g, '');
  const amzDate = dateStamp + 'T' + ts.slice(11, 19).replace(/:/g, '') + 'Z';
  const ak = process.env.AWS_ACCESS_KEY_ID;
  const sk = process.env.AWS_SECRET_ACCESS_KEY;
  const token = process.env.AWS_SESSION_TOKEN;
  const h = { host: hostname, 'content-type': 'application/json', 'x-amz-date': amzDate };
  if (token) h['x-amz-security-token'] = token;
  const keys = Object.keys(h).sort();
  const canonH = keys.map(k => k + ':' + h[k] + '\\n').join('');
  const signH = keys.join(';');
  const payHash = sha256hex(body);
  const canonReq = [method, path, '', canonH, signH, payHash].join('\\n');
  const credScope = dateStamp + '/' + REGION + '/aoss/aws4_request';
  const sts = ['AWS4-HMAC-SHA256', amzDate, credScope, sha256hex(canonReq)].join('\\n');
  const sigKey = hmac(hmac(hmac(hmac('AWS4' + sk, dateStamp), REGION), 'aoss'), 'aws4_request');
  const sig = crypto.createHmac('sha256', sigKey).update(sts).digest('hex');
  return { ...h, authorization: 'AWS4-HMAC-SHA256 Credential=' + ak + '/' + credScope + ', SignedHeaders=' + signH + ', Signature=' + sig };
}

function httpsReq(options, body) {
  return new Promise((resolve, reject) => {
    const r = https.request(options, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ code: res.statusCode, body: d }));
    });
    r.on('error', reject);
    if (body) r.write(body);
    r.end();
  });
}

async function cfnRespond(event, status, reason) {
  const body = JSON.stringify({
    Status: status, Reason: reason,
    PhysicalResourceId: 'aoss-idx-' + INDEX_NAME,
    StackId: event.StackId, RequestId: event.RequestId,
    LogicalResourceId: event.LogicalResourceId
  });
  const u = new URL(event.ResponseURL);
  await httpsReq({
    hostname: u.hostname, path: u.pathname + u.search, method: 'PUT',
    headers: { 'content-type': '', 'content-length': Buffer.byteLength(body) }
  }, body);
}

exports.handler = async (event) => {
  console.log(JSON.stringify(event));
  try {
    if (event.RequestType === 'Delete') {
      await cfnRespond(event, 'SUCCESS', 'Index not deleted on stack removal');
      return;
    }
    const u = new URL(COLLECTION_ENDPOINT);
    const path = '/' + INDEX_NAME;

    // Retry up to 30 times (5 min) to handle AOSS data access policy propagation.
    for (let attempt = 1; attempt <= 30; attempt++) {
      const headers = signedHeaders('PUT', u.hostname, path, INDEX_BODY);
      const r = await httpsReq({
        hostname: u.hostname, path, method: 'PUT',
        headers: { ...headers, 'content-length': Buffer.byteLength(INDEX_BODY) }
      }, INDEX_BODY);
      console.log('attempt', attempt, 'status', r.code, r.body.slice(0, 200));

      if (r.code === 200 || r.code === 201) {
        await cfnRespond(event, 'SUCCESS', 'Index created');
        return;
      }
      if (r.code === 400 && r.body.includes('resource_already_exists_exception')) {
        await cfnRespond(event, 'SUCCESS', 'Index already exists');
        return;
      }
      if (r.code === 403 && attempt < 30) {
        await new Promise(res => setTimeout(res, 10000));
        continue;
      }
      await cfnRespond(event, 'FAILED', 'HTTP ' + r.code + ': ' + r.body.slice(0, 500));
      return;
    }
    await cfnRespond(event, 'FAILED', 'Timed out waiting for AOSS data access policy to propagate');
  } catch (e) {
    console.error(e);
    try { await cfnRespond(event, 'FAILED', String(e)); } catch (_) {}
  }
};
`;

export class BedrockInfraStack extends cdk.Stack {
    readonly collectionArn: string;
    readonly kbRoleArn: string;
    readonly corpusBucketArn: string;
    readonly corpusBucketName: string;

    constructor(scope: Construct, id: string, props: BedrockInfraStackProps) {
        super(scope, id, props);

        const { environmentName } = props.config;
        const removalPolicy =
            environmentName === 'prod'
                ? cdk.RemovalPolicy.RETAIN
                : cdk.RemovalPolicy.DESTROY;

        // ── S3 corpus bucket ──────────────────────────────────────────────────
        const corpusBucket = new s3.Bucket(this, 'CorpusBucket', {
            bucketName: `simple-tarot-corpus-${environmentName}-${this.account}`,
            removalPolicy,
            autoDeleteObjects: environmentName !== 'prod',
            versioned: false,
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL
        });

        // ── IAM role for Knowledge Base service principal ─────────────────────
        const kbRole = new iam.Role(this, 'KnowledgeBaseRole', {
            roleName: `simple-tarot-kb-role-${environmentName}`,
            assumedBy: new iam.ServicePrincipal('bedrock.amazonaws.com', {
                conditions: {
                    StringEquals: { 'aws:SourceAccount': this.account },
                    ArnLike: {
                        'aws:SourceArn': `arn:aws:bedrock:${this.region}:${this.account}:knowledge-base/*`
                    }
                }
            })
        });

        kbRole.addToPolicy(
            new iam.PolicyStatement({
                sid: 'S3CorpusRead',
                actions: ['s3:GetObject', 's3:ListBucket'],
                resources: [corpusBucket.bucketArn, `${corpusBucket.bucketArn}/*`]
            })
        );

        // ── IAM role for the index-creator Lambda ─────────────────────────────
        // Must be created before the data access policy (its ARN is listed there).
        const indexCreatorRole = new iam.Role(this, 'AossIndexCreatorRole', {
            assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
            managedPolicies: [
                iam.ManagedPolicy.fromAwsManagedPolicyName(
                    'service-role/AWSLambdaBasicExecutionRole'
                )
            ]
        });

        // OpenSearch Serverless collection name (max 32 chars, lowercase alphanumeric/hyphens)
        const collectionName = `tarot-kb-${environmentName}`;

        // ── AOSS encryption policy — must exist before collection ─────────────
        const encryptionPolicy = new opensearchserverless.CfnSecurityPolicy(
            this,
            'AossEncryptionPolicy',
            {
                name: `tarot-kb-enc-${environmentName}`,
                type: 'encryption',
                policy: JSON.stringify({
                    Rules: [
                        {
                            ResourceType: 'collection',
                            Resource: [`collection/${collectionName}`]
                        }
                    ],
                    AWSOwnedKey: true
                })
            }
        );

        // ── AOSS network policy ───────────────────────────────────────────────
        // AllowFromPublic: true is required. AOSS does not support restricting
        // access to a specific AWS service (SourceServices) without also setting
        // AllowFromPublic: true — the combination AllowFromPublic: false +
        // SourceServices is an invalid schema. True network isolation requires
        // a VPC + SourceVPCEs, which is a post-MVP architecture change. The
        // data access policy below is the enforced security boundary.
        const networkPolicy = new opensearchserverless.CfnSecurityPolicy(
            this,
            'AossNetworkPolicy',
            {
                name: `tarot-kb-net-${environmentName}`,
                type: 'network',
                policy: JSON.stringify([
                    {
                        Rules: [
                            {
                                ResourceType: 'collection',
                                Resource: [`collection/${collectionName}`]
                            },
                            {
                                ResourceType: 'dashboard',
                                Resource: [`collection/${collectionName}`]
                            }
                        ],
                        AllowFromPublic: true
                    }
                ])
            }
        );

        // ── AOSS collection ───────────────────────────────────────────────────
        const collection = new opensearchserverless.CfnCollection(
            this,
            'VectorCollection',
            {
                name: collectionName,
                type: 'VECTORSEARCH',
                description: `Tarot knowledge base vector store (${environmentName})`
            }
        );

        collection.addDependency(encryptionPolicy);
        collection.addDependency(networkPolicy);

        // Grant both roles AOSS API access at the IAM level
        kbRole.addToPolicy(
            new iam.PolicyStatement({
                sid: 'AossApiAccess',
                actions: ['aoss:APIAccessAll'],
                resources: [collection.attrArn]
            })
        );

        indexCreatorRole.addToPolicy(
            new iam.PolicyStatement({
                sid: 'AossApiAccess',
                actions: ['aoss:APIAccessAll'],
                resources: [collection.attrArn]
            })
        );

        // ── AOSS data access policy ───────────────────────────────────────────
        // Grants both the KB role (for Bedrock ingestion/retrieval) and the
        // index-creator Lambda role (for the setup custom resource below).
        // Deployed here so AOSS has time to propagate before BedrockKbStack
        // creates the Knowledge Base (the bedrock:deploy script waits 90s).
        const dataAccessPolicy = new opensearchserverless.CfnAccessPolicy(
            this,
            'AossDataAccessPolicy',
            {
                name: `tarot-kb-access-${environmentName}`,
                type: 'data',
                policy: JSON.stringify([
                    {
                        Rules: [
                            {
                                ResourceType: 'collection',
                                Resource: [`collection/${collectionName}`],
                                Permission: [
                                    'aoss:DescribeCollectionItems',
                                    'aoss:CreateCollectionItems',
                                    'aoss:UpdateCollectionItems'
                                ]
                            },
                            {
                                ResourceType: 'index',
                                Resource: [`index/${collectionName}/*`],
                                Permission: [
                                    'aoss:CreateIndex',
                                    'aoss:DeleteIndex',
                                    'aoss:UpdateIndex',
                                    'aoss:DescribeIndex',
                                    'aoss:ReadDocument',
                                    'aoss:WriteDocument'
                                ]
                            }
                        ],
                        Principal: [kbRole.roleArn, indexCreatorRole.roleArn]
                    }
                ])
            }
        );

        // ── Lambda custom resource: create the AOSS vector index ──────────────
        // Bedrock KB requires the index to exist before KB creation — it validates
        // the index but does not create it. The Lambda retries on 403 (up to 5 min)
        // to handle AOSS data access policy eventual consistency.
        const indexCreatorFn = new lambda.Function(this, 'AossIndexCreator', {
            runtime: lambda.Runtime.NODEJS_22_X,
            handler: 'index.handler',
            code: lambda.Code.fromInline(INDEX_CREATOR_CODE),
            timeout: cdk.Duration.minutes(5),
            role: indexCreatorRole,
            environment: {
                REGION: this.region,
                COLLECTION_ENDPOINT: collection.attrCollectionEndpoint,
                INDEX_NAME: VECTOR_INDEX_NAME
            }
        });

        const aossIndex = new cdk.CustomResource(this, 'AossIndex', {
            serviceToken: indexCreatorFn.functionArn,
            properties: { IndexName: VECTOR_INDEX_NAME }
        });

        // The custom resource must wait for the data access policy and collection.
        aossIndex.node.addDependency(dataAccessPolicy);
        aossIndex.node.addDependency(collection);

        // ── Cross-stack exports ───────────────────────────────────────────────
        this.collectionArn = collection.attrArn;
        this.kbRoleArn = kbRole.roleArn;
        this.corpusBucketArn = corpusBucket.bucketArn;
        this.corpusBucketName = corpusBucket.bucketName;
    }
}
