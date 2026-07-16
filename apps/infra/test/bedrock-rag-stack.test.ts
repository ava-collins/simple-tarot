import * as cdk from 'aws-cdk-lib/core';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { BedrockRagStack } from '../lib/bedrock-rag-stack';
import { getInfraConfig } from '../lib/config';

const expectedRegion = 'us-east-2';

const baseEnv = {
  SIMPLE_TAROT_ENV: 'dev',
  SIMPLE_TAROT_AWS_REGION: expectedRegion,
  SIMPLE_TAROT_MOBILE_CALLBACK_URL: 'simpletarot://auth/callback',
  SIMPLE_TAROT_MOBILE_LOGOUT_URL: 'simpletarot://auth/logout',
  SIMPLE_TAROT_WEB_CALLBACK_URL: 'https://example.com/auth/callback',
  SIMPLE_TAROT_WEB_LOGOUT_URL: 'https://example.com/auth/logout',
  SIMPLE_TAROT_COGNITO_DOMAIN_PREFIX: 'simple-tarot-test',
};

function synthesizeBedrockStack() {
  const app = new cdk.App();
  const config = getInfraConfig({
    app,
    environmentName: 'dev',
    env: baseEnv,
  });

  const stack = new BedrockRagStack(app, 'TestBedrockRagStack', {
    config,
    env: {
      account: '123456789012',
      region: config.awsRegion,
    },
  });

  return Template.fromStack(stack);
}

describe('BedrockRagStack', () => {
  it('creates the corpus bucket for Bedrock ingestion artifacts', () => {
    const template = synthesizeBedrockStack();

    template.hasResourceProperties('AWS::S3::Bucket', {
      VersioningConfiguration: {
        Status: 'Enabled',
      },
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true,
      },
    });
  });

  it('creates an S3 Vectors bucket and index', () => {
    const template = synthesizeBedrockStack();

    template.hasResourceProperties('AWS::S3Vectors::VectorBucket', {
      VectorBucketName: 'st-dev-vectors',
    });

    template.hasResourceProperties('AWS::S3Vectors::Index', {
      IndexName: 'tarot-readings',
      DataType: 'float32',
      Dimension: 1024,
      DistanceMetric: 'cosine',
    });
  });

  it('grants the Knowledge Base role S3 Vectors index permissions', () => {
    const template = synthesizeBedrockStack();
    const policies = JSON.stringify(template.findResources('AWS::IAM::Policy'));

    expect(policies).toContain('s3vectors:PutVectors');
    expect(policies).toContain('s3vectors:GetVectors');
    expect(policies).toContain('s3vectors:DeleteVectors');
    expect(policies).toContain('s3vectors:QueryVectors');
    expect(policies).toContain('s3vectors:GetIndex');
  });

  it('creates a single-region application inference profile', () => {
    const template = synthesizeBedrockStack();

    template.hasResourceProperties('AWS::Bedrock::ApplicationInferenceProfile', {
      InferenceProfileName: 'simple-tarot-dev-generation',
      ModelSource: {
        CopyFrom:
          'arn:aws:bedrock:us-east-2::foundation-model/' +
          'amazon.nova-lite-v1:0',
      },
    });
    template.hasOutput('BedrockInferenceProfileArn', {});
  });

  it('creates the Bedrock Knowledge Base and S3 data source', () => {
    const template = synthesizeBedrockStack();

    template.hasResourceProperties('AWS::Bedrock::KnowledgeBase', {
      Name: 'simple-tarot-dev-readings',
      KnowledgeBaseConfiguration: {
        Type: 'VECTOR',
        VectorKnowledgeBaseConfiguration: {
          EmbeddingModelArn: `arn:aws:bedrock:${expectedRegion}::foundation-model/amazon.titan-embed-text-v2:0`,
          EmbeddingModelConfiguration: {
            BedrockEmbeddingModelConfiguration: {
              Dimensions: 1024,
            },
          },
        },
      },
      StorageConfiguration: {
        Type: 'S3_VECTORS',
        S3VectorsConfiguration: {
          IndexArn: Match.anyValue(),
        },
      },
    });

    template.hasResourceProperties('AWS::Bedrock::DataSource', {
      Name: 'simple-tarot-dev-corpus',
      DataSourceConfiguration: {
        Type: 'S3',
        S3Configuration: {
          InclusionPrefixes: ['corpus/'],
        },
      },
      VectorIngestionConfiguration: {
        ChunkingConfiguration: {
          ChunkingStrategy: 'FIXED_SIZE',
          FixedSizeChunkingConfiguration: {
            MaxTokens: 512,
            OverlapPercentage: 20,
          },
        },
      },
    });
  });

  it('emits API handoff outputs for runtime configuration', () => {
    const template = synthesizeBedrockStack();

    for (const outputName of [
      'BedrockCorpusBucketName',
      'BedrockKnowledgeBaseId',
      'BedrockDataSourceId',
      'BedrockRegion',
      'BedrockGenerationModelId',
      'BedrockInferenceProfileArn',
      'BedrockEmbeddingModelId',
    ]) {
      template.hasOutput(outputName, {});
    }

    template.hasOutput('BedrockRegion', {
      Value: expectedRegion,
    });
    template.hasOutput('BedrockGenerationModelId', {
      Value: 'amazon.nova-lite-v1:0',
    });
  });
});
