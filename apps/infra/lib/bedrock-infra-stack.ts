import * as cdk from 'aws-cdk-lib/core';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as opensearchserverless from 'aws-cdk-lib/aws-opensearchserverless';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import { InfraConfig } from './config';

export interface BedrockInfraStackProps extends cdk.StackProps {
    config: Pick<InfraConfig, 'environmentName' | 'awsRegion'>;
}

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

        // ── AOSS data access policy — grants KB role index read/write ─────────
        // Deployed in this stack (not the KB stack) so AOSS has time to propagate
        // before BedrockKbStack creates the Knowledge Base. The bedrock:deploy
        // script waits 90 seconds between the two stack deploys.
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
                        Principal: [kbRole.roleArn]
                    }
                ])
            }
        );

        // Grant KB role AOSS API access at the IAM level
        kbRole.addToPolicy(
            new iam.PolicyStatement({
                sid: 'AossApiAccess',
                actions: ['aoss:APIAccessAll'],
                resources: [collection.attrArn]
            })
        );

        // Suppress unused-variable warning — dataAccessPolicy must be created
        // as a side effect but is not referenced by other resources in this stack.
        void dataAccessPolicy;

        // ── Cross-stack exports ───────────────────────────────────────────────
        this.collectionArn = collection.attrArn;
        this.kbRoleArn = kbRole.roleArn;
        this.corpusBucketArn = corpusBucket.bucketArn;
        this.corpusBucketName = corpusBucket.bucketName;
    }
}
