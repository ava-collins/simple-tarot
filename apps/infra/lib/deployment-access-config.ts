import dotenv from 'dotenv';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

type AccessEnvironment = Record<string, string | undefined>;

export interface DeploymentAccessConfig {
  account: string;
  region: string;
  trustedPrincipalArnPattern: string;
}

export interface DeploymentAccessConfigInput {
  account?: string;
  region?: string;
  env?: AccessEnvironment;
}

const TRUSTED_PRINCIPAL_PATTERN =
  /^arn:(aws(?:-[a-z]+)*):iam::(\d{12}):role\/aws-reserved\/sso\.amazonaws\.com\/(?:[a-z0-9-]+\/)?AWSReservedSSO_AdministratorAccess_\*$/;

export function loadDeploymentAccessEnv(
  directory = join(__dirname, '..')
): AccessEnvironment {
  const accessFilePath = join(directory, '.env.access');
  if (!existsSync(accessFilePath)) {
    throw new Error(
      `Missing deployment access file at ${accessFilePath}. Create it from apps/infra/.env.access.example.`
    );
  }

  return dotenv.parse(readFileSync(accessFilePath));
}

function requiredValue(env: AccessEnvironment, key: string): string {
  const value = env[key];
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`Missing required deployment access environment variable ${key}.`);
  }

  return value;
}

export function getDeploymentAccessConfig(
  input: DeploymentAccessConfigInput
): DeploymentAccessConfig {
  const env = input.env ?? process.env;
  const account = input.account ?? requiredValue(env, 'CDK_DEFAULT_ACCOUNT');
  const region = input.region ?? requiredValue(env, 'CDK_DEFAULT_REGION');
  const trustedPrincipalArnPattern = requiredValue(
    env,
    'SIMPLE_TAROT_DEPLOY_TRUSTED_PRINCIPAL_ARN_PATTERN'
  );
  const match = TRUSTED_PRINCIPAL_PATTERN.exec(trustedPrincipalArnPattern);

  if (match === null) {
    throw new Error('Invalid deployment access trusted principal ARN pattern.');
  }
  if (match[2] !== account) {
    throw new Error('Deployment access trusted principal account must match CDK_DEFAULT_ACCOUNT.');
  }

  return { account, region, trustedPrincipalArnPattern };
}
