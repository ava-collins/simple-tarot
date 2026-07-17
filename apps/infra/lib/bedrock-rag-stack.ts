import * as bedrock from 'aws-cdk-lib/aws-bedrock';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3vectors from 'aws-cdk-lib/aws-s3vectors';
import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import { InfraConfig } from './config';

export interface BedrockRagStackProps extends cdk.StackProps {
  config: InfraConfig;
}

export class BedrockRagStack extends cdk.Stack {
  public readonly generationInferenceProfile: bedrock.CfnApplicationInferenceProfile;
  public readonly knowledgeBase: bedrock.CfnKnowledgeBase;

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
      autoDeleteObjects: props.config.environmentName !== 'prod'
    });

    const knowledgeBaseRole = new iam.Role(this, 'KnowledgeBaseRole', {
      assumedBy: new iam.ServicePrincipal('bedrock.amazonaws.com')
    });

    corpusBucket.grantRead(knowledgeBaseRole);
    knowledgeBaseRole.addToPolicy(new iam.PolicyStatement({
      actions: ['bedrock:InvokeModel'],
      resources: [
        `arn:aws:bedrock:${props.config.awsRegion}::foundation-model/${props.config.bedrockEmbeddingModelId}`
      ]
    }));

    const vectorBucket = new s3vectors.CfnVectorBucket(this, 'VectorBucket', {
      vectorBucketName: props.config.bedrockVectorBucketName
    });

    const vectorIndex = new s3vectors.CfnIndex(this, 'S3VectorsIndex', {
      vectorBucketArn: vectorBucket.attrVectorBucketArn,
      indexName: props.config.bedrockVectorIndexName,
      dataType: 'float32',
      dimension: props.config.bedrockEmbeddingDimensions,
      distanceMetric: 'cosine',
      metadataConfiguration: {
        nonFilterableMetadataKeys: [
          'cardIndex',
          'cardName',
          'keywords',
          'orientation',
          'position',
          'sourceCollection',
          'sourcePath',
          'spread'
        ]
      }
    });
    vectorIndex.addDependency(vectorBucket);

    knowledgeBaseRole.addToPolicy(new iam.PolicyStatement({
      actions: [
        's3vectors:PutVectors',
        's3vectors:GetVectors',
        's3vectors:DeleteVectors',
        's3vectors:QueryVectors',
        's3vectors:GetIndex'
      ],
      resources: [vectorIndex.attrIndexArn]
    }));

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
              dimensions: props.config.bedrockEmbeddingDimensions
            }
          }
        }
      },
      storageConfiguration: {
        type: 'S3_VECTORS',
        s3VectorsConfiguration: {
          indexArn: vectorIndex.attrIndexArn
        }
      }
    });
    knowledgeBase.addDependency(vectorIndex);
    knowledgeBase.node.addDependency(knowledgeBaseRole);
    this.knowledgeBase = knowledgeBase;

    const isDevelopment = props.config.environmentName === 'dev';
    const dataSourceConstructId = isDevelopment
      ? 'SelectiveCorpusDataSource'
      : 'CorpusDataSource';
    const chunkingConfiguration = props.config.bedrockChunkingStrategy === 'NONE'
      ? { chunkingStrategy: 'NONE' }
      : {
          chunkingStrategy: 'FIXED_SIZE',
          fixedSizeChunkingConfiguration: {
            maxTokens: 200,
            overlapPercentage: 20
          }
        };

    const dataSource = new bedrock.CfnDataSource(this, dataSourceConstructId, {
      name: props.config.bedrockDataSourceName,
      description: 'Simple Tarot normalized corpus documents in S3',
      knowledgeBaseId: knowledgeBase.attrKnowledgeBaseId,
      dataDeletionPolicy: isDevelopment ? 'DELETE' : undefined,
      dataSourceConfiguration: {
        type: 'S3',
        s3Configuration: {
          bucketArn: corpusBucket.bucketArn,
          inclusionPrefixes: [props.config.bedrockCorpusPrefix]
        }
      },
      vectorIngestionConfiguration: {
        chunkingConfiguration
      }
    });

    const generationInferenceProfile = new bedrock.CfnApplicationInferenceProfile(
      this,
      'GenerationInferenceProfile',
      {
        description: 'Simple Tarot single-region reading generation profile',
        inferenceProfileName: props.config.bedrockGenerationInferenceProfileName,
        modelSource: {
          copyFrom: `arn:aws:bedrock:${props.config.awsRegion}::foundation-model/${props.config.bedrockGenerationModelId}`
        }
      }
    );
    this.generationInferenceProfile = generationInferenceProfile;

    new cdk.CfnOutput(this, 'BedrockCorpusBucketName', {
      value: corpusBucket.bucketName
    });
    new cdk.CfnOutput(this, 'BedrockKnowledgeBaseId', {
      value: knowledgeBase.attrKnowledgeBaseId
    });
    new cdk.CfnOutput(this, 'BedrockDataSourceId', {
      value: dataSource.attrDataSourceId
    });
    new cdk.CfnOutput(this, 'BedrockRegion', {
      value: props.config.awsRegion
    });
    new cdk.CfnOutput(this, 'BedrockGenerationModelId', {
      value: props.config.bedrockGenerationModelId
    });
    new cdk.CfnOutput(this, 'BedrockInferenceProfileArn', {
      value: generationInferenceProfile.attrInferenceProfileArn
    });
    new cdk.CfnOutput(this, 'BedrockEmbeddingModelId', {
      value: props.config.bedrockEmbeddingModelId
    });
  }
}
