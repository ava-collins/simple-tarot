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

export function getDeploymentRoleNames(environmentName: SimpleTarotEnvironment) {
  const suffix = environmentName === 'dev' ? 'Dev' : 'Prod';
  return {
    deployRoleName: `SimpleTarot${suffix}DeployRole`,
    cloudFormationRoleName: `SimpleTarot${suffix}CloudFormationRole`,
  };
}

export function getDeploymentRoleArns(environmentName: SimpleTarotEnvironment) {
  const names = getDeploymentRoleNames(environmentName);
  const prefix = 'arn:${AWS::Partition}:iam::${AWS::AccountId}:role/';
  return {
    deployRoleArn: `${prefix}${names.deployRoleName}`,
    cloudFormationRoleArn: `${prefix}${names.cloudFormationRoleName}`,
  };
}

export function createEnvironmentStackSynthesizer(
  environmentName: SimpleTarotEnvironment
) {
  const arns = getDeploymentRoleArns(environmentName);
  return new DefaultStackSynthesizer({
    deployRoleArn: arns.deployRoleArn,
    cloudFormationExecutionRole: arns.cloudFormationRoleArn,
  });
}
