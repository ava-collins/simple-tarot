#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib/core';
import {
  getInfraConfig,
  getSelectedEnvironment,
  loadInfraEnv
} from '../lib/config';
import { SimpleTarotStage } from '../lib/simple-tarot-stage';

const app = new cdk.App();
const environmentName = getSelectedEnvironment(app);
const config = getInfraConfig({
  app,
  environmentName,
  env: loadInfraEnv(environmentName)
});
const stageId = environmentName === 'dev' ? 'SimpleTarotDev' : 'SimpleTarotProd';

new SimpleTarotStage(app, stageId, {
  config,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: config.awsRegion
  }
});
