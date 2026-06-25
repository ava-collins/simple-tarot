import * as bedrock from 'aws-cdk-lib/aws-bedrock';
import * as cdk from 'aws-cdk-lib/core';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { InfraConfig } from './config';

export interface BedrockKbStackProps extends cdk.StackProps {
    config: Pick<InfraConfig, 'environmentName' | 'awsRegion'>;
    collectionArn: string;
    kbRoleArn: string;
    corpusBucketArn: string;
    corpusBucketName: string;
}

const VECTOR_INDEX_NAME = 'tarot-knowledge-base-index';

// Titan Text Embeddings v2 — text embedding model used for corpus ingestion and retrieval queries.
const EMBEDDING_MODEL_ARN =
    'arn:aws:bedrock:us-east-1::foundation-model/amazon.titan-embed-text-v2:0';

export class BedrockKbStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: BedrockKbStackProps) {
        super(scope, id, props);

        const { environmentName } = props.config;

        // ── Bedrock Knowledge Base ────────────────────────────────────────────
        // Deployed in a separate stack (after BedrockInfraStack) so the 90-second
        // propagation delay in bedrock:deploy gives AOSS time to fully apply the
        // data access policy before Bedrock tries to create the vector index.
        const knowledgeBase = new bedrock.CfnKnowledgeBase(this, 'TarotKnowledgeBase', {
            name: `simple-tarot-kb-${environmentName}`,
            description:
                'Tarot card and spread knowledge for generative reading synthesis',
            roleArn: props.kbRoleArn,
            knowledgeBaseConfiguration: {
                type: 'VECTOR',
                vectorKnowledgeBaseConfiguration: {
                    embeddingModelArn: EMBEDDING_MODEL_ARN
                }
            },
            storageConfiguration: {
                type: 'OPENSEARCH_SERVERLESS',
                opensearchServerlessConfiguration: {
                    collectionArn: props.collectionArn,
                    vectorIndexName: VECTOR_INDEX_NAME,
                    fieldMapping: {
                        vectorField: 'embedding',
                        textField: 'text',
                        metadataField: 'metadata'
                    }
                }
            }
        });

        // ── Bedrock S3 data source ────────────────────────────────────────────
        const dataSource = new bedrock.CfnDataSource(this, 'CorpusDataSource', {
            knowledgeBaseId: knowledgeBase.attrKnowledgeBaseId,
            name: 'tarot-corpus',
            description: 'Tarot card and position Markdown documents from S3',
            dataSourceConfiguration: {
                type: 'S3',
                s3Configuration: {
                    bucketArn: props.corpusBucketArn
                }
            },
            vectorIngestionConfiguration: {
                chunkingConfiguration: {
                    chunkingStrategy: 'FIXED_SIZE',
                    fixedSizeChunkingConfiguration: {
                        maxTokens: 300,
                        overlapPercentage: 20
                    }
                }
            }
        });

        // ── IAM role for the Express reading API service ──────────────────────
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
                            resources: [knowledgeBase.attrKnowledgeBaseArn]
                        }),
                        new iam.PolicyStatement({
                            sid: 'BedrockModelInvoke',
                            actions: ['bedrock:InvokeModel'],
                            resources: [
                                `arn:aws:bedrock:${this.region}::foundation-model/*`
                            ]
                        })
                    ]
                })
            }
        });

        // ── Outputs ───────────────────────────────────────────────────────────
        new cdk.CfnOutput(this, 'BedrockKnowledgeBaseId', {
            value: knowledgeBase.attrKnowledgeBaseId,
            description:
                'Bedrock Knowledge Base ID — set as BEDROCK_KB_ID in graph-api .env'
        });

        new cdk.CfnOutput(this, 'BedrockDataSourceId', {
            value: dataSource.attrDataSourceId,
            description:
                'Bedrock Data Source ID — set as BEDROCK_KB_DATA_SOURCE_ID in graph-api .env'
        });

        new cdk.CfnOutput(this, 'CorpusBucketName', {
            value: props.corpusBucketName,
            description:
                'S3 corpus bucket name — set as CORPUS_BUCKET_NAME in graph-api .env'
        });

        new cdk.CfnOutput(this, 'ApiRoleArn', {
            value: apiRole.roleArn,
            description: 'IAM role ARN for the reading API service (deployment use)'
        });
    }
}
