import { EVALUATION_RUNTIME_ENABLED } from './evaluations/constants';

export type ApiConfig = {
    apiLog: ApiLogConfig;
    auth: AuthConfig;
    bedrock: BedrockRuntimeConfig;
    composer: ComposerRuntimeConfig;
    evaluation: EvaluationRuntimeConfig;
    hostname: string;
    port: number;
    userData: UserDataConfig;
};

export type DisabledAuthConfig = {
    mode: 'disabled';
};

export type CognitoAuthConfig = {
    clientId: string;
    issuer: string;
    mode: 'cognito';
};

export type AuthConfig = DisabledAuthConfig | CognitoAuthConfig;

export type ApiLogConfig = {
    bucketName?: string;
};

export type UserDataConfig = {
    tableName?: string;
};

export type LocalBedrockRuntimeConfig = {
    maxAttempts: number;
    mode: 'local';
    retrievalResults: number;
};

export type AwsBedrockRuntimeConfig = {
    knowledgeBaseId: string;
    maxAttempts: number;
    mode: 'bedrock';
    modelArn: string;
    region: string;
    retrievalResults: number;
};

export type BedrockRuntimeConfig = LocalBedrockRuntimeConfig | AwsBedrockRuntimeConfig;

export type ComposerRuntimeConfig =
    | {
          mode: 'disabled';
      }
    | {
          bucketName: string;
          dataSourceId: string;
          mode: 'enabled';
      };

export type EvaluationRuntimeConfig =
    | { mode: 'disabled' }
    | { mode: typeof EVALUATION_RUNTIME_ENABLED };

const parsePort = (value: string | undefined): number => {
    if (value === undefined || value.length === 0) {
        return 4100;
    }

    const port = Number.parseInt(value, 10);
    if (!Number.isInteger(port) || port <= 0) {
        throw new Error(`Invalid PORT value "${value}".`);
    }

    return port;
};

const parsePositiveInteger = (
    value: string | undefined,
    defaultValue: number,
    name: string
): number => {
    if (value === undefined || value.length === 0) {
        return defaultValue;
    }

    const parsed = Number.parseInt(value, 10);
    if (!Number.isInteger(parsed) || parsed <= 0) {
        throw new Error(`Invalid ${name} value "${value}".`);
    }

    return parsed;
};

const nonEmpty = (value: string | undefined): string | undefined =>
    typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;

const getAuthConfig = (env: typeof process.env): AuthConfig => {
    if (env.API_AUTH_MODE !== 'cognito') {
        return {
            mode: 'disabled'
        };
    }

    const issuer = nonEmpty(env.COGNITO_ISSUER);
    const clientId = nonEmpty(env.COGNITO_CLIENT_ID);
    const missing = [
        issuer ? undefined : 'COGNITO_ISSUER',
        clientId ? undefined : 'COGNITO_CLIENT_ID'
    ].filter((value): value is string => value !== undefined);

    if (missing.length > 0) {
        throw new Error(
            `Missing Cognito auth environment variables: ${missing.join(', ')}`
        );
    }

    if (!issuer || !clientId) {
        throw new Error('Invalid Cognito auth configuration.');
    }

    return {
        clientId,
        issuer,
        mode: 'cognito'
    };
};

const getUserDataConfig = (env: typeof process.env): UserDataConfig => ({
    tableName: nonEmpty(env.USER_DATA_TABLE_NAME)
});

const getApiLogConfig = (env: typeof process.env): ApiLogConfig => ({
    bucketName: nonEmpty(env.API_LOG_BUCKET_NAME)
});

const modelArnFor = (region: string, env: typeof process.env): string | undefined => {
    const inferenceProfileArn = nonEmpty(env.BEDROCK_INFERENCE_PROFILE_ARN);
    if (inferenceProfileArn) {
        return inferenceProfileArn;
    }

    const inferenceProfileId = nonEmpty(env.BEDROCK_INFERENCE_PROFILE_ID);
    if (inferenceProfileId) {
        return inferenceProfileId;
    }

    const modelArn = nonEmpty(env.BEDROCK_MODEL_ARN);
    if (modelArn) {
        return modelArn;
    }

    const modelId = nonEmpty(env.BEDROCK_MODEL_ID);

    return modelId ? `arn:aws:bedrock:${region}::foundation-model/${modelId}` : undefined;
};

const getBedrockRuntimeConfig = (env: typeof process.env): BedrockRuntimeConfig => {
    const retrievalResults = parsePositiveInteger(
        env.BEDROCK_RETRIEVAL_RESULTS,
        5,
        'BEDROCK_RETRIEVAL_RESULTS'
    );
    const maxAttempts = parsePositiveInteger(
        env.BEDROCK_MAX_ATTEMPTS,
        5,
        'BEDROCK_MAX_ATTEMPTS'
    );

    if (env.BEDROCK_RUNTIME_MODE !== 'bedrock') {
        return {
            maxAttempts,
            mode: 'local',
            retrievalResults
        };
    }

    const region = nonEmpty(env.BEDROCK_REGION);
    const knowledgeBaseId = nonEmpty(env.BEDROCK_KNOWLEDGE_BASE_ID);
    const modelArn = region ? modelArnFor(region, env) : undefined;
    const missing = [
        region ? undefined : 'BEDROCK_REGION',
        knowledgeBaseId ? undefined : 'BEDROCK_KNOWLEDGE_BASE_ID',
        modelArn
            ? undefined
            : 'BEDROCK_MODEL_ID, BEDROCK_MODEL_ARN, BEDROCK_INFERENCE_PROFILE_ID, or BEDROCK_INFERENCE_PROFILE_ARN'
    ].filter((value): value is string => value !== undefined);

    if (missing.length > 0) {
        throw new Error(
            `Missing Bedrock runtime environment variables: ${missing.join(', ')}`
        );
    }

    if (!region || !knowledgeBaseId || !modelArn) {
        throw new Error('Invalid Bedrock runtime configuration.');
    }

    return {
        knowledgeBaseId,
        maxAttempts,
        mode: 'bedrock',
        modelArn,
        region,
        retrievalResults
    };
};

const getComposerRuntimeConfig = (
    env: typeof process.env,
    bedrock: BedrockRuntimeConfig
): ComposerRuntimeConfig => {
    if (
        bedrock.mode === 'local' ||
        env.COMPOSER_RUNTIME_MODE === undefined ||
        env.COMPOSER_RUNTIME_MODE === 'disabled'
    ) {
        return { mode: 'disabled' };
    }

    if (env.COMPOSER_RUNTIME_MODE !== 'enabled') {
        throw new Error(
            `Invalid COMPOSER_RUNTIME_MODE value "${env.COMPOSER_RUNTIME_MODE}".`
        );
    }

    const bucketName = nonEmpty(env.BEDROCK_CORPUS_BUCKET);
    const dataSourceId = nonEmpty(env.BEDROCK_DATA_SOURCE_ID);
    const missing = [
        bucketName ? undefined : 'BEDROCK_CORPUS_BUCKET',
        dataSourceId ? undefined : 'BEDROCK_DATA_SOURCE_ID'
    ].filter((value): value is string => value !== undefined);

    if (missing.length > 0) {
        throw new Error(
            `Missing composer runtime environment variables: ${missing.join(', ')}`
        );
    }

    if (!bucketName || !dataSourceId) {
        throw new Error('Invalid composer runtime configuration.');
    }

    return {
        bucketName,
        dataSourceId,
        mode: 'enabled'
    };
};

const getEvaluationRuntimeConfig = (
    env: typeof process.env,
    auth: AuthConfig,
    bedrock: BedrockRuntimeConfig,
    composer: ComposerRuntimeConfig
): EvaluationRuntimeConfig => {
    if (
        env.EVALUATION_RUNTIME_MODE === undefined ||
        env.EVALUATION_RUNTIME_MODE === 'disabled'
    ) {
        return { mode: 'disabled' };
    }

    if (env.EVALUATION_RUNTIME_MODE !== EVALUATION_RUNTIME_ENABLED) {
        throw new Error(
            `Invalid EVALUATION_RUNTIME_MODE value "${env.EVALUATION_RUNTIME_MODE}".`
        );
    }

    if (
        auth.mode !== 'cognito' ||
        bedrock.mode !== 'bedrock' ||
        composer.mode !== 'enabled'
    ) {
        throw new Error(
            'Evaluation runtime requires Cognito authentication, Bedrock runtime, and enabled composer.'
        );
    }

    return { mode: EVALUATION_RUNTIME_ENABLED };
};

export function getApiConfig(env = process.env): ApiConfig {
    const auth = getAuthConfig(env);
    const bedrock = getBedrockRuntimeConfig(env);
    const composer = getComposerRuntimeConfig(env, bedrock);

    return {
        apiLog: getApiLogConfig(env),
        auth,
        bedrock,
        composer,
        evaluation: getEvaluationRuntimeConfig(env, auth, bedrock, composer),
        hostname: env.HOST ?? 'localhost',
        port: parsePort(env.PORT),
        userData: getUserDataConfig(env)
    };
}
