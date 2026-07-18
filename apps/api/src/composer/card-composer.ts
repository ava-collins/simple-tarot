import { MAX_THEMES_PER_CARD } from './constants';
import {
    ComposedCardContext,
    ComposedTheme,
    ComposerBundle,
    ComposerCard,
    ComposerOrientation,
    NormalizedComposerCard,
    NormalizedComposerRequest,
    ThemeFragment
} from './contracts';
import { matchesCardPredicate } from './predicate-evaluator';

export const positionMeaningKeyFor = (
    spreadId: string,
    positionId: string,
    cardId: string,
    orientation: ComposerOrientation
): string => `${spreadId}:${positionId}:${cardId}:${orientation}`;

const subjectOrderFor = (
    theme: ThemeFragment,
    card: ComposerCard,
    bundle: ComposerBundle
): number | undefined => {
    const orders = theme.subjects.flatMap(subject => {
        if (subject.type === 'card' && subject.id === card.id) {
            return [-1];
        }

        const index = card.correspondenceIds.indexOf(subject.id);
        const correspondence = bundle.correspondencesById[subject.id];

        return index >= 0 && correspondence?.kind === subject.type ? [index] : [];
    });

    return orders.length > 0 ? Math.min(...orders) : undefined;
};

const themesFor = (
    normalized: NormalizedComposerCard,
    bundle: ComposerBundle
): ComposedTheme[] =>
    bundle.approvedThemeFragments
        .flatMap(theme => {
            const subjectOrder = subjectOrderFor(theme, normalized.card, bundle);
            if (
                subjectOrder === undefined ||
                theme.kind !== 'correspondence-theme' ||
                theme.status !== 'approved' ||
                !matchesCardPredicate(theme.when, {
                    card: normalized.card,
                    correspondencesById: bundle.correspondencesById,
                    orientation: normalized.orientation
                })
            ) {
                return [];
            }

            return [{ subjectOrder, theme }];
        })
        .sort(
            (left, right) =>
                left.subjectOrder - right.subjectOrder ||
                left.theme.id.localeCompare(right.theme.id)
        )
        .slice(0, MAX_THEMES_PER_CARD)
        .map(({ theme }) => ({
            id: theme.id,
            polarity: theme.polarity,
            theme: theme.theme
        }));

const exactMeaningFor = (
    normalized: NormalizedComposerCard,
    spreadId: string | undefined,
    bundle: ComposerBundle
): string | undefined => {
    if (!spreadId || !normalized.position) {
        return undefined;
    }

    const key = positionMeaningKeyFor(
        spreadId,
        normalized.position.id,
        normalized.card.id,
        normalized.orientation
    );
    const meaning = bundle.legacyPositionMeaningsByKey[key];

    return meaning?.status === 'approved' &&
        meaning.spreadId === spreadId &&
        meaning.positionId === normalized.position.id &&
        meaning.cardId === normalized.card.id &&
        meaning.orientation === normalized.orientation
        ? meaning.meaning
        : undefined;
};

export function composeCardContexts(
    normalized: NormalizedComposerRequest,
    bundle: ComposerBundle
): ComposedCardContext[] {
    const spreadId = normalized.spread?.id;

    return normalized.cards.map(item => {
        const exactMeaning = exactMeaningFor(item, spreadId, bundle);

        return {
            cardId: item.card.id,
            cardIndex: item.card.index,
            cardName: item.card.name,
            title: item.card.title,
            arcana: item.card.arcana,
            description: item.card.description,
            orientation: item.orientation,
            orientationKeywords: [
                ...(item.orientation === 'upright'
                    ? item.card.uprightKeywords
                    : item.card.reversedKeywords)
            ],
            presentationPosition: item.presentationPosition,
            ...(item.position ? { position: { ...item.position } } : {}),
            ...(exactMeaning ? { exactMeaning } : {}),
            themes: themesFor(item, bundle)
        };
    });
}

