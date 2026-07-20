import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { useColorScheme } from 'react-native';

import { AuthProvider } from '@/auth/auth-context';

export default function TabLayout() {
    const colorScheme = useColorScheme();

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
            </AuthProvider>
        </ThemeProvider>
    );
}
