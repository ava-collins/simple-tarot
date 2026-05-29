import { useCallback, useMemo, useState } from 'react';

type Deck = number[];
type ReversalMap = boolean[];

type SpreadPosition = {
    name: string;
    displayName: string;
    description: string;
};

type Spread = {
    positions?: SpreadPosition[];
};

type ReadingCard = {
    celtic_cross: {
        reversed: Record<string, string>;
        upright: Record<string, string>;
    };
    description?: string;
    element?: string;
    exaltation?: string;
    hex: string;
    image: string;
    index: number;
    keywords?: string;
    name: string;
    number: string;
    path?: string;
    reversedKeywords?: string;
    title?: string;
};

type DealInput = {
    cards?: ReadingCard[];
    spread?: Spread;
};

const DECK_SIZE = 78;

const range = (size: number): number[] => Array.from({ length: size }, (_, i) => i);

const shuffle = <T>(input: readonly T[]): T[] => {
    const arr = [...input];
    for (let i = arr.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        const current = arr[i];
        arr[i] = arr[j] as T;
        arr[j] = current as T;
    }

    return arr;
};

const randomReversalFlags = (size: number): boolean[] =>
    Array.from({ length: size }, () => Math.random() < 0.5);

const useReading = () => {
    const [deck, setDeck] = useState<Deck>(() => shuffle(range(DECK_SIZE)));
    const [reversals, setReversals] = useState<ReversalMap>(() =>
        randomReversalFlags(DECK_SIZE)
    );

    const shuffleDeck = useCallback(() => {
        setDeck(prev => shuffle(prev));
        setReversals(prev => randomReversalFlags(prev.length));
    }, []);

    const cutDeck = useCallback((index: number) => {
        setDeck(prev => {
            if (index <= 0 || index >= prev.length) {
                return prev;
            }

            return prev.slice(index).concat(prev.slice(0, index));
        });
    }, []);

    const deal = useCallback(
        ({ cards = [], spread }: DealInput) => {
            const positions = spread?.positions ?? [];
            if (!positions.length) {
                return [];
            }

            return positions.reduce<
                Array<{
                    positionName: string;
                    displayName: string;
                    positionDescription: string;
                    cardName: string;
                    cardTitle: string;
                    cardNumber: string;
                    cardDescription: string;
                    cardReading: string;
                    element: string;
                    exaltation: string;
                    hex: string;
                    image: string;
                    index: number;
                    path: string;
                    keywords: string;
                    reversed: boolean;
                }>
            >((reading, pos, index) => {
                const card = cards[index];
                if (!card) {
                    return reading;
                }

                const cardId = typeof card.index === 'number' ? card.index : index;
                const isReversed = Boolean(reversals[cardId]);
                const desc = isReversed
                    ? (card.celtic_cross.reversed[pos.name] ?? '')
                    : (card.celtic_cross.upright[pos.name] ?? '');

                reading.push({
                    positionName: pos.name,
                    displayName: pos.displayName,
                    positionDescription: pos.description,
                    cardName: card.name,
                    cardTitle: card.title || '',
                    cardNumber: card.number,
                    cardDescription: card.description || '',
                    cardReading: desc,
                    element: card.element || '',
                    exaltation: card.exaltation || '',
                    hex: card.hex,
                    image: card.image,
                    index: card.index,
                    path: card.path || '',
                    keywords: isReversed
                        ? card.reversedKeywords || ''
                        : card.keywords || '',
                    reversed: isReversed
                });

                return reading;
            }, []);
        },
        [reversals]
    );

    return useMemo(
        () => ({
            cutDeck,
            deal,
            deck,
            reversals,
            shuffleDeck
        }),
        [cutDeck, deal, deck, reversals, shuffleDeck]
    );
};

export default useReading;
