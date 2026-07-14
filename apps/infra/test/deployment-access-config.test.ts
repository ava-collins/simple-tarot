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

describe('deployment access configuration', () => {
  it('returns a validated access configuration', () => {
    expect(getDeploymentAccessConfig({
      account,
      region: 'us-east-1',
      env: { SIMPLE_TAROT_DEPLOY_TRUSTED_PRINCIPAL_ARN_PATTERN: trustedPattern },
    })).toEqual({
      account,
      region: 'us-east-1',
      trustedPrincipalArnPattern: trustedPattern,
    });
  });

  it('loads only .env.access', () => {
    const directory = mkdtempSync(join(tmpdir(), 'simple-tarot-access-'));
    writeFileSync(join(directory, '.env.access'), `SIMPLE_TAROT_DEPLOY_TRUSTED_PRINCIPAL_ARN_PATTERN=${trustedPattern}\n`);
    writeFileSync(join(directory, '.env.dev'), 'SHOULD_NOT_LOAD=true\n');
    try {
      expect(loadDeploymentAccessEnv(directory)).toEqual({
        SIMPLE_TAROT_DEPLOY_TRUSTED_PRINCIPAL_ARN_PATTERN: trustedPattern,
      });
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

  it('requires the trusted principal pattern', () => {
    expect(() => getDeploymentAccessConfig({ account, region: 'us-east-1', env: {} })).toThrow(
      'Missing required deployment access environment variable SIMPLE_TAROT_DEPLOY_TRUSTED_PRINCIPAL_ARN_PATTERN.'
    );
  });

  it('rejects a trusted principal from another account', () => {
    const otherAccountPattern = trustedPattern.replace(account, '210987654321');
    expect(() => getDeploymentAccessConfig({
      account,
      region: 'us-east-1',
      env: { SIMPLE_TAROT_DEPLOY_TRUSTED_PRINCIPAL_ARN_PATTERN: otherAccountPattern },
    })).toThrow('Deployment access trusted principal account must match CDK_DEFAULT_ACCOUNT.');
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
      account,
      region: 'us-east-1',
      env: { SIMPLE_TAROT_DEPLOY_TRUSTED_PRINCIPAL_ARN_PATTERN: pattern },
    })).toThrow('Invalid deployment access trusted principal ARN pattern.');
  });
});
