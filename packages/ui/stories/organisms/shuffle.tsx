import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import React, { useState } from 'react';

import { CARD_ARRAY } from '../utils/const';
import { Percentage } from '../utils/fonts';
import ShuffleCard from '../molecules/shuffle-card';
import TheSpread from '../atoms/the-spread';
import { useInstructions } from '@simpletarot/hooks/client';

type ShuffleProps = {
    done: () => void;
    shuffleDeck: () => void;
    cutDeck: () => void;
};

const { width } = Dimensions.get('window');
const instructionTextSize = Percentage(2.5);

export default function Shuffle({ done, cutDeck, shuffleDeck }) {
    const [isShuffling, setIsShuffling] = useState(true);
    const [cutCount, setCutCount] = useState(0);
    const [cutCardIndex, setCutCardIndex] = useState(0);
    const { instruction, next } = useInstructions();

    const cutCards = (selectedCardIndex: number) => {
        cutDeck(selectedCardIndex);
        setCutCardIndex(selectedCardIndex);
        setCutCount(cutCount + 1);
        if (cutCount < 2) {
            setIsShuffling(true);
            setTimeout(() => {
                next();
                shuffleDeck();
            }, 100);
        } else {
            next();
            done();
        }
    };

    const stopShuffle = () => {
        setIsShuffling(false);
        next();
    };

    return (
        <View style={styles.container}>
            <View style={styles.instructionWrapper}>
                <Text style={styles.instructions}>{instruction}</Text>
            </View>
            {isShuffling && <Pressable onPress={stopShuffle} style={styles.wrapper} />}
            <TheSpread>
                {CARD_ARRAY.map(index => (
                    <ShuffleCard
                        cardIndex={index}
                        key={index}
                        isShuffling={isShuffling}
                        cutCardIndex={cutCardIndex}
                        cutCards={cutCards}
                    />
                ))}
            </TheSpread>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'column'
    },
    wrapper: {
        position: 'absolute',
        top: 60,
        left: 0,
        width,
        height: width * 1.5,
        zIndex: 10
    },
    instructionWrapper: {
        flexBasis: 120,
        paddingHorizontal: 10
    },
    instructions: {
        fontSize: instructionTextSize,
        textAlign: 'center'
    }
});
