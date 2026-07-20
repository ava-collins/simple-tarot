import * as cdk from 'aws-cdk-lib/core';
import { Template } from 'aws-cdk-lib/assertions';
import { getInfraConfig, type SimpleTarotEnvironment } from '../lib/config';
import { SimpleTarotStage } from '../lib/simple-tarot-stage';

const account = '123456789012';
const region = 'us-east-2';

function synthesize(environmentName: SimpleTarotEnvironment) {
  const app = new cdk.App();
  const config = getInfraConfig({
    app,
    environmentName,
    env: {
      SIMPLE_TAROT_ENV: environmentName,
      SIMPLE_TAROT_AWS_REGION: region,
      SIMPLE_TAROT_MOBILE_CALLBACK_URL: 'simpletarot://auth/callback',
      SIMPLE_TAROT_MOBILE_LOGOUT_URL: 'simpletarot://auth/logout',
      SIMPLE_TAROT_WEB_CALLBACK_URL: 'https://example.com/auth/callback',
      SIMPLE_TAROT_WEB_LOGOUT_URL: 'https://example.com/auth/logout',
      SIMPLE_TAROT_COGNITO_DOMAIN_PREFIX: `simple-tarot-${environmentName}`,
    },
  });
  const suffix = environmentName === 'dev' ? 'Dev' : 'Prod';
  const stage = new SimpleTarotStage(app, `SimpleTarot${suffix}`, {
    config,
    env: { account, region },
  });

  return { assembly: app.synth(), stage };
}

describe('SimpleTarotStage', () => {
  it.each([
    [
      'dev',
      'SimpleTarotCognito-dev',
      'SimpleTarotUserData-dev',
      'SimpleTarotBedrockRag-dev',
      'SimpleTarotApi-dev',
    ],
    [
      'prod',
      'SimpleTarotCognito-prod',
      'SimpleTarotUserData-prod',
      'SimpleTarotBedrockRag-prod',
      'SimpleTarotApi-prod',
    ],
  ] as const)(
    'keeps stable %s stack names',
    (environment, cognito, data, bedrock, api) => {
      const { stage } = synthesize(environment);
      expect(stage.cognitoStack.stackName).toBe(cognito);
      expect(stage.userDataStack.stackName).toBe(data);
      expect(stage.bedrockStack.stackName).toBe(bedrock);
      expect(stage.apiStack.stackName).toBe(api);
    }
  );

  it.each(['dev', 'prod'] as const)(
    'uses the standard CDK bootstrap roles for every %s artifact',
    (environment) => {
      const { assembly, stage } = synthesize(environment);

      for (const stack of [
        stage.cognitoStack,
        stage.userDataStack,
        stage.bedrockStack,
        stage.apiStack,
      ]) {
        const artifact = assembly.getStackArtifact(stack.artifactId);
        expect(artifact.assumeRoleArn).toBe(
          `arn:\${AWS::Partition}:iam::${account}:role/` +
          `cdk-hnb659fds-deploy-role-${account}-${region}`
        );
        expect(artifact.cloudFormationExecutionRoleArn).toBe(
          `arn:\${AWS::Partition}:iam::${account}:role/` +
          `cdk-hnb659fds-cfn-exec-role-${account}-${region}`
        );
      }
    }
  );

  it('wires Bedrock stack outputs into the API Lambda', () => {
    const template = Template.fromStack(synthesize('dev').stage.apiStack);
    const fn = Object.values(template.findResources('AWS::Lambda::Function'))[0];
    const variables = fn.Properties.Environment.Variables;

    expect(JSON.stringify(variables.API_LOG_BUCKET_NAME)).toContain(
      'SimpleTarotUserData-dev'
    );
    expect(variables.BEDROCK_RUNTIME_MODE).toBe('bedrock');
    expect(variables.COMPOSER_RUNTIME_MODE).toBe('enabled');
    expect(variables.API_AUTH_MODE).toBe('cognito');
    expect(variables.EVALUATION_RUNTIME_MODE).toBe('enabled');
    expect(JSON.stringify(variables.COGNITO_CLIENT_ID)).toContain(
      'SimpleTarotCognito-dev'
    );
    expect(JSON.stringify(variables.COGNITO_ISSUER)).toContain(
      'SimpleTarotCognito-dev'
    );
    expect(variables.BEDROCK_REGION).toBe('us-east-2');
    expect(JSON.stringify(variables.BEDROCK_KNOWLEDGE_BASE_ID)).toContain(
      'SimpleTarotBedrockRag-dev'
    );
    expect(JSON.stringify(variables.BEDROCK_INFERENCE_PROFILE_ARN)).toContain(
      'SimpleTarotBedrockRag-dev'
    );
    expect(JSON.stringify(variables.BEDROCK_CORPUS_BUCKET)).toContain(
      'SimpleTarotBedrockRag-dev'
    );
    expect(JSON.stringify(variables.BEDROCK_DATA_SOURCE_ID)).toContain(
      'SimpleTarotBedrockRag-dev'
    );
    expect(variables.USER_DATA_TABLE_NAME).toBe('simple-tarot-dev-user-data');
  });

  it('keeps production composer disabled without cross-stack artifact identities', () => {
    const template = Template.fromStack(synthesize('prod').stage.apiStack);
    const fn = Object.values(template.findResources('AWS::Lambda::Function'))[0];
    const variables = fn.Properties.Environment.Variables;

    expect(variables.COMPOSER_RUNTIME_MODE).toBe('disabled');
    expect(variables).not.toHaveProperty('API_AUTH_MODE');
    expect(variables).not.toHaveProperty('BEDROCK_CORPUS_BUCKET');
    expect(variables).not.toHaveProperty('BEDROCK_DATA_SOURCE_ID');
    expect(variables).not.toHaveProperty('COGNITO_CLIENT_ID');
    expect(variables).not.toHaveProperty('COGNITO_ISSUER');
    expect(variables).not.toHaveProperty('EVALUATION_RUNTIME_MODE');
  });

  it('tags owned resources', () => {
    const template = Template.fromStack(synthesize('prod').stage.cognitoStack);
    template.hasResourceProperties('AWS::Cognito::UserPool', {
      UserPoolName: 'simple-tarot-prod-users',
      UserPoolTags: {
        Application: 'SimpleTarot',
        Environment: 'prod',
        ManagedBy: 'CDK',
      },
    });
  });
});
