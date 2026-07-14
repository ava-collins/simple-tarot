import * as cdk from 'aws-cdk-lib/core';
import { Template } from 'aws-cdk-lib/assertions';
import { DeploymentAccessStack } from '../lib/deployment-access-stack';

const account = '123456789012';
const region = 'us-east-1';
const trustedPrincipalArnPattern =
  `arn:aws:iam::${account}:role/aws-reserved/sso.amazonaws.com/` +
  'AWSReservedSSO_AdministratorAccess_*';

function synthesize() {
  const app = new cdk.App();
  const stack = new DeploymentAccessStack(app, 'SimpleTarotDeploymentAccess', {
    config: { account, region, trustedPrincipalArnPattern },
    env: { account, region },
    stackName: 'SimpleTarotDeploymentAccess',
    terminationProtection: true,
  });
  const assembly = app.synth();
  const template = Template.fromStack(stack).toJSON();
  const roles = Object.values(template.Resources).filter(
    (resource: any) => resource.Type === 'AWS::IAM::Role'
  ) as any[];

  return { assembly, roles, stack, template };
}

function roleNamed(roles: any[], roleName: string): any {
  return roles.find((role) => role.Properties.RoleName === roleName);
}

function policyStatements(template: any, roleName: string): any[] {
  const roleEntry = Object.entries(template.Resources).find(
    ([, resource]: [string, any]) =>
      resource.Type === 'AWS::IAM::Role' && resource.Properties.RoleName === roleName
  );
  if (roleEntry === undefined) {
    throw new Error(`Missing role ${roleName}`);
  }

  const [logicalId] = roleEntry;
  return Object.values(template.Resources)
    .filter((resource: any) =>
      resource.Type === 'AWS::IAM::Policy' &&
      JSON.stringify(resource.Properties.Roles).includes(`"${logicalId}"`)
    )
    .flatMap((resource: any) => resource.Properties.PolicyDocument.Statement);
}

describe('DeploymentAccessStack', () => {
  it('creates exactly two trusted and semantically tagged deployment roles', () => {
    const { roles } = synthesize();
    expect(roles).toHaveLength(2);

    for (const environment of ['Dev', 'Prod'] as const) {
      const role = roleNamed(roles, `SimpleTarot${environment}DeployRole`);
      expect(role).toBeDefined();
      expect(role.Properties.Tags).toEqual(expect.arrayContaining([
        { Key: 'Application', Value: 'SimpleTarot' },
        { Key: 'Environment', Value: environment.toLowerCase() },
        { Key: 'ManagedBy', Value: 'CDK' },
      ]));
      const trust = role.Properties.AssumeRolePolicyDocument;
      expect(JSON.stringify(trust)).toContain(`:iam::${account}:root`);
      expect(trust.Statement[0].Condition).toEqual({
        ArnLike: { 'aws:PrincipalArn': trustedPrincipalArnPattern },
      });
    }
  });

  it('permits stack deletion only in dev', () => {
    const { template } = synthesize();
    expect(JSON.stringify(policyStatements(template, 'SimpleTarotDevDeployRole'))).toContain(
      'cloudformation:DeleteStack'
    );
    expect(JSON.stringify(policyStatements(template, 'SimpleTarotProdDeployRole'))).not.toContain(
      'cloudformation:DeleteStack'
    );
  });

  it.each(['Dev', 'Prod'] as const)(
    'scopes the %s deploy role to its four stacks and bootstrap execution role',
    (environment) => {
      const { template } = synthesize();
      const policies = policyStatements(template, `SimpleTarot${environment}DeployRole`);
      const passRole = policies.find((statement: any) =>
        ([] as string[]).concat(statement.Action).includes('iam:PassRole')
      );
      expect(JSON.stringify(passRole.Resource)).toContain(
        `cdk-hnb659fds-cfn-exec-role-${account}-${region}`
      );
      expect(passRole.Condition).toEqual({
        StringEquals: { 'iam:PassedToService': 'cloudformation.amazonaws.com' },
      });

      const text = JSON.stringify(policies);
      const environmentName = environment.toLowerCase();
      const oppositeName = environment === 'Dev' ? 'prod' : 'dev';
      for (const component of ['Cognito', 'UserData', 'BedrockRag', 'Api']) {
        expect(text).toContain(`SimpleTarot${component}-${environmentName}`);
        expect(text).not.toContain(`SimpleTarot${component}-${oppositeName}`);
      }
      expect(text).not.toContain('SimpleTarotDeploymentAccess');
      expect(text).not.toContain('cloudformation:RoleArn');
      expect(policies.every((statement: any) => statement.Effect !== 'Deny')).toBe(true);

      const iamActions = policies.flatMap((statement: any) =>
        ([] as string[]).concat(statement.Action).filter((action) => action.startsWith('iam:'))
      );
      expect(iamActions).toEqual(['iam:PassRole']);
    }
  );

  it('contains no custom execution roles or broad actions', () => {
    const { roles, template } = synthesize();
    expect(JSON.stringify(roles)).not.toContain('CloudFormationRole');

    const policies = Object.values(template.Resources).filter(
      (resource: any) => resource.Type === 'AWS::IAM::Policy'
    );
    const text = JSON.stringify(policies);
    expect(text).not.toContain('AdministratorAccess');
    expect(text).not.toContain('"iam:*"');
    expect(text).not.toContain('"Action":"*"');
    for (const service of ['apigateway:', 'aoss:', 'bedrock:', 'cognito-idp:', 'dynamodb:', 'lambda:', 'logs:']) {
      expect(text).not.toContain(service);
    }
  });

  it('enables termination protection on the access artifact', () => {
    const { assembly, stack } = synthesize();
    expect(assembly.getStackArtifact(stack.artifactId).terminationProtection).toBe(true);
  });
});
