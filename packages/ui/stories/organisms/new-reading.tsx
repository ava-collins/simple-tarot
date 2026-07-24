import { Dimensions, Platform, StyleSheet, View } from 'react-native';

import Background from '../atoms/background';
import CardDeck from '../atoms/card-deck';
import React from 'react';
import StartArrow from '../atoms/start-arrow';
import { Text } from 'react-native';
import theme from '../utils/theme';

type StartProps = {
    onStart: () => void;
};


const viewHeight = Dimensions.get('window').height;

const arrowTop = Platform.OS === 'web' ? 0 : -10;
const arrowRight = Platform.OS === 'web' ? -50 : -10;

const textLeft = Platform.OS === 'web' ? -10 : -10;
const textSize = Platform.OS === 'web' ? viewHeight * 0.035 : viewHeight * 0.029;

const styles = StyleSheet.create({
    wrapper: {
        flex: 1,
        justifyContent: 'center'
    },
    header: {
        position: 'relative',
        paddingBottom: 10
    },
    text: {
        position: 'relative',
        top: 13,
        left: textLeft,
        fontSize: textSize,
        marginBottom: viewHeight * 0.05,
        zIndex: 10
    },
    arrow: {
        position: 'absolute',
        top: arrowTop,
        right: arrowRight,
        width: 'auto',
        height: 'auto',
        zIndex: 20
    }
});

const NewReading = ({ onStart }: StartProps) => (
    <Background>
        <View style={styles.wrapper}>
            <View style={styles.header}>
                <StartArrow
                    style={styles.arrow}
                    strokeWidth="4"
                    fill={theme.colors.primary}
                />
                <Text style={styles.text}>Tap tarot card to start</Text>
            </View>
            <CardDeck onPress={onStart} />
        </View>
    </Background>
);

export default NewReading;
