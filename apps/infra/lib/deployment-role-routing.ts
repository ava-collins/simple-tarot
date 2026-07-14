import { DefaultStackSynthesizer } from 'aws-cdk-lib/core';
import type { SimpleTarotEnvironment } from './config';

export const APPLICATION_STACK_NAMES = {
  dev: [
    'SimpleTarotCognito-dev',
    'SimpleTarotUserData-dev',
    'SimpleTarotBedrockRag-dev',
    'SimpleTarotApi-dev',
  ],
  prod: [
    'SimpleTarotCognito-prod',
    'SimpleTarotUserData-prod',
    'SimpleTarotBedrockRag-prod',
    'SimpleTarotApi-prod',
  ],
} as const;

export function getDeploymentRoleName(environmentName: SimpleTarotEnvironment) {
  const suffix = environmentName === 'dev' ? 'Dev' : 'Prod';
  return `SimpleTarot${suffix}DeployRole`;
}

export function getDeploymentRoleArn(environmentName: SimpleTarotEnvironment) {
  return 'arn:${AWS::Partition}:iam::${AWS::AccountId}:role/' +
    getDeploymentRoleName(environmentName);
}

export function createEnvironmentStackSynthesizer(
  environmentName: SimpleTarotEnvironment
) {
  return new DefaultStackSynthesizer({
    deployRoleArn: getDeploymentRoleArn(environmentName),
  });
}
