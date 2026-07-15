import * as cdk from 'aws-cdk-lib/core';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { ApiStack } from '../lib/api-stack';
import { BedrockRagStack } from '../lib/bedrock-rag-stack';
import { CognitoStack } from '../lib/cognito-stack';
import { getInfraConfig } from '../lib/config';
import { UserDataStack } from '../lib/user-data-stack';

const expectedRegion = 'us-east-2';

const baseEnv = {
  SIMPLE_TAROT_ENV: 'dev',
  SIMPLE_TAROT_AWS_REGION: expectedRegion,
  SIMPLE_TAROT_MOBILE_CALLBACK_URL: 'simpletarot://auth/callback',
  SIMPLE_TAROT_MOBILE_LOGOUT_URL: 'simpletarot://auth/logout',
  SIMPLE_TAROT_WEB_CALLBACK_URL: 'https://example.com/auth/callback',
  SIMPLE_TAROT_WEB_LOGOUT_URL: 'https://example.com/auth/logout',
  SIMPLE_TAROT_COGNITO_DOMAIN_PREFIX: 'simple-tarot-test',
  SIMPLE_TAROT_AOSS_INDEX_PRINCIPAL_ARN:
    'arn:aws:iam::123456789012:role/cdk-hnb659fds-cfn-exec-role-123456789012-us-east-2',
};

function synthesizeApiStack() {
  const app = new cdk.App();
  const config = getInfraConfig({
    app,
    environmentName: 'dev',
    env: baseEnv,
  });

  const cognitoStack = new CognitoStack(app, 'TestCognitoStack', {
    config,
    env: {
      account: '123456789012',
      region: config.awsRegion,
    },
  });
  const userDataStack = new UserDataStack(app, 'TestUserDataStack', {
    config,
    env: {
      account: '123456789012',
      region: config.awsRegion,
    },
  });
  const bedrockStack = new BedrockRagStack(app, 'TestBedrockRagStack', {
    config,
    env: {
      account: '123456789012',
      region: config.awsRegion,
    },
  });
  const apiStack = new ApiStack(app, 'TestApiStack', {
    apiLogBucket: userDataStack.apiLogBucket,
    config,
    env: {
      account: '123456789012',
      region: config.awsRegion,
    },
    generationInferenceProfile: bedrockStack.generationInferenceProfile,
    knowledgeBase: bedrockStack.knowledgeBase,
    userDataTable: userDataStack.userDataTable,
    userPool: cognitoStack.userPool,
    userPoolClient: cognitoStack.userPoolClient,
  });

  return Template.fromStack(apiStack);
}

describe('ApiStack', () => {
  it('creates a Node 22 Lambda function for the Express API', () => {
    const template = synthesizeApiStack();

    template.hasResourceProperties('AWS::Lambda::Function', {
      FunctionName: 'simple-tarot-dev-api',
      Handler: 'index.handler',
      Runtime: 'nodejs22.x',
      Environment: {
        Variables: Match.objectLike({
          API_LOG_BUCKET_NAME: Match.anyValue(),
          BEDROCK_INFERENCE_PROFILE_ARN: Match.anyValue(),
          BEDROCK_KNOWLEDGE_BASE_ID: Match.anyValue(),
          BEDROCK_REGION: expectedRegion,
          BEDROCK_RUNTIME_MODE: 'bedrock',
          USER_DATA_TABLE_NAME: Match.anyValue(),
        }),
      },
    });
  });

  it('creates an HTTP API protected by the Cognito JWT authorizer', () => {
    const template = synthesizeApiStack();

    template.hasResourceProperties('AWS::ApiGatewayV2::Api', {
      Name: 'simple-tarot-dev-api',
      ProtocolType: 'HTTP',
      CorsConfiguration: {
        AllowHeaders: ['authorization', 'content-type', 'x-request-id'],
        AllowMethods: ['*'],
        AllowOrigins: ['*'],
      },
    });
    template.hasResourceProperties('AWS::ApiGatewayV2::Authorizer', {
      AuthorizerType: 'JWT',
      IdentitySource: ['$request.header.Authorization'],
      JwtConfiguration: {
        Audience: Match.anyValue(),
        Issuer: Match.anyValue(),
      },
      Name: 'CognitoJwtAuthorizer',
    });
    template.resourceCountIs('AWS::ApiGatewayV2::Route', 2);
    template.allResourcesProperties('AWS::ApiGatewayV2::Route', {
      AuthorizationType: 'JWT',
    });
    template.hasResourceProperties('AWS::ApiGatewayV2::Route', {
      AuthorizationType: 'JWT',
      RouteKey: 'ANY /{proxy+}',
    });
    template.hasResourceProperties('AWS::ApiGatewayV2::Route', {
      AuthorizationType: 'JWT',
      RouteKey: 'ANY /',
    });
  });

  it('grants the Lambda least-privilege user-data and log access', () => {
    const template = synthesizeApiStack();
    const policies = JSON.stringify(template.findResources('AWS::IAM::Policy'));

    expect(policies).toContain('dynamodb:PutItem');
    expect(policies).toContain('dynamodb:Query');
    expect(policies).toContain('s3:PutObject');
    expect(policies).toContain('/api-logs/*');
  });

  it('grants only the Bedrock Agent Runtime generation action', () => {
    const template = synthesizeApiStack();
    const policies = JSON.stringify(template.findResources('AWS::IAM::Policy'));

    expect(policies).toContain('bedrock:RetrieveAndGenerate');
    expect(policies).not.toContain('bedrock:InvokeModel');
    expect(policies).not.toContain('bedrock:*');
  });

  it('emits API handoff outputs for the mobile client and later stages', () => {
    const template = synthesizeApiStack();

    for (const outputName of ['ApiUrl', 'ApiFunctionName', 'ApiFunctionArn']) {
      template.hasOutput(outputName, {});
    }

    template.hasOutput('ApiFunctionName', {
      Value: 'simple-tarot-dev-api',
    });
  });
});
