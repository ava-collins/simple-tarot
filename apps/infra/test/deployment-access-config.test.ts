import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import {
  getDeploymentAccessConfig,
  loadDeploymentAccessEnv,
} from '../lib/deployment-access-config';

const account = '123456789012';
const trustedPattern =
  `arn:aws:iam::${account}:role/aws-reserved/sso.amazonaws.com/` +
  'AWSReservedSSO_AdministratorAccess_*';
const accessEnv = {
  SIMPLE_TAROT_AWS_ACCOUNT: account,
  SIMPLE_TAROT_AWS_REGION: 'us-east-1',
  SIMPLE_TAROT_DEPLOY_TRUSTED_PRINCIPAL_ARN_PATTERN: trustedPattern,
};

describe('deployment access configuration', () => {
  it('returns an explicit validated access configuration', () => {
    expect(getDeploymentAccessConfig(accessEnv)).toEqual({
      account,
      region: 'us-east-1',
      trustedPrincipalArnPattern: trustedPattern,
    });
  });

  it('loads only .env.access', () => {
    const directory = mkdtempSync(join(tmpdir(), 'simple-tarot-access-'));
    writeFileSync(
      join(directory, '.env.access'),
      [
        `SIMPLE_TAROT_AWS_ACCOUNT=${account}`,
        'SIMPLE_TAROT_AWS_REGION=us-east-1',
        `SIMPLE_TAROT_DEPLOY_TRUSTED_PRINCIPAL_ARN_PATTERN=${trustedPattern}`,
        '',
      ].join('\n')
    );
    writeFileSync(join(directory, '.env.dev'), 'SHOULD_NOT_LOAD=true\n');
    try {
      expect(loadDeploymentAccessEnv(directory)).toEqual(accessEnv);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it('names the missing access file', () => {
    const directory = mkdtempSync(join(tmpdir(), 'simple-tarot-access-'));
    try {
      expect(() => loadDeploymentAccessEnv(directory)).toThrow(
        `Missing deployment access file at ${join(directory, '.env.access')}. Create it from apps/infra/.env.access.example.`
      );
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it.each([
    ['SIMPLE_TAROT_AWS_ACCOUNT', { ...accessEnv, SIMPLE_TAROT_AWS_ACCOUNT: undefined }],
    ['SIMPLE_TAROT_AWS_REGION', { ...accessEnv, SIMPLE_TAROT_AWS_REGION: undefined }],
    [
      'SIMPLE_TAROT_DEPLOY_TRUSTED_PRINCIPAL_ARN_PATTERN',
      { ...accessEnv, SIMPLE_TAROT_DEPLOY_TRUSTED_PRINCIPAL_ARN_PATTERN: undefined },
    ],
  ])('requires %s', (key, env) => {
    expect(() => getDeploymentAccessConfig(env)).toThrow(
      `Missing required deployment access environment variable ${key}.`
    );
  });

  it.each(['123', 'abcdefghijkl'])('rejects invalid account %s', (invalidAccount) => {
    expect(() => getDeploymentAccessConfig({
      ...accessEnv,
      SIMPLE_TAROT_AWS_ACCOUNT: invalidAccount,
    })).toThrow('Invalid deployment access AWS account. Expected a 12-digit account ID.');
  });

  it('rejects a trusted principal from another account', () => {
    const otherAccountPattern = trustedPattern.replace(account, '210987654321');
    expect(() => getDeploymentAccessConfig({
      ...accessEnv,
      SIMPLE_TAROT_DEPLOY_TRUSTED_PRINCIPAL_ARN_PATTERN: otherAccountPattern,
    })).toThrow(
      'Deployment access trusted principal account must match SIMPLE_TAROT_AWS_ACCOUNT.'
    );
  });

  it.each([
    trustedPattern.replace('_*', '_abc123'),
    trustedPattern.replace('AdministratorAccess', 'PowerUserAccess'),
    trustedPattern.replace(':iam:', ':sts:').replace(
      'role/aws-reserved/sso.amazonaws.com/AWSReservedSSO_AdministratorAccess_*',
      'assumed-role/AWSReservedSSO_AdministratorAccess_abc123/operator'
    ),
  ])('rejects an invalid trusted principal pattern: %s', (pattern) => {
    expect(() => getDeploymentAccessConfig({
      ...accessEnv,
      SIMPLE_TAROT_DEPLOY_TRUSTED_PRINCIPAL_ARN_PATTERN: pattern,
    })).toThrow('Invalid deployment access trusted principal ARN pattern.');
  });
});
