#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib/core';
import { CognitoStack } from '../lib/cognito-stack';
import { getInfraConfig, loadInfraEnv } from '../lib/config';

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
