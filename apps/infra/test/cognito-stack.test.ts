import * as cdk from 'aws-cdk-lib/core';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { CognitoStack } from '../lib/cognito-stack';
import { getInfraConfig, loadInfraEnv } from '../lib/config';

const expectedRegion = 'aws-region-from-env';
const expectedMobileCallbackUrl = 'mobile-callback-url-from-env';
const expectedMobileLogoutUrl = 'mobile-logout-url-from-env';
const expectedWebCallbackUrl = 'web-callback-url-from-env';
const expectedWebLogoutUrl = 'web-logout-url-from-env';
const expectedDomainPrefix = 'domain-prefix-from-env';

const outputNames = [
  'CognitoUserPoolId',
  'CognitoUserPoolClientId',
  'CognitoDomain',
  'CognitoIssuer',
  'CognitoMobileCallbackUrl',
  'CognitoMobileLogoutUrl',
  'CognitoWebCallbackUrl',
  'CognitoWebLogoutUrl',
  'AwsRegion',
];

function synthesizeDevStack() {
  const app = new cdk.App();
  const config = getInfraConfig({
    app,
    environmentName: 'dev',
    env: {
      SIMPLE_TAROT_AWS_REGION: expectedRegion,
      SIMPLE_TAROT_MOBILE_CALLBACK_URL: expectedMobileCallbackUrl,
      SIMPLE_TAROT_MOBILE_LOGOUT_URL: expectedMobileLogoutUrl,
      SIMPLE_TAROT_WEB_CALLBACK_URL: expectedWebCallbackUrl,
      SIMPLE_TAROT_WEB_LOGOUT_URL: expectedWebLogoutUrl,
      SIMPLE_TAROT_COGNITO_DOMAIN_PREFIX: expectedDomainPrefix,
    },
  });

  const stack = new CognitoStack(app, 'TestCognitoStack', {
    config,
    env: {
      account: '123456789012',
      region: config.awsRegion,
    },
  });

  return Template.fromStack(stack);
}

function synthesizeProdStack() {
  const app = new cdk.App();
  const config = getInfraConfig({
    app,
    environmentName: 'prod',
    env: {
      SIMPLE_TAROT_AWS_REGION: expectedRegion,
      SIMPLE_TAROT_MOBILE_CALLBACK_URL: expectedMobileCallbackUrl,
      SIMPLE_TAROT_MOBILE_LOGOUT_URL: expectedMobileLogoutUrl,
      SIMPLE_TAROT_WEB_CALLBACK_URL: expectedWebCallbackUrl,
      SIMPLE_TAROT_WEB_LOGOUT_URL: expectedWebLogoutUrl,
      SIMPLE_TAROT_COGNITO_DOMAIN_PREFIX: expectedDomainPrefix,
    },
  });

  const stack = new CognitoStack(app, 'TestProdCognitoStack', {
    config,
    env: {
      account: '123456789012',
      region: config.awsRegion,
    },
  });

  return Template.fromStack(stack);
}

describe('CognitoStack', () => {
  it('creates an email-first self-service user pool for dev', () => {
    const template = synthesizeDevStack();

    template.hasResourceProperties('AWS::Cognito::UserPool', {
      UserPoolName: 'simple-tarot-dev-users',
      UsernameAttributes: ['email'],
      AutoVerifiedAttributes: ['email'],
      AdminCreateUserConfig: {
        AllowAdminCreateUserOnly: false,
      },
      AccountRecoverySetting: {
        RecoveryMechanisms: [
          {
            Name: 'verified_email',
            Priority: 1,
          },
        ],
      },
      UsernameConfiguration: {
        CaseSensitive: false,
      },
      Policies: {
        PasswordPolicy: {
          MinimumLength: 12,
          RequireLowercase: true,
          RequireNumbers: true,
          RequireSymbols: true,
          RequireUppercase: true,
        },
      },
    });
  });

  it('creates a public OAuth client for authorization code and PKCE flows', () => {
    const template = synthesizeDevStack();

    template.hasResourceProperties('AWS::Cognito::UserPoolClient', {
      GenerateSecret: false,
      PreventUserExistenceErrors: 'ENABLED',
      ExplicitAuthFlows: [
        'ALLOW_USER_PASSWORD_AUTH',
        'ALLOW_USER_SRP_AUTH',
        'ALLOW_REFRESH_TOKEN_AUTH',
      ],
      AllowedOAuthFlowsUserPoolClient: true,
      AllowedOAuthFlows: ['code'],
      AllowedOAuthScopes: ['openid', 'email', 'profile'],
      CallbackURLs: [
        expectedMobileCallbackUrl,
        expectedWebCallbackUrl,
      ],
      LogoutURLs: [
        expectedMobileLogoutUrl,
        expectedWebLogoutUrl,
      ],
      SupportedIdentityProviders: ['COGNITO'],
    });
  });

  it('creates an environment-aware hosted Cognito domain', () => {
    const template = synthesizeDevStack();

    template.hasResourceProperties('AWS::Cognito::UserPoolDomain', {
      Domain: expectedDomainPrefix,
      UserPoolId: Match.anyValue(),
    });
  });

  it('emits the integration outputs needed by mobile and web clients', () => {
    const template = synthesizeDevStack();

    for (const outputName of outputNames) {
      template.hasOutput(outputName, {});
    }

    template.hasOutput('CognitoMobileCallbackUrl', {
      Value: expectedMobileCallbackUrl,
    });
    template.hasOutput('CognitoMobileLogoutUrl', {
      Value: expectedMobileLogoutUrl,
    });
    template.hasOutput('CognitoWebCallbackUrl', {
      Value: expectedWebCallbackUrl,
    });
    template.hasOutput('CognitoWebLogoutUrl', {
      Value: expectedWebLogoutUrl,
    });
    template.hasOutput('AwsRegion', {
      Value: expectedRegion,
    });
  });

  it('protects the production user pool from accidental deletion', () => {
    const template = synthesizeProdStack();

    template.hasResource('AWS::Cognito::UserPool', {
      UpdateReplacePolicy: 'Retain',
      DeletionPolicy: 'Retain',
      Properties: Match.objectLike({
        UserPoolName: 'simple-tarot-prod-users',
        DeletionProtection: 'ACTIVE',
      }),
    });
  });

  it('loads deployment values from an explicit env file', () => {
    const envDir = mkdtempSync(join(tmpdir(), 'simple-tarot-infra-'));
    const envFilePath = join(envDir, '.env');

    writeFileSync(envFilePath, [
      `SIMPLE_TAROT_AWS_REGION=${expectedRegion}`,
      `SIMPLE_TAROT_MOBILE_CALLBACK_URL=${expectedMobileCallbackUrl}`,
      `SIMPLE_TAROT_MOBILE_LOGOUT_URL=${expectedMobileLogoutUrl}`,
      `SIMPLE_TAROT_WEB_CALLBACK_URL=${expectedWebCallbackUrl}`,
      `SIMPLE_TAROT_WEB_LOGOUT_URL=${expectedWebLogoutUrl}`,
      `SIMPLE_TAROT_COGNITO_DOMAIN_PREFIX=${expectedDomainPrefix}`,
    ].join('\n'));

    try {
      const env = loadInfraEnv(envFilePath);
      const config = getInfraConfig({
        app: new cdk.App(),
        environmentName: 'dev',
        env,
      });

      expect(config.awsRegion).toBe(expectedRegion);
      expect(config.mobileCallbackUrl).toBe(expectedMobileCallbackUrl);
      expect(config.mobileLogoutUrl).toBe(expectedMobileLogoutUrl);
      expect(config.webCallbackUrl).toBe(expectedWebCallbackUrl);
      expect(config.webLogoutUrl).toBe(expectedWebLogoutUrl);
      expect(config.cognitoDomainPrefix).toBe(expectedDomainPrefix);
    } finally {
      rmSync(envDir, { recursive: true, force: true });
    }
  });
});
