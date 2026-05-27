import { useEffect, useState } from 'react';

import useReading from '../reading/use-deck';

const useDealer = () => {
    const { cutDeck, deck, reversals, shuffleDeck } = useReading();

    const [spread, setSpread] = useState<string[]>();
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [cards, setCards] = useState(deck);

    const dealer = async id => {
        if (id && !isLoading) {
            setIsLoading(true);
            const data = await getReading(id);
            if (data) {
                const c = await getCards(data.reading, data.reversals);
                if (c) {
                    setCards(c);
                }
            }

            return;
        }
    };

    return {
        cardMeanings,
        spread,
        dealer
    };
};

export default useDealer;
