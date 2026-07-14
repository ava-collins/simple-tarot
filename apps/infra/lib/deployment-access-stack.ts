import * as cdk from 'aws-cdk-lib/core';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import type { SimpleTarotEnvironment } from './config';
import type { DeploymentAccessConfig } from './deployment-access-config';
import {
  APPLICATION_STACK_NAMES,
  getDeploymentRoleName,
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
  'cloudformation:UpdateTerminationProtection',
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
  'cloudformation:DescribeChangeSet',
];

const APPLICATION_RESOURCE_ACTIONS = [
  'apigateway:DELETE', 'apigateway:GET', 'apigateway:PATCH',
  'apigateway:POST', 'apigateway:PUT',
  'aoss:BatchGetCollection', 'aoss:CreateAccessPolicy',
  'aoss:CreateCollection', 'aoss:CreateIndex',
  'aoss:CreateSecurityPolicy', 'aoss:DeleteAccessPolicy',
  'aoss:DeleteCollection', 'aoss:DeleteIndex',
  'aoss:DeleteSecurityPolicy', 'aoss:GetAccessPolicy', 'aoss:GetIndex',
  'aoss:GetSecurityPolicy', 'aoss:ListTagsForResource',
  'aoss:TagResource', 'aoss:UntagResource',
  'aoss:UpdateAccessPolicy', 'aoss:UpdateCollection',
  'aoss:UpdateIndex', 'aoss:UpdateSecurityPolicy',
  'bedrock:CreateDataSource', 'bedrock:CreateKnowledgeBase',
  'bedrock:DeleteDataSource', 'bedrock:DeleteKnowledgeBase',
  'bedrock:GetDataSource', 'bedrock:GetKnowledgeBase',
  'bedrock:ListTagsForResource', 'bedrock:TagResource',
  'bedrock:UntagResource', 'bedrock:UpdateDataSource',
  'bedrock:UpdateKnowledgeBase',
  'cognito-idp:CreateUserPool', 'cognito-idp:CreateUserPoolClient',
  'cognito-idp:CreateUserPoolDomain', 'cognito-idp:DeleteUserPool',
  'cognito-idp:DeleteUserPoolClient', 'cognito-idp:DeleteUserPoolDomain',
  'cognito-idp:DescribeUserPool', 'cognito-idp:DescribeUserPoolClient',
  'cognito-idp:DescribeUserPoolDomain', 'cognito-idp:ListTagsForResource',
  'cognito-idp:TagResource', 'cognito-idp:UntagResource',
  'cognito-idp:UpdateUserPool', 'cognito-idp:UpdateUserPoolClient',
  'dynamodb:CreateTable', 'dynamodb:DeleteTable',
  'dynamodb:DescribeContinuousBackups', 'dynamodb:DescribeTable',
  'dynamodb:ListTagsOfResource', 'dynamodb:TagResource',
  'dynamodb:UntagResource', 'dynamodb:UpdateContinuousBackups',
  'dynamodb:UpdateTable',
  'lambda:AddPermission', 'lambda:CreateFunction', 'lambda:DeleteFunction',
  'lambda:GetFunction', 'lambda:GetFunctionConfiguration', 'lambda:ListTags',
  'lambda:RemovePermission', 'lambda:TagResource', 'lambda:UntagResource',
  'lambda:UpdateFunctionCode', 'lambda:UpdateFunctionConfiguration',
  'logs:CreateLogGroup', 'logs:DeleteLogGroup', 'logs:DescribeLogGroups',
  'logs:ListTagsForResource', 'logs:PutRetentionPolicy',
  'logs:TagResource', 'logs:UntagResource',
  's3:CreateBucket', 's3:DeleteBucket', 's3:DeleteBucketPolicy',
  's3:GetBucketLocation', 's3:GetBucketPolicy', 's3:GetBucketTagging',
  's3:GetEncryptionConfiguration', 's3:GetLifecycleConfiguration',
  's3:GetObject', 's3:ListBucket', 's3:PutBucketPolicy',
  's3:PutBucketPublicAccessBlock', 's3:PutBucketTagging',
  's3:PutBucketVersioning', 's3:PutEncryptionConfiguration',
  's3:PutLifecycleConfiguration',
];

const APPLICATION_IAM_ACTIONS = [
  'iam:AttachRolePolicy',
  'iam:CreateRole',
  'iam:DeleteRole',
  'iam:DeleteRolePolicy',
  'iam:DetachRolePolicy',
  'iam:GetRole',
  'iam:GetRolePolicy',
  'iam:ListAttachedRolePolicies',
  'iam:ListRolePolicies',
  'iam:PassRole',
  'iam:PutRolePolicy',
  'iam:TagRole',
  'iam:UntagRole',
  'iam:UpdateAssumeRolePolicy',
];

export class DeploymentAccessStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: DeploymentAccessStackProps) {
    super(scope, id, props);

    for (const environmentName of ['dev', 'prod'] as const) {
      this.createEnvironmentRoles(environmentName, props.config);
    }
  }

  private createEnvironmentRoles(
    environmentName: SimpleTarotEnvironment,
    config: DeploymentAccessConfig
  ): void {
    const suffix = environmentName === 'dev' ? 'Dev' : 'Prod';
    const trustedOperator = new iam.AccountPrincipal(config.account).withConditions({
      ArnLike: { 'aws:PrincipalArn': config.trustedPrincipalArnPattern },
    });
    const deployRole = new iam.Role(this, `${suffix}DeployRole`, {
      assumedBy: trustedOperator,
      description: `Deploy Simple Tarot ${environmentName} application stacks`,
      roleName: getDeploymentRoleName(environmentName),
    });
    const cloudFormationRole = new iam.Role(this, `${suffix}CloudFormationRole`, {
      assumedBy: new iam.ServicePrincipal('cloudformation.amazonaws.com'),
      description: `Execute Simple Tarot ${environmentName} CloudFormation stacks`,
      roleName: `SimpleTarot${suffix}CloudFormationRole`,
    });

    for (const role of [deployRole, cloudFormationRole]) {
      cdk.Tags.of(role).add('Application', 'SimpleTarot');
      cdk.Tags.of(role).add('Environment', environmentName);
      cdk.Tags.of(role).add('ManagedBy', 'CDK');
    }

    this.addDeployPolicies(environmentName, deployRole, cloudFormationRole);
    this.addExecutionPolicies(environmentName, cloudFormationRole);

    new cdk.CfnOutput(this, `${suffix}DeployRoleArn`, { value: deployRole.roleArn });
    new cdk.CfnOutput(this, `${suffix}CloudFormationRoleArn`, {
      value: cloudFormationRole.roleArn,
    });
  }

  private addDeployPolicies(
    environmentName: SimpleTarotEnvironment,
    deployRole: iam.Role,
    cloudFormationRole: iam.Role
  ): void {
    const stackArns = APPLICATION_STACK_NAMES[environmentName].map((stackName) =>
      this.formatArn({ service: 'cloudformation', resource: 'stack', resourceName: `${stackName}/*` })
    );
    const changeSetArn = this.formatArn({
      service: 'cloudformation',
      resource: 'changeSet',
      resourceName: '*/*',
    });
    const mutationActions = environmentName === 'dev'
      ? [...MUTATION_ACTIONS, 'cloudformation:DeleteStack']
      : MUTATION_ACTIONS;
    const mutationResources = [...stackArns, changeSetArn];

    deployRole.addToPolicy(new iam.PolicyStatement({
      actions: mutationActions,
      resources: mutationResources,
      conditions: {
        StringEquals: { 'cloudformation:RoleArn': cloudFormationRole.roleArn },
      },
    }));
    deployRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.DENY,
      actions: mutationActions,
      resources: mutationResources,
      conditions: {
        StringNotEquals: { 'cloudformation:RoleArn': cloudFormationRole.roleArn },
      },
    }));
    deployRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.DENY,
      actions: mutationActions,
      resources: mutationResources,
      conditions: { Null: { 'cloudformation:RoleArn': 'true' } },
    }));
    deployRole.addToPolicy(new iam.PolicyStatement({
      actions: READ_ACTIONS,
      resources: mutationResources,
    }));
    deployRole.addToPolicy(new iam.PolicyStatement({
      actions: ['cloudformation:ListStacks', 'cloudformation:ValidateTemplate'],
      resources: ['*'],
    }));
    deployRole.addToPolicy(new iam.PolicyStatement({
      actions: ['iam:PassRole'],
      resources: [cloudFormationRole.roleArn],
      conditions: {
        StringEquals: { 'iam:PassedToService': 'cloudformation.amazonaws.com' },
      },
    }));
    deployRole.addToPolicy(new iam.PolicyStatement({
      actions: ['ssm:GetParameter'],
      resources: [this.formatArn({
        service: 'ssm',
        resource: 'parameter',
        resourceName: 'cdk-bootstrap/hnb659fds/version',
      })],
    }));

    const assetBucketArn = `arn:${cdk.Aws.PARTITION}:s3:::cdk-hnb659fds-assets-${cdk.Aws.ACCOUNT_ID}-${cdk.Aws.REGION}`;
    deployRole.addToPolicy(new iam.PolicyStatement({
      actions: ['s3:GetBucketLocation', 's3:ListBucket'],
      resources: [assetBucketArn],
    }));
    deployRole.addToPolicy(new iam.PolicyStatement({
      actions: ['s3:GetObject'],
      resources: [`${assetBucketArn}/*`],
    }));
  }

  private addExecutionPolicies(
    environmentName: SimpleTarotEnvironment,
    cloudFormationRole: iam.Role
  ): void {
    cloudFormationRole.addToPolicy(new iam.PolicyStatement({
      actions: APPLICATION_RESOURCE_ACTIONS,
      resources: ['*'],
    }));
    cloudFormationRole.addToPolicy(new iam.PolicyStatement({
      actions: APPLICATION_IAM_ACTIONS,
      resources: [
        `arn:${cdk.Aws.PARTITION}:iam::${cdk.Aws.ACCOUNT_ID}:role/SimpleTarot*-${environmentName}-*`,
      ],
      conditions: {
        StringEqualsIfExists: {
          'iam:PassedToService': ['lambda.amazonaws.com', 'bedrock.amazonaws.com'],
        },
      },
    }));
  }
}
