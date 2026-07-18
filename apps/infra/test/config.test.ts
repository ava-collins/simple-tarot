import * as cdk from 'aws-cdk-lib/core';
import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { getInfraConfig, getSelectedEnvironment, loadInfraEnv } from '../lib/config';

const devEnv = {
  SIMPLE_TAROT_ENV: 'dev',
  SIMPLE_TAROT_AWS_REGION: 'us-east-2',
  SIMPLE_TAROT_MOBILE_CALLBACK_URL: 'simpletarot://auth/callback',
  SIMPLE_TAROT_MOBILE_LOGOUT_URL: 'simpletarot://auth/logout',
  SIMPLE_TAROT_WEB_CALLBACK_URL: 'https://example.com/auth/callback',
  SIMPLE_TAROT_WEB_LOGOUT_URL: 'https://example.com/auth/logout',
  SIMPLE_TAROT_COGNITO_DOMAIN_PREFIX: 'simple-tarot-dev',
};

const prodEnv = {
  ...devEnv,
  SIMPLE_TAROT_ENV: 'prod',
  SIMPLE_TAROT_COGNITO_DOMAIN_PREFIX: 'simple-tarot-prod',
};

describe('infrastructure environment configuration', () => {
  it.each(['dev', 'prod'] as const)('selects %s from CDK context', (environment) => {
    expect(getSelectedEnvironment(new cdk.App({ context: { environment } }))).toBe(environment);
  });

  it('rejects missing context', () => {
    expect(() => getSelectedEnvironment(new cdk.App())).toThrow(
      'Missing CDK context environment. Pass -c environment=dev or -c environment=prod.'
    );
  });

  it('rejects unsupported context', () => {
    const app = new cdk.App({ context: { environment: 'test' } });
    expect(() => getSelectedEnvironment(app)).toThrow(
      'Unsupported Simple Tarot environment "test". Expected "dev" or "prod".'
    );
  });

  it('loads only the selected file', () => {
    const directory = mkdtempSync(join(tmpdir(), 'simple-tarot-infra-'));
    writeFileSync(join(directory, '.env.dev'), 'SIMPLE_TAROT_ENV=dev\n');
    writeFileSync(join(directory, '.env.prod'), 'SIMPLE_TAROT_ENV=prod\n');
    try {
      expect(loadInfraEnv('prod', directory)).toEqual({ SIMPLE_TAROT_ENV: 'prod' });
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it('names the missing selected file', () => {
    const directory = mkdtempSync(join(tmpdir(), 'simple-tarot-infra-'));
    try {
      expect(() => loadInfraEnv('prod', directory)).toThrow(
        `Missing infra environment file at ${join(directory, '.env.prod')}. Create it from apps/infra/.env.prod.example.`
      );
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it('rejects a mismatched file declaration', () => {
    expect(() => getInfraConfig({
      app: new cdk.App(),
      environmentName: 'prod',
      env: devEnv,
    })).toThrow(
      'Infra environment mismatch: selected "prod" but SIMPLE_TAROT_ENV is "dev".'
    );
  });

  it('uses a single-region generation model and application profile name', () => {
    expect(getInfraConfig({
      app: new cdk.App(),
      environmentName: 'dev',
      env: devEnv,
    })).toMatchObject({
      awsRegion: 'us-east-2',
      bedrockGenerationInferenceProfileName: 'simple-tarot-dev-generation',
      bedrockGenerationModelId: 'amazon.nova-lite-v1:0',
    });
  });

  it('uses the selective active corpus data source in development', () => {
    expect(getInfraConfig({
      app: new cdk.App(),
      environmentName: 'dev',
      env: devEnv,
    })).toMatchObject({
      bedrockDataSourceName: 'simple-tarot-dev-selective-corpus-v3',
      bedrockCorpusPrefix: 'corpus/active/',
      bedrockChunkingStrategy: 'NONE',
    });
  });

  it('preserves the legacy corpus data source defaults in production', () => {
    expect(getInfraConfig({
      app: new cdk.App(),
      environmentName: 'prod',
      env: prodEnv,
    })).toMatchObject({
      bedrockDataSourceName: 'simple-tarot-prod-corpus-v2',
      bedrockCorpusPrefix: 'corpus/',
      bedrockChunkingStrategy: 'FIXED_SIZE',
    });
  });

  it('preserves an explicit corpus prefix override', () => {
    expect(getInfraConfig({
      app: new cdk.App(),
      environmentName: 'dev',
      env: {
        ...devEnv,
        SIMPLE_TAROT_BEDROCK_CORPUS_PREFIX: 'custom/active/',
      },
    }).bedrockCorpusPrefix).toBe('custom/active/');
  });
});
