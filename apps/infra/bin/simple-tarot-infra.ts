#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib/core';
import { ApiStack } from '../lib/api-stack';
import { BedrockRagStack } from '../lib/bedrock-rag-stack';
import { CognitoStack } from '../lib/cognito-stack';
import { getInfraConfig, loadInfraEnv } from '../lib/config';
import { UserDataStack } from '../lib/user-data-stack';

const app = new cdk.App();
const config = getInfraConfig({
  app,
  env: loadInfraEnv()
});

const cognitoStack = new CognitoStack(app, config.stackName, {
  config,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: config.awsRegion
  },
  stackName: config.stackName
});

const userDataStack = new UserDataStack(app, config.userDataStackName, {
  config,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: config.awsRegion
  },
  stackName: config.userDataStackName
});

const bedrockStack = new BedrockRagStack(app, config.bedrockStackName, {
  config,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: config.awsRegion
  },
  stackName: config.bedrockStackName
});

new ApiStack(app, config.apiStackName, {
  apiLogBucket: userDataStack.apiLogBucket,
  config,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: config.awsRegion
  },
  knowledgeBase: bedrockStack.knowledgeBase,
  stackName: config.apiStackName,
  userDataTable: userDataStack.userDataTable,
  userPool: cognitoStack.userPool,
  userPoolClient: cognitoStack.userPoolClient
});
