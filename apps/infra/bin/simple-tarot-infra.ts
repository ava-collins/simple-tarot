#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib/core';
import { BedrockInfraStack } from '../lib/bedrock-infra-stack';
import { BedrockKbStack } from '../lib/bedrock-kb-stack';
import { CognitoStack } from '../lib/cognito-stack';
import { getInfraConfig, loadInfraEnv } from '../lib/config';

const app = new cdk.App();
const config = getInfraConfig({
  app,
  env: loadInfraEnv()
});

const stackEnv = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: config.awsRegion
};

new CognitoStack(app, config.stackName, {
  config,
  env: stackEnv,
  stackName: config.stackName
});

const bedrockInfra = new BedrockInfraStack(
  app,
  `SimpleTarotBedrockInfra-${config.environmentName}`,
  {
    config,
    env: stackEnv,
    stackName: `SimpleTarotBedrockInfra-${config.environmentName}`
  }
);

new BedrockKbStack(
  app,
  `SimpleTarotBedrockKb-${config.environmentName}`,
  {
    config,
    env: stackEnv,
    stackName: `SimpleTarotBedrockKb-${config.environmentName}`,
    collectionArn: bedrockInfra.collectionArn,
    kbRoleArn: bedrockInfra.kbRoleArn,
    corpusBucketArn: bedrockInfra.corpusBucketArn,
    corpusBucketName: bedrockInfra.corpusBucketName
  }
);
