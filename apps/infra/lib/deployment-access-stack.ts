import * as iam from 'aws-cdk-lib/aws-iam';
import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import type { SimpleTarotEnvironment } from './config';
import type { DeploymentAccessConfig } from './deployment-access-config';
import {
  APPLICATION_STACK_NAMES,
  getDeploymentRoleName
} from './deployment-role-routing';

export interface DeploymentAccessStackProps extends cdk.StackProps {
  config: DeploymentAccessConfig;
}

const MUTATION_ACTIONS = [
  'cloudformation:CreateStack',
  'cloudformation:UpdateStack',
  'cloudformation:CreateChangeSet',
  'cloudformation:ExecuteChangeSet',
  'cloudformation:DeleteChangeSet',
  'cloudformation:ContinueUpdateRollback',
  'cloudformation:RollbackStack',
  'cloudformation:UpdateTerminationProtection'
];

const READ_ACTIONS = [
  'cloudformation:DescribeStacks',
  'cloudformation:DescribeStackEvents',
  'cloudformation:DescribeStackResources',
  'cloudformation:ListStackResources',
  'cloudformation:GetTemplate',
  'cloudformation:GetTemplateSummary',
  'cloudformation:GetStackPolicy',
  'cloudformation:ListChangeSets',
  'cloudformation:DescribeChangeSet'
];

export class DeploymentAccessStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: DeploymentAccessStackProps) {
    super(scope, id, props);

    for (const environmentName of ['dev', 'prod'] as const) {
      this.createDeploymentRole(environmentName, props.config);
    }
  }

  private createDeploymentRole(
    environmentName: SimpleTarotEnvironment,
    config: DeploymentAccessConfig
  ): void {
    const suffix = environmentName === 'dev' ? 'Dev' : 'Prod';
    const deployRole = new iam.Role(this, `${suffix}DeployRole`, {
      assumedBy: new iam.AccountPrincipal(config.account).withConditions({
        ArnLike: { 'aws:PrincipalArn': config.trustedPrincipalArnPattern }
      }),
      description: `Deploy Simple Tarot ${environmentName} application stacks`,
      roleName: getDeploymentRoleName(environmentName)
    });

    cdk.Tags.of(deployRole).add('Application', 'SimpleTarot');
    cdk.Tags.of(deployRole).add('Environment', environmentName);
    cdk.Tags.of(deployRole).add('ManagedBy', 'CDK');

    this.addDeploymentPolicies(environmentName, config, deployRole);
    new cdk.CfnOutput(this, `${suffix}DeployRoleArn`, { value: deployRole.roleArn });
  }

  private addDeploymentPolicies(
    environmentName: SimpleTarotEnvironment,
    config: DeploymentAccessConfig,
    deployRole: iam.Role
  ): void {
    const stackArns = APPLICATION_STACK_NAMES[environmentName].map(stackName =>
      this.formatArn({
        service: 'cloudformation',
        resource: 'stack',
        resourceName: `${stackName}/*`
      })
    );
    const changeSetArn = this.formatArn({
      service: 'cloudformation',
      resource: 'changeSet',
      resourceName: '*/*'
    });
    const resources = [...stackArns, changeSetArn];
    const mutationActions = environmentName === 'dev'
      ? [...MUTATION_ACTIONS, 'cloudformation:DeleteStack']
      : MUTATION_ACTIONS;

    deployRole.addToPolicy(new iam.PolicyStatement({
      actions: mutationActions,
      resources
    }));
    deployRole.addToPolicy(new iam.PolicyStatement({
      actions: READ_ACTIONS,
      resources
    }));
    deployRole.addToPolicy(new iam.PolicyStatement({
      actions: ['cloudformation:ValidateTemplate'],
      resources: ['*']
    }));

    const bootstrapExecutionRoleArn = this.formatArn({
      service: 'iam',
      region: '',
      resource: 'role',
      resourceName:
        `cdk-hnb659fds-cfn-exec-role-${config.account}-${config.region}`
    });
    deployRole.addToPolicy(new iam.PolicyStatement({
      actions: ['iam:PassRole'],
      resources: [bootstrapExecutionRoleArn],
      conditions: {
        StringEquals: { 'iam:PassedToService': 'cloudformation.amazonaws.com' }
      }
    }));
    deployRole.addToPolicy(new iam.PolicyStatement({
      actions: ['ssm:GetParameter'],
      resources: [this.formatArn({
        service: 'ssm',
        resource: 'parameter',
        resourceName: 'cdk-bootstrap/hnb659fds/version'
      })]
    }));

    const assetBucketArn =
      `arn:${cdk.Aws.PARTITION}:s3:::cdk-hnb659fds-assets-${config.account}-${config.region}`;
    deployRole.addToPolicy(new iam.PolicyStatement({
      actions: ['s3:GetBucketLocation', 's3:ListBucket'],
      resources: [assetBucketArn]
    }));
    deployRole.addToPolicy(new iam.PolicyStatement({
      actions: ['s3:GetObject'],
      resources: [`${assetBucketArn}/*`]
    }));
  }
}
