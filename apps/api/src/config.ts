export type ApiConfig = {
    bedrock: BedrockRuntimeConfig;
    hostname: string;
    port: number;
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

const modelArnFor = (region: string, env: NodeJS.ProcessEnv): string | undefined => {
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
    return modelId
        ? `arn:aws:bedrock:${region}::foundation-model/${modelId}`
        : undefined;
};

const getBedrockRuntimeConfig = (env: NodeJS.ProcessEnv): BedrockRuntimeConfig => {
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
        bedrock: getBedrockRuntimeConfig(env),
        hostname: env.HOST ?? 'localhost',
        port: parsePort(env.PORT)
    };
}
