import { KeyboardAvoidingView } from 'react-native';

import NewReadingForm, {
    type NewReadingFormProps
} from '../organisms/new-reading-form';
import MobileView from '../templates/mobile-view';
import ScreenState from '../molecules/screen-state';

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
                <ScreenState kind="status" message="Checking session..." />
            </MobileView>
        );
    }

    if (!isSignedIn) {
        return (
            <MobileView>
                <ScreenState
                    action={{ label: 'Sign in', onPress: onSignInPress }}
                    kind="prompt"
                    message="Sign in to generate and save readings."
                    title="New reading"
                />
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
