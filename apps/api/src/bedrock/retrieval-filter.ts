import type { RetrievalFilter } from '@aws-sdk/client-bedrock-agent-runtime';
import { CORPUS_VERSION_PATTERN } from '../composer/constants';
import { ComposerUnavailableError } from '../composer/errors';
import type { RetrievalEvaluationFilter } from '../evaluations/contracts';

const CORPUS_VERSION_METADATA_KEY = 'corpusVersion';
const STATUS_METADATA_KEY = 'status';
const APPROVED_STATUS = 'approved';
const DOCUMENT_KIND_METADATA_KEY = 'documentKind';
const CORRESPONDENCE_THEME_DOCUMENT_KIND = 'correspondence-theme';
const INVALID_CORPUS_VERSION_REASON = 'INVALID_CORPUS_VERSION';

export function activeCorpusFilterFor(corpusVersion: string): RetrievalFilter {
    if (!CORPUS_VERSION_PATTERN.test(corpusVersion)) {
        throw new ComposerUnavailableError(INVALID_CORPUS_VERSION_REASON);
    }

    return {
        andAll: [
            {
                equals: {
                    key: CORPUS_VERSION_METADATA_KEY,
                    value: corpusVersion
                }
            },
            {
                equals: {
                    key: STATUS_METADATA_KEY,
                    value: APPROVED_STATUS
                }
            },
            {
                equals: {
                    key: DOCUMENT_KIND_METADATA_KEY,
                    value: CORRESPONDENCE_THEME_DOCUMENT_KIND
                }
            }
        ]
    };
}

export function activeCorpusEvaluationFilterFor(
    corpusVersion: string
): RetrievalEvaluationFilter {
    activeCorpusFilterFor(corpusVersion);

    return {
        corpusVersion,
        documentKind: CORRESPONDENCE_THEME_DOCUMENT_KIND,
        status: APPROVED_STATUS
    };
}
