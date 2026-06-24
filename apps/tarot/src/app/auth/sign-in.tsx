import { useRouter, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/use-auth';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';

export default function SignInScreen() {
  const { authRequestReady, error, getSignInDebugInfo, isSignedIn, signIn } = useAuth();
  const router = useRouter();
  const [isStarting, setIsStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  useEffect(() => {
    console.log('[auth] sign-in screen state', { authRequestReady, isStarting, isSignedIn });

    if (isSignedIn) {
      router.replace('/account' as Href);
    }
  }, [authRequestReady, isStarting, isSignedIn, router]);

  const startSignIn = async () => {
    console.log('[auth] continue pressed', { authRequestReady, isStarting, isSignedIn });
    setIsStarting(true);
    setStartError(null);

    try {
      console.log('[auth] sign-in request debug', await getSignInDebugInfo());
      await signIn();
      console.log('[auth] signIn prompt completed');
    } catch (signInError) {
      console.log('[auth] signIn prompt failed', signInError);
      setStartError(signInError instanceof Error ? signInError.message : 'Unable to start sign in.');
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView type="backgroundElement" style={styles.panel}>
          <ThemedText type="subtitle">Sign in</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Continue with the secure Cognito sign-in page.
          </ThemedText>
          {(startError || error) && (
            <ThemedText type="small" style={styles.errorText}>
              {startError ?? error}
            </ThemedText>
          )}
          <Pressable
              accessibilityRole="button"
              disabled={!authRequestReady || isStarting}
              onPress={startSignIn}
              style={({ pressed }) => [
                styles.button,
                (!authRequestReady || isStarting) && styles.disabledButton,
                pressed && styles.pressed
              ]}>
            <ThemedText type="smallBold" style={styles.buttonText}>
              {isStarting ? 'Opening...' : 'Continue'}
            </ThemedText>
          </Pressable>
        </ThemedView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center'
  },
  safeArea: {
    flex: 1,
    justifyContent: 'center',
    maxWidth: MaxContentWidth,
    padding: Spacing.four
  },
  panel: {
    gap: Spacing.three,
    padding: Spacing.four,
    borderRadius: Spacing.two
  },
  button: {
    alignItems: 'center',
    backgroundColor: '#3c87f7',
    borderRadius: Spacing.two,
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: Spacing.four
  },
  disabledButton: {
    opacity: 0.5
  },
  pressed: {
    opacity: 0.75
  },
  buttonText: {
    color: '#ffffff'
  },
  errorText: {
    color: '#B42318'
  }
});
