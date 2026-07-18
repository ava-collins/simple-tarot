import { ReadingItem, ReadingRequest } from '../readings/contracts';
import {
    CELTIC_CROSS_BUNDLE_SPREAD,
    CELTIC_CROSS_REQUEST_SPREAD,
    SINGLE_CARD_REQUEST_SPREAD
} from './constants';
import {
    ComposerBundle,
    ComposerCard,
    ComposerOrientation,
    ComposerSpread,
    NormalizedComposerCard,
    NormalizedComposerRequest,
    SpreadPosition
} from './contracts';
import { ComposerDomainError, ComposerUnavailableError } from './errors';

const CELTIC_CROSS_POSITION_COUNT = 10;

const orientationFor = (item: ReadingItem): ComposerOrientation =>
    item.reversed ? 'reversed' : 'upright';

const cardsByIndexFor = (bundle: ComposerBundle): Map<number, ComposerCard> => {
    const cardsByIndex = new Map<number, ComposerCard>();

    for (const card of Object.values(bundle.cardsById)) {
        if (!Number.isInteger(card.index) || cardsByIndex.has(card.index)) {
            throw new ComposerUnavailableError('INVALID_COMPOSER_ARTIFACT');
        }
        cardsByIndex.set(card.index, card);
    }

    return cardsByIndex;
};

const cardFor = (
    item: ReadingItem,
    cardsByIndex: Map<number, ComposerCard>
): ComposerCard => {
    const card = cardsByIndex.get(item.cardIndex);

    if (!card || card.name !== item.cardName) {
        throw new ComposerDomainError('INVALID_CARD_SELECTION');
    }

    return card;
};

const normalizedCardFor = (
    item: ReadingItem,
    cardsByIndex: Map<number, ComposerCard>,
    position?: SpreadPosition
): NormalizedComposerCard => ({
    card: cardFor(item, cardsByIndex),
    orientation: orientationFor(item),
    presentationPosition: item.position,
    ...(position ? { position } : {})
});

const orderedPositionsFor = (spread: ComposerSpread): SpreadPosition[] => {
    if (spread.positions.length !== CELTIC_CROSS_POSITION_COUNT) {
        throw new ComposerUnavailableError('INVALID_COMPOSER_ARTIFACT');
    }

    const ordered = [...spread.positions].sort((left, right) => left.order - right.order);
    const ids = new Set(ordered.map(position => position.id));
    const hasExpectedOrders = ordered.every(
        (position, index) => position.order === index + 1
    );

    if (ids.size !== ordered.length || !hasExpectedOrders) {
        throw new ComposerUnavailableError('INVALID_COMPOSER_ARTIFACT');
    }

    return ordered;
};

const normalizeSingleCard = (
    request: ReadingRequest,
    cardsByIndex: Map<number, ComposerCard>
): NormalizedComposerRequest => {
    if (request.items.length !== 1) {
        throw new ComposerDomainError('INVALID_COMPOSER_SPREAD');
    }
    const [item] = request.items;
    if (!item) {
        throw new ComposerDomainError('INVALID_COMPOSER_SPREAD');
    }

    return {
        spreadMode: 'single-card',
        cards: [normalizedCardFor(item, cardsByIndex)]
    };
};

const normalizeCelticCross = (
    request: ReadingRequest,
    bundle: ComposerBundle,
    cardsByIndex: Map<number, ComposerCard>
): NormalizedComposerRequest => {
    const spread = bundle.spreadsById[CELTIC_CROSS_BUNDLE_SPREAD];
    if (!spread) {
        throw new ComposerUnavailableError('INVALID_COMPOSER_ARTIFACT');
    }

    const positions = orderedPositionsFor(spread);
    if (request.items.length !== positions.length) {
        throw new ComposerDomainError('INVALID_COMPOSER_SPREAD');
    }

    const cards = request.items.map((item, index) => {
        const position = positions[index];
        if (!position || item.position !== position.id) {
            throw new ComposerDomainError('INVALID_COMPOSER_SPREAD');
        }

        return normalizedCardFor(item, cardsByIndex, position);
    });

    return {
        spreadMode: 'celtic-cross',
        spread,
        cards
    };
};

export function normalizeComposerRequest(
    request: ReadingRequest,
    bundle: ComposerBundle
): NormalizedComposerRequest {
    const cardsByIndex = cardsByIndexFor(bundle);

    if (request.spread === SINGLE_CARD_REQUEST_SPREAD) {
        return normalizeSingleCard(request, cardsByIndex);
    }

    if (request.spread === CELTIC_CROSS_REQUEST_SPREAD) {
        return normalizeCelticCross(request, bundle, cardsByIndex);
    }

    throw new ComposerDomainError('INVALID_COMPOSER_SPREAD');
}
