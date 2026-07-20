import { createConverseGenerator } from '../bedrock/converse-client';
import { BedrockGenerationUnavailableError } from '../bedrock/errors';
import { createExplicitRagReadingGenerator } from '../bedrock/explicit-rag-generator';
import type { ExplicitRagReadingGenerator } from '../bedrock/explicit-rag-types';
import { createKnowledgeBaseRetriever } from '../bedrock/knowledge-base-retriever';
import { createComposerBundleLoader } from '../composer/bundle-loader';
import type { ComposerRuntime } from '../composer/runtime';
import { createComposerRuntime } from '../composer/runtime';
import { createS3ArtifactReader } from '../composer/s3-artifact-reader';
import type { ApiConfig } from '../config';
import type { ApiLogSink } from '../logging/api-log-sink';
import { createS3ApiLogSink } from '../logging/api-log-sink';
import { createDynamoDbReadingHistoryStore } from './persistence/dynamodb-reading-history-store';
import type { ReadingHistoryStore } from './persistence/contracts';
import { createLocalGeneratedReading } from './local-generated-reading';
import {
    createReadingExecutor,
    type ReadingExecutor,
    type ReadingGenerator
} from './reading-executor';

export type ReadingRuntime = {
    apiLogSink?: ApiLogSink;
    executor: ReadingExecutor;
    generationMode: 'local' | 'bedrock';
    readingHistoryStore?: ReadingHistoryStore;
};

type ReadingRuntimeFactories = {
    createApiLogSink(bucketName: string): ApiLogSink;
    createComposer(config: ApiConfig): ComposerRuntime;
    createExplicitGenerator(config: ApiConfig): ExplicitRagReadingGenerator;
    createReadingHistoryStore(tableName: string): ReadingHistoryStore;
};

const defaultFactories: ReadingRuntimeFactories = {
    createApiLogSink: bucketName => createS3ApiLogSink({ bucketName }),
    createComposer: config => {
        if (config.bedrock.mode !== 'bedrock' || config.composer.mode !== 'enabled') {
            throw new BedrockGenerationUnavailableError();
        }

        return createComposerRuntime({
            loader: createComposerBundleLoader({
                dataSourceId: config.composer.dataSourceId,
                knowledgeBaseId: config.bedrock.knowledgeBaseId,
                reader: createS3ArtifactReader({
                    bucketName: config.composer.bucketName
                })
            })
        });
    },
    createExplicitGenerator: config => {
        if (config.bedrock.mode !== 'bedrock') {
            throw new BedrockGenerationUnavailableError();
        }

        return createExplicitRagReadingGenerator({
            converse: createConverseGenerator(config.bedrock),
            retriever: createKnowledgeBaseRetriever(config.bedrock)
        });
    },
    createReadingHistoryStore: tableName =>
        createDynamoDbReadingHistoryStore({ tableName })
};

export function createReadingRuntime(
    config: ApiConfig,
    factoryOverrides: Partial<ReadingRuntimeFactories> = {}
): ReadingRuntime {
    const factories = { ...defaultFactories, ...factoryOverrides };
    const composerRuntime =
        config.bedrock.mode === 'bedrock' && config.composer.mode === 'enabled'
            ? factories.createComposer(config)
            : undefined;
    const explicitGenerator =
        config.bedrock.mode === 'bedrock'
            ? factories.createExplicitGenerator(config)
            : undefined;
    const generate: ReadingGenerator = explicitGenerator
        ? async (request, context, requestId) => {
              if (!context) {
                  throw new BedrockGenerationUnavailableError();
              }

              return explicitGenerator.generateReading({
                  context,
                  request,
                  requestId
              });
          }
        : async request => ({ generated: createLocalGeneratedReading(request) });

    return {
        ...(config.apiLog.bucketName
            ? { apiLogSink: factories.createApiLogSink(config.apiLog.bucketName) }
            : {}),
        executor: createReadingExecutor({
            composerMode: config.composer.mode,
            ...(composerRuntime === undefined ? {} : { composerRuntime }),
            generate
        }),
        generationMode: config.bedrock.mode,
        ...(config.userData.tableName
            ? {
                  readingHistoryStore: factories.createReadingHistoryStore(
                      config.userData.tableName
                  )
              }
            : {})
    };
}
