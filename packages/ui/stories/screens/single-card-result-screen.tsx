import { ScrollView, StyleSheet, Text, View } from 'react-native';

import Button from '../atoms/button';
import Card from '../atoms/card';
import MobileView from '../templates/mobile-view';
import React from 'react';
import { vmin } from 'react-native-expo-viewport-units';
import theme from '../utils/theme';

export type SingleCardResultScreenProps = {
    cardIndex: number;
    cardName: string;
    position: string;
    reversed: boolean;
    summary: string;
    text: string;
    onDonePress: () => void;
    onHistoryPress?: () => void;
};

const cardWidth = vmin(42);
const cardHeight = vmin(84);

export default function SingleCardResultScreen({
    cardIndex,
    cardName,
    position,
    reversed,
    summary,
    text,
    onDonePress,
    onHistoryPress
}: SingleCardResultScreenProps) {
    return (
        <MobileView>
            <ScrollView contentContainerStyle={styles.screen}>
                <View
                    style={[
                        styles.cardWrapper,
                        reversed && styles.cardWrapperReversed
                    ]}>
                    <Card
                        cardIndex={cardIndex}
                        face
                        styleProps={{ width: cardWidth, height: cardHeight, opacity: 1 }}
                    />
                </View>
                <Text style={styles.eyebrow}>{position}</Text>
                <Text style={styles.title}>{cardName}</Text>
                <Text style={styles.body}>{text}</Text>
                {summary ? <Text style={styles.summaryText}>{summary}</Text> : null}
                <View style={styles.buttonGroup}>
                    <Button
                        label="Done"
                        onPress={onDonePress}
                        size="compact"
                    />
                    {onHistoryPress ? (
                        <Button
                            label="History"
                            onPress={onHistoryPress}
                            size="compact"
                            variant="secondary"
                        />
                    ) : null}
                </View>
            </ScrollView>
        </MobileView>
    );
}

const styles = StyleSheet.create({
    screen: {
        flexGrow: 1,
        alignItems: 'center',
        backgroundColor: theme.colors.grey0,
        gap: 16,
        paddingHorizontal: 24,
        paddingBottom: 48,
        paddingTop: 48
    },
    cardWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
        width: cardWidth,
        height: cardHeight
    },
    cardWrapperReversed: {
        transform: [{ rotate: '180deg' }]
    },
    eyebrow: {
        color: theme.colors.grey5,
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 0,
        textAlign: 'center',
        textTransform: 'uppercase'
    },
    title: {
        color: theme.colors.primary,
        fontSize: 26,
        fontWeight: '700',
        letterSpacing: 0,
        textAlign: 'center'
    },
    body: {
        color: theme.colors.grey5,
        fontSize: 16,
        lineHeight: 22,
        textAlign: 'center'
    },
    summaryText: {
        color: theme.colors.grey5,
        fontSize: 14,
        lineHeight: 20,
        textAlign: 'center'
    },
    buttonGroup: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 12
    }
});
