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
  it('creates exactly four semantically tagged roles', () => {
    const { roles } = synthesize();
    expect(roles).toHaveLength(4);

    for (const environment of ['Dev', 'Prod'] as const) {
      for (const kind of ['DeployRole', 'CloudFormationRole'] as const) {
        const role = roleNamed(roles, `SimpleTarot${environment}${kind}`);
        expect(role).toBeDefined();
        expect(role.Properties.Tags).toEqual(expect.arrayContaining([
          { Key: 'Application', Value: 'SimpleTarot' },
          { Key: 'Environment', Value: environment.toLowerCase() },
          { Key: 'ManagedBy', Value: 'CDK' },
        ]));
      }
    }
  });

  it('limits operator and CloudFormation trust independently', () => {
    const { roles } = synthesize();
    for (const environment of ['Dev', 'Prod'] as const) {
      const deployTrust = roleNamed(
        roles,
        `SimpleTarot${environment}DeployRole`
      ).Properties.AssumeRolePolicyDocument;
      expect(JSON.stringify(deployTrust)).toContain(`:iam::${account}:root`);
      expect(deployTrust.Statement[0].Condition).toEqual({
        ArnLike: { 'aws:PrincipalArn': trustedPrincipalArnPattern },
      });

      const executionTrust = roleNamed(
        roles,
        `SimpleTarot${environment}CloudFormationRole`
      ).Properties.AssumeRolePolicyDocument;
      expect(executionTrust.Statement).toHaveLength(1);
      expect(executionTrust.Statement[0].Principal).toEqual({
        Service: 'cloudformation.amazonaws.com',
      });
      expect(JSON.stringify(executionTrust)).not.toContain(account);
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
    'scopes the %s deploy role to its execution role and four application stacks',
    (environment) => {
      const { roles, template } = synthesize();
      const opposite = environment === 'Dev' ? 'Prod' : 'Dev';
      const policies = policyStatements(
        template,
        `SimpleTarot${environment}DeployRole`
      );
      const passRole = policies.find((statement: any) =>
        ([] as string[]).concat(statement.Action).includes('iam:PassRole')
      );
      expect(passRole.Resource).toEqual({
        'Fn::GetAtt': [expect.stringContaining(`${environment}CloudFormationRole`), 'Arn'],
      });
      expect(passRole.Condition).toEqual({
        StringEquals: { 'iam:PassedToService': 'cloudformation.amazonaws.com' },
      });

      const text = JSON.stringify(policies);
      const envName = environment.toLowerCase();
      for (const component of ['Cognito', 'UserData', 'BedrockRag', 'Api']) {
        expect(text).toContain(`SimpleTarot${component}-${envName}`);
      }
      expect(text).not.toContain(`SimpleTarot${opposite}CloudFormationRole`);
      expect(text).not.toContain(`SimpleTarotDeploymentAccess`);
      expect(text).toContain('cloudformation:RoleArn');

      const mutations = policies.filter((statement: any) =>
        ([] as string[]).concat(statement.Action).includes('cloudformation:CreateStack')
      );
      expect(mutations).toHaveLength(3);
      expect(mutations.map((statement: any) => statement.Effect)).toEqual([
        'Allow',
        'Deny',
        'Deny',
      ]);
      expect(mutations.map((statement: any) => statement.Condition)).toEqual([
        { StringEquals: { 'cloudformation:RoleArn': expect.anything() } },
        { StringNotEquals: { 'cloudformation:RoleArn': expect.anything() } },
        { Null: { 'cloudformation:RoleArn': 'true' } },
      ]);

      const iamActions = policies.flatMap((statement: any) =>
        ([] as string[]).concat(statement.Action).filter((action) => action.startsWith('iam:'))
      );
      expect(iamActions).toEqual(['iam:PassRole']);
    }
  );

  it('contains no administrative or wildcard actions', () => {
    const { template } = synthesize();
    const policies = Object.values(template.Resources).filter(
      (resource: any) => resource.Type === 'AWS::IAM::Policy'
    );
    const text = JSON.stringify(policies);
    expect(text).not.toContain('AdministratorAccess');
    expect(text).not.toContain('"iam:*"');
    expect(text).not.toContain('"Action":"*"');
  });

  it('enables termination protection on the access artifact', () => {
    const { assembly, stack } = synthesize();
    expect(assembly.getStackArtifact(stack.artifactId).terminationProtection).toBe(true);
  });
});
