export type ApiConfig = {
    apiLog: ApiLogConfig;
    auth: AuthConfig;
    bedrock: BedrockRuntimeConfig;
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

export function getApiConfig(env = process.env): ApiConfig {
    return {
        apiLog: getApiLogConfig(env),
        auth: getAuthConfig(env),
        bedrock: getBedrockRuntimeConfig(env),
        hostname: env.HOST ?? 'localhost',
        port: parsePort(env.PORT),
        userData: getUserDataConfig(env)
    };
}
