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
    bedrockCollectionName: string;
    bedrockVectorIndexName: string;
    bedrockCorpusPrefix: string;
    bedrockEmbeddingModelId: string;
    bedrockEmbeddingDimensions: number;
    bedrockGenerationModelId: string;
    aossIndexPrincipalArn?: string;
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

function optionalEnvValue(env: InfraEnvironment, key: string, defaultValue: string): string {
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
        apiFunctionName: `simple-tarot-${environmentName}-api`,
        apiName: `simple-tarot-${environmentName}-api`,
        apiStackName: `SimpleTarotApi-${environmentName}`,
        stackName: `SimpleTarotCognito-${environmentName}`,
        userPoolName: `simple-tarot-${environmentName}-users`,
        userDataStackName: `SimpleTarotUserData-${environmentName}`,
        userDataTableName: `simple-tarot-${environmentName}-user-data`,
        bedrockStackName: `SimpleTarotBedrockRag-${environmentName}`,
        bedrockKnowledgeBaseName: `simple-tarot-${environmentName}-readings`,
        bedrockDataSourceName: `simple-tarot-${environmentName}-corpus`,
        bedrockCollectionName: `st-${environmentName}-rag`,
        bedrockVectorIndexName: 'tarot-readings',
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
            'global.anthropic.claude-sonnet-4-5-20250929-v1:0'
        ),
        aossIndexPrincipalArn: optionalEnvValue(
            env,
            'SIMPLE_TAROT_AOSS_INDEX_PRINCIPAL_ARN',
            ''
        ) || undefined
    };
}
