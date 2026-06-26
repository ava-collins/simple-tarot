import * as bedrock from 'aws-cdk-lib/aws-bedrock';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as aoss from 'aws-cdk-lib/aws-opensearchserverless';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import { InfraConfig } from './config';

export interface BedrockRagStackProps extends cdk.StackProps {
  config: InfraConfig;
}

const VECTOR_FIELD = 'bedrock-vector';
const TEXT_FIELD = 'bedrock-text';
const METADATA_FIELD = 'bedrock-metadata';

export class BedrockRagStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: BedrockRagStackProps) {
    super(scope, id, props);

    const removalPolicy = props.config.environmentName === 'prod'
      ? cdk.RemovalPolicy.RETAIN
      : cdk.RemovalPolicy.DESTROY;

    const corpusBucket = new s3.Bucket(this, 'CorpusBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      versioned: true,
      removalPolicy,
      autoDeleteObjects: props.config.environmentName !== 'prod',
    });

    const collectionResource = `collection/${props.config.bedrockCollectionName}`;

    const encryptionPolicy = new aoss.CfnSecurityPolicy(this, 'VectorStoreEncryptionPolicy', {
      name: `${props.config.bedrockCollectionName}-enc`,
      type: 'encryption',
      policy: JSON.stringify({
        Rules: [
          {
            ResourceType: 'collection',
            Resource: [collectionResource],
          },
        ],
        AWSOwnedKey: true,
      }),
    });

    const networkPolicy = new aoss.CfnSecurityPolicy(this, 'VectorStoreNetworkPolicy', {
      name: `${props.config.bedrockCollectionName}-net`,
      type: 'network',
      policy: JSON.stringify([
        {
          Rules: [
            {
              ResourceType: 'collection',
              Resource: [collectionResource],
            },
            {
              ResourceType: 'dashboard',
              Resource: [collectionResource],
            },
          ],
          AllowFromPublic: true,
        },
      ]),
    });

    const collection = new aoss.CfnCollection(this, 'VectorStoreCollection', {
      name: props.config.bedrockCollectionName,
      type: 'VECTORSEARCH',
      standbyReplicas: 'DISABLED',
      description: 'Simple Tarot Bedrock Knowledge Base vector store',
    });
    collection.addDependency(encryptionPolicy);
    collection.addDependency(networkPolicy);

    const knowledgeBaseRole = new iam.Role(this, 'KnowledgeBaseRole', {
      assumedBy: new iam.ServicePrincipal('bedrock.amazonaws.com'),
    });

    corpusBucket.grantRead(knowledgeBaseRole);
    knowledgeBaseRole.addToPolicy(new iam.PolicyStatement({
      actions: ['bedrock:InvokeModel'],
      resources: [
        `arn:aws:bedrock:${props.config.awsRegion}::foundation-model/${props.config.bedrockEmbeddingModelId}`,
      ],
    }));
    knowledgeBaseRole.addToPolicy(new iam.PolicyStatement({
      actions: ['aoss:APIAccessAll'],
      resources: [collection.attrArn],
    }));

    const dataAccessPolicy = new aoss.CfnAccessPolicy(this, 'VectorStoreDataAccessPolicy', {
      name: `${props.config.bedrockCollectionName}-data`,
      type: 'data',
      policy: JSON.stringify([
        {
          Rules: [
            {
              ResourceType: 'collection',
              Resource: [collectionResource],
              Permission: [
                'aoss:CreateCollectionItems',
                'aoss:DeleteCollectionItems',
                'aoss:DescribeCollectionItems',
                'aoss:UpdateCollectionItems',
              ],
            },
            {
              ResourceType: 'index',
              Resource: [`index/${props.config.bedrockCollectionName}/*`],
              Permission: [
                'aoss:CreateIndex',
                'aoss:DeleteIndex',
                'aoss:DescribeIndex',
                'aoss:ReadDocument',
                'aoss:UpdateIndex',
                'aoss:WriteDocument',
              ],
            },
          ],
          Principal: [knowledgeBaseRole.roleArn],
        },
      ]),
    });

    const vectorIndex = new aoss.CfnIndex(this, 'VectorStoreIndex', {
      collectionEndpoint: collection.attrCollectionEndpoint,
      indexName: props.config.bedrockVectorIndexName,
      settings: {
        index: {
          knn: true,
        },
      },
      mappings: {
        properties: {
          [VECTOR_FIELD]: {
            type: 'knn_vector',
            dimension: props.config.bedrockEmbeddingDimensions,
            method: {
              name: 'hnsw',
              engine: 'faiss',
              spaceType: 'l2',
            },
          },
          [TEXT_FIELD]: {
            type: 'text',
          },
          [METADATA_FIELD]: {
            type: 'text',
          },
        },
      },
    });
    vectorIndex.addDependency(collection);
    vectorIndex.addDependency(dataAccessPolicy);

    const knowledgeBase = new bedrock.CfnKnowledgeBase(this, 'KnowledgeBase', {
      name: props.config.bedrockKnowledgeBaseName,
      description: 'Simple Tarot generative readings Knowledge Base',
      roleArn: knowledgeBaseRole.roleArn,
      knowledgeBaseConfiguration: {
        type: 'VECTOR',
        vectorKnowledgeBaseConfiguration: {
          embeddingModelArn: `arn:aws:bedrock:${props.config.awsRegion}::foundation-model/${props.config.bedrockEmbeddingModelId}`,
          embeddingModelConfiguration: {
            bedrockEmbeddingModelConfiguration: {
              dimensions: props.config.bedrockEmbeddingDimensions,
            },
          },
        },
      },
      storageConfiguration: {
        type: 'OPENSEARCH_SERVERLESS',
        opensearchServerlessConfiguration: {
          collectionArn: collection.attrArn,
          vectorIndexName: props.config.bedrockVectorIndexName,
          fieldMapping: {
            vectorField: VECTOR_FIELD,
            textField: TEXT_FIELD,
            metadataField: METADATA_FIELD,
          },
        },
      },
    });
    knowledgeBase.addDependency(vectorIndex);

    const dataSource = new bedrock.CfnDataSource(this, 'CorpusDataSource', {
      name: props.config.bedrockDataSourceName,
      description: 'Simple Tarot normalized corpus documents in S3',
      knowledgeBaseId: knowledgeBase.attrKnowledgeBaseId,
      dataSourceConfiguration: {
        type: 'S3',
        s3Configuration: {
          bucketArn: corpusBucket.bucketArn,
          inclusionPrefixes: [props.config.bedrockCorpusPrefix],
        },
      },
      vectorIngestionConfiguration: {
        chunkingConfiguration: {
          chunkingStrategy: 'FIXED_SIZE',
          fixedSizeChunkingConfiguration: {
            maxTokens: 512,
            overlapPercentage: 20,
          },
        },
      },
    });

    new cdk.CfnOutput(this, 'BedrockCorpusBucketName', {
      value: corpusBucket.bucketName,
    });
    new cdk.CfnOutput(this, 'BedrockKnowledgeBaseId', {
      value: knowledgeBase.attrKnowledgeBaseId,
    });
    new cdk.CfnOutput(this, 'BedrockDataSourceId', {
      value: dataSource.attrDataSourceId,
    });
    new cdk.CfnOutput(this, 'BedrockRegion', {
      value: props.config.awsRegion,
    });
    new cdk.CfnOutput(this, 'BedrockGenerationModelId', {
      value: props.config.bedrockGenerationModelId,
    });
    new cdk.CfnOutput(this, 'BedrockEmbeddingModelId', {
      value: props.config.bedrockEmbeddingModelId,
    });
  }
}
