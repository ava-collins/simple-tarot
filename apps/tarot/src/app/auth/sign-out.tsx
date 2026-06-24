import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/use-auth';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';

export default function SignOutScreen() {
  const { signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    async function completeSignOut() {
      await signOut();
      router.replace('/');
    }

    void completeSignOut();
  }, [router, signOut]);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView type="backgroundElement" style={styles.panel}>
          <ThemedText type="subtitle">Signing out</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Clearing this device session...
          </ThemedText>
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
  }
});
