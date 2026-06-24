import { Link, useRouter, type Href } from 'expo-router';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/use-auth';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';

function claimText(value: unknown) {
    return typeof value === 'string' && value ? value : 'Not provided';
}

export default function AccountScreen() {
    const { idTokenClaims, isLoading, isSignedIn } = useAuth();
    const router = useRouter();

    if (isLoading) {
        return (
            <ThemedView style={styles.centered}>
                <ThemedText type="small">Checking session...</ThemedText>
            </ThemedView>
        );
    }

    if (!isSignedIn) {
        return (
            <ThemedView style={styles.centered}>
                <ThemedView type="backgroundElement" style={styles.panel}>
                    <ThemedText type="subtitle">Account</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                        Sign in to see your profile.
                    </ThemedText>
                    <Pressable
                        accessibilityRole="button"
                        onPress={() => {
                            console.log('[auth] account sign-in pressed');
                            router.push('/auth/sign-in' as Href);
                        }}
                        style={({ pressed }) => pressed && styles.pressed}>
                        <ThemedText type="linkPrimary">Sign in</ThemedText>
                    </Pressable>
                </ThemedView>
            </ThemedView>
        );
    }

    return (
        <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}>
            <SafeAreaView style={styles.safeArea}>
                <ThemedView style={styles.header}>
                    <ThemedText type="subtitle">Account</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                        Your Cognito profile for this device session.
                    </ThemedText>
                </ThemedView>

                <ThemedView type="backgroundElement" style={styles.panel}>
                    <ThemedView type="backgroundElement" style={styles.claimRow}>
                        <ThemedText type="smallBold">Email</ThemedText>
                        <ThemedText type="small" themeColor="textSecondary">
                            {claimText(idTokenClaims?.email)}
                        </ThemedText>
                    </ThemedView>
                    <ThemedView type="backgroundElement" style={styles.claimRow}>
                        <ThemedText type="smallBold">Name</ThemedText>
                        <ThemedText type="small" themeColor="textSecondary">
                            {claimText(idTokenClaims?.name)}
                        </ThemedText>
                    </ThemedView>
                    <ThemedView type="backgroundElement" style={styles.claimRow}>
                        <ThemedText type="smallBold">Subject</ThemedText>
                        <ThemedText type="small" themeColor="textSecondary">
                            {claimText(idTokenClaims?.sub)}
                        </ThemedText>
                    </ThemedView>
                </ThemedView>

                <Link href={'/auth/sign-out' as Href} asChild>
                    <Pressable
                        accessibilityRole="button"
                        style={({ pressed }) => [
                            styles.signOutButton,
                            pressed && styles.pressed
                        ]}>
                        <ThemedText type="smallBold" style={styles.signOutText}>
                            Sign out
                        </ThemedText>
                    </Pressable>
                </Link>
            </SafeAreaView>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    scrollView: {
        flex: 1
    },
    scrollContent: {
        flexGrow: 1,
        flexDirection: 'row',
        justifyContent: 'center'
    },
    safeArea: {
        flex: 1,
        maxWidth: MaxContentWidth,
        gap: Spacing.four,
        paddingHorizontal: Spacing.four,
        paddingTop: Spacing.five,
        paddingBottom: BottomTabInset + Spacing.four
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        padding: Spacing.four
    },
    header: {
        gap: Spacing.one
    },
    panel: {
        gap: Spacing.three,
        padding: Spacing.four,
        borderRadius: Spacing.two
    },
    claimRow: {
        gap: Spacing.one
    },
    signOutButton: {
        alignItems: 'center',
        borderColor: '#B42318',
        borderRadius: Spacing.two,
        borderWidth: 1,
        minHeight: 48,
        justifyContent: 'center',
        paddingHorizontal: Spacing.four
    },
    signOutText: {
        color: '#B42318'
    },
    pressed: {
        opacity: 0.7
    }
});
