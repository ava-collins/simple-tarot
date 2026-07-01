import { describe, expect, it } from 'vitest';
import { getApiConfig } from './config';

describe('getApiConfig', () => {
    it('uses local Bedrock runtime mode by default', () => {
        expect(getApiConfig({}).bedrock).toEqual({
            mode: 'local',
            maxAttempts: 5,
            retrievalResults: 5
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
});
