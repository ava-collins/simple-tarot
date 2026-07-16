import * as cdk from 'aws-cdk-lib/core';
import dotenv from 'dotenv';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

export type SimpleTarotEnvironment = 'dev' | 'prod';
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
    apiFunctionName: string;
    apiName: string;
    apiStackName: string;
    stackName: string;
    userPoolName: string;
    userDataStackName: string;
    userDataTableName: string;
    bedrockStackName: string;
    bedrockKnowledgeBaseName: string;
    bedrockDataSourceName: string;
    bedrockVectorBucketName: string;
    bedrockVectorIndexName: string;
    bedrockCorpusPrefix: string;
    bedrockEmbeddingModelId: string;
    bedrockEmbeddingDimensions: number;
    bedrockGenerationInferenceProfileName: string;
    bedrockGenerationModelId: string;
}

const DEFAULT_ENV_DIRECTORY = join(__dirname, '..');

export function loadInfraEnv(
    environmentName: SimpleTarotEnvironment,
    envDirectory = DEFAULT_ENV_DIRECTORY
): InfraEnvironment {
    const envFilePath = join(envDirectory, `.env.${environmentName}`);
    if (!existsSync(envFilePath)) {
        throw new Error(
            `Missing infra environment file at ${envFilePath}. Create it from apps/infra/.env.${environmentName}.example.`
        );
    }

    return dotenv.parse(readFileSync(envFilePath));
}

export function parseSimpleTarotEnvironment(value: unknown): SimpleTarotEnvironment {
    if (value === 'dev' || value === 'prod') {
        return value;
    }

    throw new Error(
        `Unsupported Simple Tarot environment "${String(
            value
        )}". Expected "dev" or "prod".`
    );
}

function contextValue(app: cdk.App, key: string): string | undefined {
    const value = app.node.tryGetContext(key);

    return typeof value === 'string' && value.length > 0 ? value : undefined;
}

export function getSelectedEnvironment(app: cdk.App): SimpleTarotEnvironment {
    const value = contextValue(app, 'environment');
    if (value === undefined) {
        throw new Error(
            'Missing CDK context environment. Pass -c environment=dev or -c environment=prod.'
        );
    }

    return parseSimpleTarotEnvironment(value);
}

function requiredEnvValue(env: InfraEnvironment, key: string): string {
    const value = env[key];
    if (typeof value !== 'string' || value.length === 0) {
        throw new Error(`Missing required infra environment variable ${key}.`);
    }

    return value;
}

function optionalEnvValue(
    env: InfraEnvironment,
    key: string,
    defaultValue: string
): string {
    const value = env[key];

    return typeof value === 'string' && value.length > 0 ? value : defaultValue;
}

function optionalIntegerEnvValue(
    env: InfraEnvironment,
    key: string,
    defaultValue: number
): number {
    const value = env[key];
    if (typeof value !== 'string' || value.length === 0) {
        return defaultValue;
    }

    const parsed = Number.parseInt(value, 10);
    if (!Number.isInteger(parsed) || parsed <= 0) {
        throw new Error(`Invalid integer value for ${key}.`);
    }

    return parsed;
}

export function getInfraConfig(input: InfraConfigInput): InfraConfig {
    const env = input.env ?? process.env;
    if (input.environmentName === undefined) {
        throw new Error('InfraConfig requires an explicit environmentName.');
    }

    const environmentName = parseSimpleTarotEnvironment(input.environmentName);
    const declaredEnvironment = parseSimpleTarotEnvironment(
        requiredEnvValue(env, 'SIMPLE_TAROT_ENV')
    );
    if (environmentName !== declaredEnvironment) {
        throw new Error(
            `Infra environment mismatch: selected "${environmentName}" but SIMPLE_TAROT_ENV is "${declaredEnvironment}".`
        );
    }
    const awsRegion = requiredEnvValue(env, 'SIMPLE_TAROT_AWS_REGION');

    return {
        environmentName,
        awsRegion,
        mobileCallbackUrl: requiredEnvValue(env, 'SIMPLE_TAROT_MOBILE_CALLBACK_URL'),
        mobileLogoutUrl: requiredEnvValue(env, 'SIMPLE_TAROT_MOBILE_LOGOUT_URL'),
        webCallbackUrl: requiredEnvValue(env, 'SIMPLE_TAROT_WEB_CALLBACK_URL'),
        webLogoutUrl: requiredEnvValue(env, 'SIMPLE_TAROT_WEB_LOGOUT_URL'),
        cognitoDomainPrefix: requiredEnvValue(env, 'SIMPLE_TAROT_COGNITO_DOMAIN_PREFIX'),
        apiFunctionName: `simple-tarot-${environmentName}-api`,
        apiName: `simple-tarot-${environmentName}-api`,
        apiStackName: `SimpleTarotApi-${environmentName}`,
        stackName: `SimpleTarotCognito-${environmentName}`,
        userPoolName: `simple-tarot-${environmentName}-users`,
        userDataStackName: `SimpleTarotUserData-${environmentName}`,
        userDataTableName: `simple-tarot-${environmentName}-user-data`,
        bedrockStackName: `SimpleTarotBedrockRag-${environmentName}`,
        bedrockKnowledgeBaseName: `simple-tarot-${environmentName}-readings-v3`,
        bedrockDataSourceName: `simple-tarot-${environmentName}-corpus-v2`,
        bedrockVectorBucketName: `st-${environmentName}-vectors`,
        bedrockVectorIndexName: 'tarot-readings-v2',
        bedrockGenerationInferenceProfileName: `simple-tarot-${environmentName}-generation`,
        bedrockCorpusPrefix: optionalEnvValue(
            env,
            'SIMPLE_TAROT_BEDROCK_CORPUS_PREFIX',
            'corpus/'
        ),
        bedrockEmbeddingModelId: optionalEnvValue(
            env,
            'SIMPLE_TAROT_BEDROCK_EMBEDDING_MODEL_ID',
            'amazon.titan-embed-text-v2:0'
        ),
        bedrockEmbeddingDimensions: optionalIntegerEnvValue(
            env,
            'SIMPLE_TAROT_BEDROCK_EMBEDDING_DIMENSIONS',
            1024
        ),
        bedrockGenerationModelId: optionalEnvValue(
            env,
            'SIMPLE_TAROT_BEDROCK_GENERATION_MODEL_ID',
            'amazon.nova-lite-v1:0'
        )
    };
}
