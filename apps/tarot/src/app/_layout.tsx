import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { useColorScheme } from 'react-native';

import { AuthProvider } from '@/auth/auth-context';
import { AnimatedSplashOverlay } from '@/components/animated-icon';

export default function TabLayout() {
    const colorScheme = useColorScheme();

    return (
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <AuthProvider>
                <AnimatedSplashOverlay />
                <Stack initialRouteName="account" screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="account" />
                    <Stack.Screen name="auth/sign-in" />
                    <Stack.Screen name="auth/sign-up" />
                    <Stack.Screen name="auth/callback" />
                    <Stack.Screen name="auth/logout" />
                    <Stack.Screen name="auth/sign-out" />
                    <Stack.Screen name="index" />
                    <Stack.Screen name="explore" />
                </Stack>
            </AuthProvider>
        </ThemeProvider>
    );
}
