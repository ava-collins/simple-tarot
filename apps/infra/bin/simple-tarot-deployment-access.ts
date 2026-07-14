#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib/core';
import {
  getDeploymentAccessConfig,
  loadDeploymentAccessEnv
} from '../lib/deployment-access-config';
import { DeploymentAccessStack } from '../lib/deployment-access-stack';

const app = new cdk.App();
const config = getDeploymentAccessConfig(loadDeploymentAccessEnv());

new DeploymentAccessStack(app, 'SimpleTarotDeploymentAccess', {
  config,
  env: { account: config.account, region: config.region },
  stackName: 'SimpleTarotDeploymentAccess',
  terminationProtection: true
});
