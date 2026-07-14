import {
  getDeploymentRoleArns,
  getDeploymentRoleNames,
} from '../lib/deployment-role-routing';

describe('environment deployment role routing', () => {
  it('names the dev roles explicitly', () => {
    expect(getDeploymentRoleNames('dev')).toEqual({
      deployRoleName: 'SimpleTarotDevDeployRole',
      cloudFormationRoleName: 'SimpleTarotDevCloudFormationRole',
    });
  });

  it('names the prod roles explicitly', () => {
    expect(getDeploymentRoleNames('prod')).toEqual({
      deployRoleName: 'SimpleTarotProdDeployRole',
      cloudFormationRoleName: 'SimpleTarotProdCloudFormationRole',
    });
  });

  it('uses deploy-time account and partition placeholders in role ARNs', () => {
    expect(getDeploymentRoleArns('dev')).toEqual({
      deployRoleArn:
        'arn:${AWS::Partition}:iam::${AWS::AccountId}:role/SimpleTarotDevDeployRole',
      cloudFormationRoleArn:
        'arn:${AWS::Partition}:iam::${AWS::AccountId}:role/SimpleTarotDevCloudFormationRole',
    });
  });
});
