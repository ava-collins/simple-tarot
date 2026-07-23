import { ReadingRequest } from '../readings/contracts';
import { composeCardContexts } from './card-composer';
import { ComposedReadingContext, ComposerBundle } from './contracts';
import { normalizeComposerRequest } from './reading-normalizer';
import { composeRelationshipResults } from './relationship-composer';

export function composeReadingContext(
    request: ReadingRequest,
    bundle: ComposerBundle
): ComposedReadingContext {
    const normalized = normalizeComposerRequest(request, bundle);
    const relationships = composeRelationshipResults(normalized, bundle);

    return {
        composerSchemaVersion: bundle.schemaVersion,
        corpusVersion: bundle.corpusVersion,
        spreadMode: normalized.spreadMode,
        cards: composeCardContexts(normalized, bundle),
        ...relationships
    };
}
