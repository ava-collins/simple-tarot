import {
    KeyboardAvoidingView,
    Pressable,
    StyleSheet,
    Text,
    View
} from 'react-native';

import NewReadingForm, {
    type NewReadingFormProps
} from '../organisms/new-reading-form';
import MobileView from '../templates/mobile-view';
import theme from '../utils/theme';

export type NewReadingScreenProps = {
    error?: string | null;
    isAuthLoading: boolean;
    isGenerating: boolean;
    isSignedIn: boolean;
    latestReading: NewReadingFormProps['latestReading'];
    onBackPress: () => void;
    onGeneratePress: (question: string) => Promise<void> | void;
    onHistoryPress: () => void;
    onSignInPress: () => void;
};

export default function NewReadingScreen({
    error,
    isAuthLoading,
    isGenerating,
    isSignedIn,
    latestReading,
    onBackPress,
    onGeneratePress,
    onHistoryPress,
    onSignInPress
}: NewReadingScreenProps) {
    if (isAuthLoading) {
        return (
            <MobileView>
                <View style={styles.centered}>
                    <Text style={styles.mutedText}>Checking session...</Text>
                </View>
            </MobileView>
        );
    }

    if (!isSignedIn) {
        return (
            <MobileView>
                <View style={styles.centered}>
                    <Text style={styles.title}>New reading</Text>
                    <Text style={styles.body}>
                        Sign in to generate and save readings.
                    </Text>
                    <Pressable
                        accessibilityRole="button"
                        onPress={onSignInPress}
                        style={({ pressed }) => [
                            styles.primaryButton,
                            pressed && styles.pressed
                        ]}>
                        <Text style={styles.primaryButtonText}>Sign in</Text>
                    </Pressable>
                </View>
            </MobileView>
        );
    }

    return (
        <MobileView>
            <KeyboardAvoidingView behavior="padding" keyboardVerticalOffset={100}>
                <NewReadingForm
                    error={error}
                    isGenerating={isGenerating}
                    latestReading={latestReading}
                    onBackPress={onBackPress}
                    onGeneratePress={onGeneratePress}
                    onHistoryPress={onHistoryPress}
                />
            </KeyboardAvoidingView>
        </MobileView>
    );
}

const styles = StyleSheet.create({
    centered: {
        flex: 1,
        alignItems: 'stretch',
        justifyContent: 'center',
        gap: 16,
        backgroundColor: theme.colors.grey0,
        paddingHorizontal: 32
    },
    title: {
        color: theme.colors.primary,
        fontSize: 30,
        fontWeight: '700',
        letterSpacing: 0
    },
    body: {
        color: theme.colors.grey5,
        fontSize: 16,
        lineHeight: 22
    },
    mutedText: {
        color: theme.colors.grey4,
        fontSize: 15
    },
    primaryButton: {
        alignItems: 'center',
        backgroundColor: theme.colors.black,
        borderRadius: 6,
        minHeight: 52,
        justifyContent: 'center',
        paddingHorizontal: 20
    },
    primaryButtonText: {
        color: theme.colors.white,
        fontSize: 16,
        fontWeight: '700'
    },
    pressed: {
        opacity: 0.7
    }
});
