import * as cdk from 'aws-cdk-lib/core';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { ApiStack } from '../lib/api-stack';
import { BedrockRagStack } from '../lib/bedrock-rag-stack';
import { CognitoStack } from '../lib/cognito-stack';
import { getInfraConfig } from '../lib/config';
import { UserDataStack } from '../lib/user-data-stack';
import type { SimpleTarotEnvironment } from '../lib/config';

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

function synthesizeApiStack(environmentName: SimpleTarotEnvironment = 'dev') {
  const app = new cdk.App();
  const config = getInfraConfig({
    app,
    environmentName,
    env: {
      ...baseEnv,
      SIMPLE_TAROT_ENV: environmentName,
    },
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
    corpusBucket: bedrockStack.corpusBucket,
    dataSource: bedrockStack.dataSource,
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
      Timeout: 29,
      Environment: {
        Variables: Match.objectLike({
          API_AUTH_MODE: 'cognito',
          API_LOG_BUCKET_NAME: Match.anyValue(),
          BEDROCK_INFERENCE_PROFILE_ARN: Match.anyValue(),
          BEDROCK_KNOWLEDGE_BASE_ID: Match.anyValue(),
          BEDROCK_REGION: expectedRegion,
          BEDROCK_RUNTIME_MODE: 'bedrock',
          COMPOSER_RUNTIME_MODE: 'enabled',
          COGNITO_CLIENT_ID: Match.anyValue(),
          COGNITO_ISSUER: Match.anyValue(),
          EVALUATION_RUNTIME_MODE: 'enabled',
          BEDROCK_CORPUS_BUCKET: Match.anyValue(),
          BEDROCK_DATA_SOURCE_ID: Match.anyValue(),
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

  it('grants development exactly the composer object read patterns without list or write access', () => {
    const template = synthesizeApiStack('dev');
    const policies = Object.values(template.findResources('AWS::IAM::Policy'));
    const statements = policies.flatMap(
      (policy) => policy.Properties.PolicyDocument.Statement
    );
    const composerRead = statements.find(
      (statement) => statement.Action === 's3:GetObject'
    );

    expect(composerRead).toBeDefined();
    expect(JSON.stringify(composerRead.Resource)).toContain(
      '/state/dev/active-release.json'
    );
    expect(JSON.stringify(composerRead.Resource)).toContain(
      '/releases/*/manifest.json'
    );
    expect(JSON.stringify(composerRead.Resource)).toContain(
      '/releases/*/composer-bundle.json'
    );
    expect(JSON.stringify(composerRead.Resource)).not.toContain('corpus/active');
    expect(JSON.stringify(statements)).not.toContain('s3:ListBucket');
    expect(JSON.stringify(composerRead)).not.toMatch(/PutObject|DeleteObject|CopyObject/);
  });

  it('keeps production composer disabled without identities or corpus read access', () => {
    const template = synthesizeApiStack('prod');
    const fn = Object.values(template.findResources('AWS::Lambda::Function'))[0];
    const variables = fn.Properties.Environment.Variables;
    const policies = JSON.stringify(template.findResources('AWS::IAM::Policy'));

    expect(variables.COMPOSER_RUNTIME_MODE).toBe('disabled');
    expect(variables).not.toHaveProperty('API_AUTH_MODE');
    expect(variables).not.toHaveProperty('BEDROCK_CORPUS_BUCKET');
    expect(variables).not.toHaveProperty('BEDROCK_DATA_SOURCE_ID');
    expect(variables).not.toHaveProperty('COGNITO_CLIENT_ID');
    expect(variables).not.toHaveProperty('COGNITO_ISSUER');
    expect(variables).not.toHaveProperty('EVALUATION_RUNTIME_MODE');
    expect(policies).not.toContain('s3:GetObject');
    expect(policies).not.toContain('/state/dev/active-release.json');
  });

  it('adds no evaluation resource or IAM permission', () => {
    const devTemplate = synthesizeApiStack('dev').toJSON();
    const prodTemplate = synthesizeApiStack('prod').toJSON();
    const devResourceTypes = Object.values(devTemplate.Resources).map(
      (resource) => (resource as { Type: string }).Type
    );
    const prodResourceTypes = Object.values(prodTemplate.Resources).map(
      (resource) => (resource as { Type: string }).Type
    );

    expect(devResourceTypes.sort()).toEqual(prodResourceTypes.sort());
    expect(JSON.stringify(devTemplate.Resources)).not.toContain(
      'reading-evaluations'
    );
    expect(JSON.stringify(devTemplate.Resources)).not.toContain(
      'EvaluationRuntime'
    );
  });

  it('grants only the explicit Bedrock retrieval and generation actions', () => {
    const template = synthesizeApiStack();
    const policies = JSON.stringify(template.findResources('AWS::IAM::Policy'));

    expect(policies).not.toContain('bedrock:RetrieveAndGenerate');
    expect(policies).toContain('bedrock:GetInferenceProfile');
    expect(policies).toContain('"bedrock:Retrieve"');
    expect(policies).toContain('bedrock:InvokeModel');
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
