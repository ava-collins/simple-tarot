#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib/core';
import { BedrockStack } from '../lib/bedrock-stack';
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

new BedrockStack(app, `SimpleTarotBedrock-${config.environmentName}`, {
  config,
  env: stackEnv,
  stackName: `SimpleTarotBedrock-${config.environmentName}`
});
