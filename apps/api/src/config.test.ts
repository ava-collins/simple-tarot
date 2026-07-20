import { describe, expect, it } from 'vitest';
import { getApiConfig } from './config';

const bedrockEnv = {
    BEDROCK_RUNTIME_MODE: 'bedrock',
    BEDROCK_REGION: 'us-east-1',
    BEDROCK_KNOWLEDGE_BASE_ID: 'KB123',
    BEDROCK_MODEL_ID: 'anthropic.claude-sonnet-4-5-20250929-v1:0'
};

const cognitoEnv = {
    API_AUTH_MODE: 'cognito',
    COGNITO_CLIENT_ID: 'public-client-id',
    COGNITO_ISSUER:
        'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_example'
};

const composerEnv = {
    COMPOSER_RUNTIME_MODE: 'enabled',
    BEDROCK_CORPUS_BUCKET: 'invented-bucket',
    BEDROCK_DATA_SOURCE_ID: 'DS123'
};

describe('getApiConfig', () => {
    it('uses disabled auth and local Bedrock runtime mode by default', () => {
        expect(getApiConfig({})).toMatchObject({
            auth: {
                mode: 'disabled'
            },
            bedrock: {
                mode: 'local',
                maxAttempts: 5,
                retrievalResults: 5
            },
            composer: {
                mode: 'disabled'
            },
            evaluation: {
                mode: 'disabled'
            }
        });
    });

    it('loads Cognito API auth configuration from environment values', () => {
        expect(
            getApiConfig({
                API_AUTH_MODE: 'cognito',
                COGNITO_CLIENT_ID: 'public-client-id',
                COGNITO_ISSUER:
                    'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_example'
            }).auth
        ).toEqual({
            mode: 'cognito',
            clientId: 'public-client-id',
            issuer: 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_example'
        });
    });

    it('requires Cognito auth values when API auth is enabled', () => {
        expect(() =>
            getApiConfig({
                API_AUTH_MODE: 'cognito'
            })
        ).toThrow(
            'Missing Cognito auth environment variables: COGNITO_ISSUER, COGNITO_CLIENT_ID'
        );
    });

    it('loads the user data table name when configured', () => {
        expect(
            getApiConfig({
                USER_DATA_TABLE_NAME: 'simple-tarot-dev-user-data'
            }).userData
        ).toEqual({
            tableName: 'simple-tarot-dev-user-data'
        });
    });

    it('loads the API log bucket name when configured', () => {
        expect(
            getApiConfig({
                API_LOG_BUCKET_NAME: 'simple-tarot-dev-api-logs'
            }).apiLog
        ).toEqual({
            bucketName: 'simple-tarot-dev-api-logs'
        });
    });

    it('loads Bedrock runtime configuration from environment values', () => {
        expect(
            getApiConfig({
                BEDROCK_RUNTIME_MODE: 'bedrock',
                BEDROCK_REGION: 'us-east-1',
                BEDROCK_KNOWLEDGE_BASE_ID: 'KB123',
                BEDROCK_MODEL_ID: 'anthropic.claude-sonnet-4-5-20250929-v1:0',
                BEDROCK_MAX_ATTEMPTS: '6',
                BEDROCK_RETRIEVAL_RESULTS: '7'
            }).bedrock
        ).toEqual({
            mode: 'bedrock',
            knowledgeBaseId: 'KB123',
            maxAttempts: 6,
            modelArn:
                'arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-sonnet-4-5-20250929-v1:0',
            region: 'us-east-1',
            retrievalResults: 7
        });
    });

    it('accepts an explicit model ARN', () => {
        expect(
            getApiConfig({
                BEDROCK_RUNTIME_MODE: 'bedrock',
                BEDROCK_REGION: 'us-east-1',
                BEDROCK_KNOWLEDGE_BASE_ID: 'KB123',
                BEDROCK_MODEL_ARN:
                    'arn:aws:bedrock:us-east-1::foundation-model/custom-model'
            }).bedrock
        ).toMatchObject({
            modelArn: 'arn:aws:bedrock:us-east-1::foundation-model/custom-model'
        });
    });

    it('prefers an inference profile ARN over a single-region model id', () => {
        expect(
            getApiConfig({
                BEDROCK_RUNTIME_MODE: 'bedrock',
                BEDROCK_REGION: 'us-east-1',
                BEDROCK_KNOWLEDGE_BASE_ID: 'KB123',
                BEDROCK_INFERENCE_PROFILE_ARN:
                    'arn:aws:bedrock:us-east-1:123456789012:inference-profile/global.anthropic.claude-sonnet-4-5-20250929-v1:0',
                BEDROCK_MODEL_ID: 'anthropic.claude-sonnet-4-5-20250929-v1:0'
            }).bedrock
        ).toMatchObject({
            modelArn:
                'arn:aws:bedrock:us-east-1:123456789012:inference-profile/global.anthropic.claude-sonnet-4-5-20250929-v1:0'
        });
    });

    it('accepts a cross-region inference profile id directly', () => {
        expect(
            getApiConfig({
                BEDROCK_RUNTIME_MODE: 'bedrock',
                BEDROCK_REGION: 'us-east-1',
                BEDROCK_KNOWLEDGE_BASE_ID: 'KB123',
                BEDROCK_INFERENCE_PROFILE_ID:
                    'global.anthropic.claude-sonnet-4-5-20250929-v1:0'
            }).bedrock
        ).toMatchObject({
            modelArn: 'global.anthropic.claude-sonnet-4-5-20250929-v1:0'
        });
    });

    it('requires Bedrock runtime values when Bedrock mode is enabled', () => {
        expect(() =>
            getApiConfig({
                BEDROCK_RUNTIME_MODE: 'bedrock'
            })
        ).toThrow(
            'Missing Bedrock runtime environment variables: BEDROCK_REGION, BEDROCK_KNOWLEDGE_BASE_ID, BEDROCK_MODEL_ID, BEDROCK_MODEL_ARN, BEDROCK_INFERENCE_PROFILE_ID, or BEDROCK_INFERENCE_PROFILE_ARN'
        );
    });

    it('keeps composer disabled in local mode even when enabled values are present', () => {
        expect(
            getApiConfig({
                COMPOSER_RUNTIME_MODE: 'enabled',
                BEDROCK_CORPUS_BUCKET: 'invented-bucket',
                BEDROCK_DATA_SOURCE_ID: 'DS123'
            }).composer
        ).toEqual({ mode: 'disabled' });
    });

    it('defaults composer disabled in Bedrock mode', () => {
        expect(getApiConfig(bedrockEnv).composer).toEqual({ mode: 'disabled' });
    });

    it('loads enabled composer identities in Bedrock mode', () => {
        expect(
            getApiConfig({
                ...bedrockEnv,
                COMPOSER_RUNTIME_MODE: 'enabled',
                BEDROCK_CORPUS_BUCKET: ' invented-bucket ',
                BEDROCK_DATA_SOURCE_ID: ' DS123 '
            }).composer
        ).toEqual({
            mode: 'enabled',
            bucketName: 'invented-bucket',
            dataSourceId: 'DS123'
        });
    });

    it('requires both composer identities only when enabled in Bedrock mode', () => {
        expect(() =>
            getApiConfig({
                ...bedrockEnv,
                COMPOSER_RUNTIME_MODE: 'enabled'
            })
        ).toThrow(
            'Missing composer runtime environment variables: BEDROCK_CORPUS_BUCKET, BEDROCK_DATA_SOURCE_ID'
        );

        expect(() =>
            getApiConfig({
                ...bedrockEnv,
                COMPOSER_RUNTIME_MODE: 'disabled'
            })
        ).not.toThrow();
    });

    it('rejects an unknown composer mode in Bedrock mode', () => {
        expect(() =>
            getApiConfig({
                ...bedrockEnv,
                COMPOSER_RUNTIME_MODE: 'sometimes'
            })
        ).toThrow('Invalid COMPOSER_RUNTIME_MODE value "sometimes".');
    });

    it('enables evaluation with Cognito, Bedrock, and composer prerequisites', () => {
        expect(
            getApiConfig({
                ...bedrockEnv,
                ...cognitoEnv,
                ...composerEnv,
                EVALUATION_RUNTIME_MODE: 'enabled'
            }).evaluation
        ).toEqual({ mode: 'enabled' });
    });

    it.each([
        {
            env: { ...bedrockEnv, ...composerEnv },
            missing: 'Cognito authentication'
        },
        {
            env: { ...cognitoEnv, ...composerEnv },
            missing: 'Bedrock runtime'
        },
        {
            env: { ...bedrockEnv, ...cognitoEnv },
            missing: 'enabled composer'
        }
    ])('rejects enabled evaluation without $missing', ({ env }) => {
        expect(() =>
            getApiConfig({
                ...env,
                EVALUATION_RUNTIME_MODE: 'enabled'
            })
        ).toThrow(
            'Evaluation runtime requires Cognito authentication, Bedrock runtime, and enabled composer.'
        );
    });

    it('rejects an unknown evaluation mode', () => {
        expect(() =>
            getApiConfig({
                EVALUATION_RUNTIME_MODE: 'sometimes'
            })
        ).toThrow('Invalid EVALUATION_RUNTIME_MODE value "sometimes".');
    });
});
