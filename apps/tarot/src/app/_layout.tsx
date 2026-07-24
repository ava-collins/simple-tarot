import { QuickNav } from '@simpletarot/ui';
import {
    DarkTheme,
    DefaultTheme,
    Stack,
    ThemeProvider,
    usePathname,
    useRouter,
    type Href
} from 'expo-router';
import { useColorScheme } from 'react-native';

import { AuthProvider } from '@/auth/auth-context';

export default function TabLayout() {
    const colorScheme = useColorScheme();
    const pathname = usePathname();
    const router = useRouter();
    const showQuickNav = !pathname.startsWith('/auth');

    return (
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <AuthProvider>
                <Stack initialRouteName="account" screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="account" />
                    <Stack.Screen name="auth/sign-in" />
                    <Stack.Screen name="auth/sign-up" />
                    <Stack.Screen name="auth/callback" />
                    <Stack.Screen name="auth/logout" />
                    <Stack.Screen name="auth/sign-out" />
                    <Stack.Screen name="readings/index" />
                    <Stack.Screen name="readings/new" />
                    <Stack.Screen name="readings/single-card/index" />
                    <Stack.Screen name="readings/single-card/result" />
                    <Stack.Screen name="index" />
                </Stack>
                {showQuickNav && (
                    <QuickNav
                        onNewReadingPress={() => router.push('/readings/single-card' as Href)}
                        onProfilePress={() => router.push('/account' as Href)}
                        onReadingHistoryPress={() => router.push('/readings' as Href)}
                    />
                )}
            </AuthProvider>
        </ThemeProvider>
    );
}
