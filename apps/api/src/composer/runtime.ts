import { AppLogger, logger } from '../logger';
import { ReadingRequest } from '../readings/contracts';
import { ComposerBundleLoader } from './bundle-loader';
import { composeReadingContext } from './compose-reading';
import { ComposedReadingContext } from './contracts';

export type ComposerRuntime = {
    compose(
        request: ReadingRequest,
        requestId?: string
    ): Promise<ComposedReadingContext>;
};

export type ComposerRuntimeOptions = {
    loader: ComposerBundleLoader;
    logInfo?: AppLogger['logInfo'];
    now?: () => number;
};

export function createComposerRuntime({
    loader,
    logInfo = logger.logInfo,
    now = Date.now
}: ComposerRuntimeOptions): ComposerRuntime {
    return {
        async compose(request, requestId) {
            const loadStartedAt = now();
            const { bundle } = await loader.loadActiveBundle();
            const loadDurationMs = Math.max(0, now() - loadStartedAt);
            const context = composeReadingContext(request, bundle);

            logInfo('Composer context prepared.', {
                cardCount: context.cards.length,
                composerMode: 'enabled',
                corpusVersion: context.corpusVersion,
                loadDurationMs,
                namedPairCount: context.namedPairResults.length,
                requestId,
                wholeSpreadCount: context.wholeSpreadResults.length
            });

            return context;
        }
    };
}
