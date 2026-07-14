import {
  getDeploymentRoleArn,
  getDeploymentRoleName,
} from '../lib/deployment-role-routing';

describe('environment deployment role routing', () => {
  it('names the dev deployment role explicitly', () => {
    expect(getDeploymentRoleName('dev')).toBe('SimpleTarotDevDeployRole');
  });

  it('names the prod deployment role explicitly', () => {
    expect(getDeploymentRoleName('prod')).toBe('SimpleTarotProdDeployRole');
  });

  it('uses deploy-time account and partition placeholders in the role ARN', () => {
    expect(getDeploymentRoleArn('dev')).toBe(
      'arn:${AWS::Partition}:iam::${AWS::AccountId}:role/SimpleTarotDevDeployRole'
    );
  });
});
