import * as cdk from 'aws-cdk-lib/core';
import dotenv from 'dotenv';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

type SimpleTarotEnvironment = 'dev' | 'prod';
type InfraEnvironment = Record<string, string | undefined>;

export interface InfraConfigInput {
    app: cdk.App;
    environmentName?: string;
    env?: InfraEnvironment;
}

export interface InfraConfig {
    environmentName: SimpleTarotEnvironment;
    awsRegion: string;
    mobileCallbackUrl: string;
    mobileLogoutUrl: string;
    webCallbackUrl: string;
    webLogoutUrl: string;
    cognitoDomainPrefix: string;
    stackName: string;
    userPoolName: string;
}

const DEFAULT_ENVIRONMENT: SimpleTarotEnvironment = 'dev';
const DEFAULT_ENV_FILE_PATH = join(__dirname, '..', '.env');

export function loadInfraEnv(envFilePath = DEFAULT_ENV_FILE_PATH): InfraEnvironment {
    if (!existsSync(envFilePath)) {
        throw new Error(
            `Missing infra environment file at ${envFilePath}. Create it from apps/infra/.env.example.`
        );
    }

    return dotenv.parse(readFileSync(envFilePath));
}

function parseEnvironment(value: string): SimpleTarotEnvironment {
    if (value === 'dev' || value === 'prod') {
        return value;
    }

    throw new Error(
        `Unsupported Simple Tarot environment "${value}". Expected "dev" or "prod".`
    );
}

function contextValue(app: cdk.App, key: string): string | undefined {
    const value = app.node.tryGetContext(key);

    return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function requiredEnvValue(env: InfraEnvironment, key: string): string {
    const value = env[key];
    if (typeof value !== 'string' || value.length === 0) {
        throw new Error(`Missing required infra environment variable ${key}.`);
    }

    return value;
}

function firstDefined<T>(...values: Array<T | undefined>): T {
    const value = values.find((candidate): candidate is T => candidate !== undefined);
    if (value === undefined) {
        throw new Error('Expected at least one defined configuration value.');
    }

    return value;
}

export function getInfraConfig(input: InfraConfigInput): InfraConfig {
    const env = input.env ?? process.env;
    const environmentName = parseEnvironment(
        firstDefined(
            input.environmentName,
            contextValue(input.app, 'environment'),
            env.SIMPLE_TAROT_ENV,
            DEFAULT_ENVIRONMENT
        )
    );
    const awsRegion = requiredEnvValue(env, 'SIMPLE_TAROT_AWS_REGION');

    return {
        environmentName,
        awsRegion,
        mobileCallbackUrl: requiredEnvValue(env, 'SIMPLE_TAROT_MOBILE_CALLBACK_URL'),
        mobileLogoutUrl: requiredEnvValue(env, 'SIMPLE_TAROT_MOBILE_LOGOUT_URL'),
        webCallbackUrl: requiredEnvValue(env, 'SIMPLE_TAROT_WEB_CALLBACK_URL'),
        webLogoutUrl: requiredEnvValue(env, 'SIMPLE_TAROT_WEB_LOGOUT_URL'),
        cognitoDomainPrefix: requiredEnvValue(env, 'SIMPLE_TAROT_COGNITO_DOMAIN_PREFIX'),
        stackName: `SimpleTarotCognito-${environmentName}`,
        userPoolName: `simple-tarot-${environmentName}-users`
    };
}
