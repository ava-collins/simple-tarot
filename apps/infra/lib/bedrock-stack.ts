import * as bedrock from 'aws-cdk-lib/aws-bedrock';
import * as cdk from 'aws-cdk-lib/core';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as opensearchserverless from 'aws-cdk-lib/aws-opensearchserverless';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import { InfraConfig } from './config';

export interface BedrockStackProps extends cdk.StackProps {
    config: Pick<InfraConfig, 'environmentName' | 'awsRegion'>;
}

const VECTOR_INDEX_NAME = 'tarot-knowledge-base-index';

// Titan Text Embeddings v2 — text embedding model used for corpus ingestion and retrieval queries.
const EMBEDDING_MODEL_ARN =
    'arn:aws:bedrock:us-east-1::foundation-model/amazon.titan-embed-text-v2:0';

export class BedrockStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: BedrockStackProps) {
        super(scope, id, props);

        const { environmentName } = props.config;
        const removalPolicy =
            environmentName === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY;

        // ── S3 corpus bucket ──────────────────────────────────────────────────
        const corpusBucket = new s3.Bucket(this, 'CorpusBucket', {
            bucketName: `simple-tarot-corpus-${environmentName}-${this.account}`,
            removalPolicy,
            autoDeleteObjects: environmentName !== 'prod',
            versioned: false,
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        });

        // ── IAM role for Knowledge Base service principal ─────────────────────
        const kbRole = new iam.Role(this, 'KnowledgeBaseRole', {
            roleName: `simple-tarot-kb-role-${environmentName}`,
            assumedBy: new iam.ServicePrincipal('bedrock.amazonaws.com', {
                conditions: {
                    StringEquals: { 'aws:SourceAccount': this.account },
                    ArnLike: {
                        'aws:SourceArn': `arn:aws:bedrock:${this.region}:${this.account}:knowledge-base/*`,
                    },
                },
            }),
        });

        kbRole.addToPolicy(
            new iam.PolicyStatement({
                sid: 'S3CorpusRead',
                actions: ['s3:GetObject', 's3:ListBucket'],
                resources: [corpusBucket.bucketArn, `${corpusBucket.bucketArn}/*`],
            })
        );

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
                            Resource: [`collection/${collectionName}`],
                        },
                    ],
                    AWSOwnedKey: true,
                }),
            }
        );

        // ── AOSS network policy — public access required for Bedrock ingestion ─
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
                                Resource: [`collection/${collectionName}`],
                            },
                            {
                                ResourceType: 'dashboard',
                                Resource: [`collection/${collectionName}`],
                            },
                        ],
                        AllowFromPublic: true,
                    },
                ]),
            }
        );

        // ── AOSS collection ───────────────────────────────────────────────────
        const collection = new opensearchserverless.CfnCollection(this, 'VectorCollection', {
            name: collectionName,
            type: 'VECTORSEARCH',
            description: `Tarot knowledge base vector store (${environmentName})`,
        });

        // Policies must exist before the collection accepts requests.
        collection.addDependency(encryptionPolicy);
        collection.addDependency(networkPolicy);

        // ── AOSS data access policy — grants KB role index read/write ─────────
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
                                    'aoss:UpdateCollectionItems',
                                ],
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
                                    'aoss:WriteDocument',
                                ],
                            },
                        ],
                        Principal: [kbRole.roleArn],
                    },
                ]),
            }
        );

        // Grant KB role AOSS API access at the IAM level
        kbRole.addToPolicy(
            new iam.PolicyStatement({
                sid: 'AossApiAccess',
                actions: ['aoss:APIAccessAll'],
                resources: [collection.attrArn],
            })
        );

        // ── Bedrock Knowledge Base ────────────────────────────────────────────
        const knowledgeBase = new bedrock.CfnKnowledgeBase(this, 'TarotKnowledgeBase', {
            name: `simple-tarot-kb-${environmentName}`,
            description: 'Tarot card and spread knowledge for generative reading synthesis',
            roleArn: kbRole.roleArn,
            knowledgeBaseConfiguration: {
                type: 'VECTOR',
                vectorKnowledgeBaseConfiguration: {
                    embeddingModelArn: EMBEDDING_MODEL_ARN,
                },
            },
            storageConfiguration: {
                type: 'OPENSEARCH_SERVERLESS',
                opensearchServerlessConfiguration: {
                    collectionArn: collection.attrArn,
                    vectorIndexName: VECTOR_INDEX_NAME,
                    fieldMapping: {
                        vectorField: 'embedding',
                        textField: 'text',
                        metadataField: 'metadata',
                    },
                },
            },
        });

        // KB depends on the data access policy being in place so it can create
        // the vector index on first sync.
        knowledgeBase.addDependency(dataAccessPolicy);
        knowledgeBase.addDependency(collection);

        // ── Bedrock S3 data source ────────────────────────────────────────────
        const dataSource = new bedrock.CfnDataSource(this, 'CorpusDataSource', {
            knowledgeBaseId: knowledgeBase.attrKnowledgeBaseId,
            name: 'tarot-corpus',
            description: 'Tarot card and position Markdown documents from S3',
            dataSourceConfiguration: {
                type: 'S3',
                s3Configuration: {
                    bucketArn: corpusBucket.bucketArn,
                },
            },
            vectorIngestionConfiguration: {
                chunkingConfiguration: {
                    chunkingStrategy: 'FIXED_SIZE',
                    fixedSizeChunkingConfiguration: {
                        maxTokens: 300,
                        overlapPercentage: 20,
                    },
                },
            },
        });

        // ── IAM role for the Express reading API service ──────────────────────
        // Used when the service is deployed; local dev uses developer credentials.
        const apiRole = new iam.Role(this, 'ApiServiceRole', {
            roleName: `simple-tarot-api-role-${environmentName}`,
            assumedBy: new iam.CompositePrincipal(
                new iam.ServicePrincipal('ec2.amazonaws.com'),
                new iam.ServicePrincipal('ecs-tasks.amazonaws.com')
            ),
            inlinePolicies: {
                BedrockReadingAccess: new iam.PolicyDocument({
                    statements: [
                        new iam.PolicyStatement({
                            sid: 'BedrockKbRetrieve',
                            actions: ['bedrock:Retrieve'],
                            resources: [knowledgeBase.attrKnowledgeBaseArn],
                        }),
                        new iam.PolicyStatement({
                            sid: 'BedrockModelInvoke',
                            // Scoped to foundation models — narrow further post-MVP
                            actions: ['bedrock:InvokeModel'],
                            resources: [
                                `arn:aws:bedrock:${this.region}::foundation-model/*`,
                            ],
                        }),
                    ],
                }),
            },
        });

        // ── Outputs ───────────────────────────────────────────────────────────
        new cdk.CfnOutput(this, 'BedrockKnowledgeBaseId', {
            value: knowledgeBase.attrKnowledgeBaseId,
            description: 'Bedrock Knowledge Base ID — set as BEDROCK_KB_ID in graph-api .env',
        });

        new cdk.CfnOutput(this, 'BedrockDataSourceId', {
            value: dataSource.attrDataSourceId,
            description: 'Bedrock Data Source ID — set as BEDROCK_KB_DATA_SOURCE_ID in graph-api .env',
        });

        new cdk.CfnOutput(this, 'CorpusBucketName', {
            value: corpusBucket.bucketName,
            description: 'S3 corpus bucket name — set as CORPUS_BUCKET_NAME in graph-api .env',
        });

        new cdk.CfnOutput(this, 'ApiRoleArn', {
            value: apiRole.roleArn,
            description: 'IAM role ARN for the reading API service (deployment use)',
        });
    }
}
