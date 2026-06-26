import * as cdk from 'aws-cdk-lib/core';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { BedrockRagStack } from '../lib/bedrock-rag-stack';
import { getInfraConfig } from '../lib/config';

const expectedRegion = 'us-east-1';

const baseEnv = {
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

  it('creates an OpenSearch Serverless vector collection and index', () => {
    const template = synthesizeBedrockStack();

    template.hasResourceProperties('AWS::OpenSearchServerless::Collection', {
      Name: 'st-dev-rag',
      Type: 'VECTORSEARCH',
      StandbyReplicas: 'DISABLED',
    });

    template.hasResourceProperties('AWS::OpenSearchServerless::Index', {
      IndexName: 'tarot-readings',
      Settings: {
        Index: {
          Knn: true,
        },
      },
      Mappings: {
        Properties: {
          'bedrock-vector': Match.objectLike({
            Type: 'knn_vector',
            Dimension: 1024,
          }),
          'bedrock-text': {
            Type: 'text',
          },
          'bedrock-metadata': {
            Type: 'text',
          },
        },
      },
    });
  });

  it('creates Bedrock access, network, and encryption policies for the vector store', () => {
    const template = synthesizeBedrockStack();

    template.resourceCountIs('AWS::OpenSearchServerless::SecurityPolicy', 2);
    template.hasResourceProperties('AWS::OpenSearchServerless::SecurityPolicy', {
      Name: 'st-dev-rag-enc',
      Type: 'encryption',
      Policy: Match.serializedJson(Match.objectLike({
        AWSOwnedKey: true,
      })),
    });
    template.hasResourceProperties('AWS::OpenSearchServerless::SecurityPolicy', {
      Name: 'st-dev-rag-net',
      Type: 'network',
      Policy: Match.serializedJson(Match.arrayWith([
        Match.objectLike({
          AllowFromPublic: true,
        }),
      ])),
    });
    template.hasResourceProperties('AWS::OpenSearchServerless::AccessPolicy', {
      Name: 'st-dev-rag-data',
      Type: 'data',
    });
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
        Type: 'OPENSEARCH_SERVERLESS',
        OpensearchServerlessConfiguration: {
          VectorIndexName: 'tarot-readings',
          FieldMapping: {
            VectorField: 'bedrock-vector',
            TextField: 'bedrock-text',
            MetadataField: 'bedrock-metadata',
          },
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
      'BedrockEmbeddingModelId',
    ]) {
      template.hasOutput(outputName, {});
    }

    template.hasOutput('BedrockRegion', {
      Value: expectedRegion,
    });
    template.hasOutput('BedrockGenerationModelId', {
      Value: 'anthropic.claude-3-haiku-20240307-v1:0',
    });
  });
});
