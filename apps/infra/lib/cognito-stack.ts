import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import { InfraConfig } from './config';

export interface CognitoStackProps extends cdk.StackProps {
  config: InfraConfig;
}

export class CognitoStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: CognitoStackProps) {
    super(scope, id, props);

    const removalPolicy = props.config.environmentName === 'prod'
      ? cdk.RemovalPolicy.RETAIN
      : cdk.RemovalPolicy.DESTROY;

    const userPool = new cognito.UserPool(this, 'UserPool', {
      userPoolName: props.config.userPoolName,
      selfSignUpEnabled: true,
      signInAliases: {
        email: true,
      },
      signInCaseSensitive: false,
      autoVerify: {
        email: true,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      passwordPolicy: {
        minLength: 12,
        requireLowercase: true,
        requireDigits: true,
        requireSymbols: true,
        requireUppercase: true,
      },
      deletionProtection: props.config.environmentName === 'prod',
      removalPolicy,
    });

    const userPoolClient = userPool.addClient('PublicOAuthClient', {
      generateSecret: false,
      preventUserExistenceErrors: true,
      supportedIdentityProviders: [
        cognito.UserPoolClientIdentityProvider.COGNITO,
      ],
      oAuth: {
        flows: {
          authorizationCodeGrant: true,
        },
        scopes: [
          cognito.OAuthScope.OPENID,
          cognito.OAuthScope.EMAIL,
          cognito.OAuthScope.PROFILE,
        ],
        callbackUrls: [
          props.config.mobileCallbackUrl,
          props.config.webCallbackUrl,
        ],
        logoutUrls: [
          props.config.mobileLogoutUrl,
          props.config.webLogoutUrl,
        ],
      },
    });

    userPool.addDomain('HostedDomain', {
      cognitoDomain: {
        domainPrefix: props.config.cognitoDomainPrefix,
      },
    });

    const cognitoDomain = `${props.config.cognitoDomainPrefix}.auth.${props.config.awsRegion}.amazoncognito.com`;
    const cognitoIssuer = `https://cognito-idp.${props.config.awsRegion}.amazonaws.com/${userPool.userPoolId}`;

    new cdk.CfnOutput(this, 'CognitoUserPoolId', {
      value: userPool.userPoolId,
    });
    new cdk.CfnOutput(this, 'CognitoUserPoolClientId', {
      value: userPoolClient.userPoolClientId,
    });
    new cdk.CfnOutput(this, 'CognitoDomain', {
      value: cognitoDomain,
    });
    new cdk.CfnOutput(this, 'CognitoIssuer', {
      value: cognitoIssuer,
    });
    new cdk.CfnOutput(this, 'CognitoMobileCallbackUrl', {
      value: props.config.mobileCallbackUrl,
    });
    new cdk.CfnOutput(this, 'CognitoMobileLogoutUrl', {
      value: props.config.mobileLogoutUrl,
    });
    new cdk.CfnOutput(this, 'CognitoWebCallbackUrl', {
      value: props.config.webCallbackUrl,
    });
    new cdk.CfnOutput(this, 'CognitoWebLogoutUrl', {
      value: props.config.webLogoutUrl,
    });
    new cdk.CfnOutput(this, 'AwsRegion', {
      value: props.config.awsRegion,
    });
  }
}
