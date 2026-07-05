import * as cdk from 'aws-cdk-lib/core';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { UserDataStack } from '../lib/user-data-stack';
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

function synthesizeUserDataStack(environmentName: 'dev' | 'prod' = 'dev') {
  const app = new cdk.App();
  const config = getInfraConfig({
    app,
    environmentName,
    env: baseEnv,
  });

  const stack = new UserDataStack(app, 'TestUserDataStack', {
    config,
    env: {
      account: '123456789012',
      region: config.awsRegion,
    },
  });

  return Template.fromStack(stack);
}

describe('UserDataStack', () => {
  it('creates the user data table for reading history', () => {
    const template = synthesizeUserDataStack();

    template.hasResourceProperties('AWS::DynamoDB::Table', {
      TableName: 'simple-tarot-dev-user-data',
      BillingMode: 'PAY_PER_REQUEST',
      AttributeDefinitions: [
        {
          AttributeName: 'pk',
          AttributeType: 'S',
        },
        {
          AttributeName: 'sk',
          AttributeType: 'S',
        },
      ],
      KeySchema: [
        {
          AttributeName: 'pk',
          KeyType: 'HASH',
        },
        {
          AttributeName: 'sk',
          KeyType: 'RANGE',
        },
      ],
      SSESpecification: {
        SSEEnabled: false,
      },
    });
  });

  it('creates the S3 API log bucket with secure defaults and retention', () => {
    const template = synthesizeUserDataStack();

    template.hasResourceProperties('AWS::S3::Bucket', {
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true,
      },
      BucketEncryption: {
        ServerSideEncryptionConfiguration: [
          {
            ServerSideEncryptionByDefault: {
              SSEAlgorithm: 'AES256',
            },
          },
        ],
      },
      LifecycleConfiguration: {
        Rules: Match.arrayWith([
          Match.objectLike({
            ExpirationInDays: 30,
            Status: 'Enabled',
          }),
        ]),
      },
    });

    template.hasResourceProperties('AWS::S3::BucketPolicy', {
      PolicyDocument: {
        Statement: Match.arrayWith([
          Match.objectLike({
            Action: 's3:*',
            Condition: {
              Bool: {
                'aws:SecureTransport': 'false',
              },
            },
            Effect: 'Deny',
          }),
        ]),
      },
    });
  });

  it('protects production data from accidental deletion', () => {
    const template = synthesizeUserDataStack('prod');

    template.hasResource('AWS::DynamoDB::Table', {
      UpdateReplacePolicy: 'Retain',
      DeletionPolicy: 'Retain',
      Properties: Match.objectLike({
        PointInTimeRecoverySpecification: {
          PointInTimeRecoveryEnabled: true,
        },
        TableName: 'simple-tarot-prod-user-data',
      }),
    });

    template.hasResource('AWS::S3::Bucket', {
      UpdateReplacePolicy: 'Retain',
      DeletionPolicy: 'Retain',
      Properties: Match.objectLike({
        LifecycleConfiguration: {
          Rules: Match.arrayWith([
            Match.objectLike({
              ExpirationInDays: 365,
              Status: 'Enabled',
            }),
          ]),
        },
      }),
    });
  });

  it('emits handoff outputs for API runtime configuration', () => {
    const template = synthesizeUserDataStack();

    for (const outputName of [
      'UserDataTableName',
      'UserDataTableArn',
      'ApiLogBucketName',
      'ApiLogBucketArn',
    ]) {
      template.hasOutput(outputName, {});
    }

    template.hasOutput('UserDataTableName', {
      Value: 'simple-tarot-dev-user-data',
    });
  });
});
