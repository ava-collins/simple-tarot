#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib/core';
import { BedrockRagStack } from '../lib/bedrock-rag-stack';
import { CognitoStack } from '../lib/cognito-stack';
import { getInfraConfig, loadInfraEnv } from '../lib/config';
import { UserDataStack } from '../lib/user-data-stack';

const app = new cdk.App();
const config = getInfraConfig({
  app,
  env: loadInfraEnv()
});

new CognitoStack(app, config.stackName, {
  config,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: config.awsRegion
  },
  stackName: config.stackName
});

new UserDataStack(app, config.userDataStackName, {
  config,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: config.awsRegion
  },
  stackName: config.userDataStackName
});

new BedrockRagStack(app, config.bedrockStackName, {
  config,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: config.awsRegion
  },
  stackName: config.bedrockStackName
});
