import { buildExplicitGenerationPrompt } from '../composer/prompt-builder';
import type { AppLogger } from '../logger';
import { logger } from '../logger';
import {
    activeCorpusEvaluationFilterFor,
    activeCorpusFilterFor
} from './retrieval-filter';
import { buildRetrievalEvidence } from './retrieval-evidence';
import { buildRetrievalQuery } from './retrieval-query-builder';
import type {
    ConverseGenerator,
    ExplicitRagReadingGenerator,
    KnowledgeBaseRetriever
} from './explicit-rag-types';

type ExplicitRagGeneratorOptions = {
    converse: ConverseGenerator;
    logInfo?: AppLogger['logInfo'];
    retriever: KnowledgeBaseRetriever;
};

export function createExplicitRagReadingGenerator({
    converse,
    logInfo = logger.logInfo,
    retriever
}: ExplicitRagGeneratorOptions): ExplicitRagReadingGenerator {
    return {
        async generateReading(input) {
            if (
                input.context.composerSchemaVersion === 2 &&
                input.context.spreadMode === 'single-card'
            ) {
                const prompt = buildExplicitGenerationPrompt(
                    input.request,
                    input.context,
                    []
                );
                const generation = await converse.generate(
                    prompt,
                    input.requestId
                );

                return {
                    generated: generation.generated,
                    trace: {
                        mode: 'deterministic',
                        generation: generation.trace,
                        prompt
                    }
                };
            }

            const query = buildRetrievalQuery(input.request, input.context);
            const retrieval = await retriever.retrieve({
                filter: activeCorpusFilterFor(input.context.corpusVersion),
                query,
                requestId: input.requestId
            });
            const evidence = buildRetrievalEvidence(retrieval.results);
            logInfo('Retrieval evidence prepared.', {
                requestId: input.requestId,
                usableResultCount: evidence.usableResultCount,
                zeroUsableResults: evidence.usableResultCount === 0
            });
            const prompt = buildExplicitGenerationPrompt(
                input.request,
                input.context,
                evidence.chunks
            );

            const generation = await converse.generate(prompt, input.requestId);

            return {
                generated: generation.generated,
                trace: {
                    mode: 'explicit-rag',
                    generation: generation.trace,
                    prompt,
                    retrieval: {
                        durationMs: retrieval.durationMs,
                        filter: activeCorpusEvaluationFilterFor(
                            input.context.corpusVersion
                        ),
                        query,
                        requestedResultCount: retrieval.requestedResultCount,
                        results: evidence.results,
                        returnedResultCount: retrieval.results.length,
                        totalEvidenceCharacters:
                            evidence.totalEvidenceCharacters,
                        usableResultCount: evidence.usableResultCount
                    }
                }
            };
        }
    };
}
