import * as WebBrowser from 'expo-web-browser';
import {
    createContext,
    useCallback,
    useEffect,
    useMemo,
    useState,
    type PropsWithChildren
} from 'react';

import { getCognitoLogoutRedirectUri, getCognitoLogoutUrl } from './auth-session';
import {
    confirmCognitoSignUp,
    type CognitoSignUpResult,
    refreshCognitoPasswordSession,
    signUpWithCognitoPassword,
    signInWithCognitoPassword
} from './cognito-password-auth';
import { getCognitoConfig } from './cognito-config';
import {
    clearStoredTokens,
    loadStoredTokens,
    storeTokens,
    type AuthTokens
} from './token-storage';

type IdTokenClaims = Record<string, unknown>;

export type AuthContextValue = {
    authRequestReady: boolean;
    getSignInDebugInfo: () => Promise<{
        authorizationUrl: string | null;
        redirectUri: string;
    }>;
    error: string | null;
    idTokenClaims: IdTokenClaims | null;
    isLoading: boolean;
    isSignedIn: boolean;
    refreshSession: () => Promise<AuthTokens | null>;
    restoreSession: () => Promise<void>;
    confirmSignUp: (emailAddress: string, verificationCode: string) => Promise<void>;
    signIn: (emailAddress: string, password: string) => Promise<void>;
    signUp: (emailAddress: string, password: string) => Promise<CognitoSignUpResult>;
    signOut: () => Promise<void>;
    tokens: AuthTokens | null;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

const cognitoConfig = getCognitoConfig();

function isTokenFresh(tokens: AuthTokens) {
    if (!tokens.expiresIn) {
        return true;
    }

    const refreshMarginSeconds = 60;
    const expiresAt = tokens.issuedAt + tokens.expiresIn;
    const now = Math.floor(Date.now() / 1000);

    return expiresAt - refreshMarginSeconds > now;
}

function decodeBase64Url(value: string) {
    const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const base64Chars =
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let decoded = '';
    let buffer = 0;
    let bits = 0;

    for (const character of padded.replace(/=+$/, '')) {
        const index = base64Chars.indexOf(character);

        if (index < 0) {
            throw new Error('Invalid Base64URL payload.');
        }

        buffer = (buffer << 6) | index;
        bits += 6;

        if (bits >= 8) {
            bits -= 8;
            decoded += String.fromCharCode((buffer >> bits) & 0xff);
        }
    }

    return decodeURIComponent(
        decoded
            .split('')
            .map(character => `%${character.charCodeAt(0).toString(16).padStart(2, '0')}`)
            .join('')
    );
}

function getIdTokenClaims(idToken?: string) {
    if (!idToken) {
        return null;
    }

    const [, payload] = idToken.split('.');

    if (!payload) {
        return null;
    }

    try {
        const parsedClaims: unknown = JSON.parse(decodeBase64Url(payload));

        return parsedClaims && typeof parsedClaims === 'object'
            ? (parsedClaims as IdTokenClaims)
            : null;
    } catch {
        return null;
    }
}

export function AuthProvider({ children }: PropsWithChildren) {
    const [tokens, setTokens] = useState<AuthTokens | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const persistTokens = useCallback(async (nextTokens: AuthTokens) => {
        await storeTokens(nextTokens);
        setTokens(nextTokens);
    }, []);

    const refreshSession = useCallback(async () => {
        if (!tokens?.refreshToken) {
            return null;
        }

        const nextTokens = await refreshCognitoPasswordSession(
            cognitoConfig,
            tokens.refreshToken
        );

        await persistTokens(nextTokens);

        return nextTokens;
    }, [persistTokens, tokens]);

    const restoreSession = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const storedTokens = await loadStoredTokens();

            if (!storedTokens) {
                setTokens(null);

                return;
            }

            setTokens(storedTokens);

            if (!isTokenFresh(storedTokens) && storedTokens.refreshToken) {
                await persistTokens(
                    await refreshCognitoPasswordSession(
                        cognitoConfig,
                        storedTokens.refreshToken
                    )
                );
            }
        } catch (authError) {
            await clearStoredTokens();
            setTokens(null);
            setError(
                authError instanceof Error
                    ? authError.message
                    : 'Unable to restore session.'
            );
        } finally {
            setIsLoading(false);
        }
    }, [persistTokens]);

    const signIn = useCallback(
        async (emailAddress: string, password: string) => {
            setIsLoading(true);
            setError(null);

            try {
                const nextTokens = await signInWithCognitoPassword(
                    cognitoConfig,
                    emailAddress,
                    password
                );

                await persistTokens(nextTokens);
            } catch (authError) {
                const message =
                    authError instanceof Error ? authError.message : 'Unable to sign in.';

                setError(message);
                throw new Error(message);
            } finally {
                setIsLoading(false);
            }
        },
        [persistTokens]
    );

    const signUp = useCallback(async (emailAddress: string, password: string) => {
        setIsLoading(true);
        setError(null);

        try {
            return await signUpWithCognitoPassword(cognitoConfig, emailAddress, password);
        } catch (authError) {
            const message =
                authError instanceof Error
                    ? authError.message
                    : 'Unable to create account.';

            setError(message);
            throw new Error(message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const confirmSignUp = useCallback(
        async (emailAddress: string, verificationCode: string) => {
            setIsLoading(true);
            setError(null);

            try {
                await confirmCognitoSignUp(cognitoConfig, emailAddress, verificationCode);
            } catch (authError) {
                const message =
                    authError instanceof Error
                        ? authError.message
                        : 'Unable to verify account.';

                setError(message);
                throw new Error(message);
            } finally {
                setIsLoading(false);
            }
        },
        []
    );

    const getSignInDebugInfo = useCallback(
        async () => ({
            authorizationUrl: null,
            redirectUri: `https://cognito-idp.${cognitoConfig.awsRegion}.amazonaws.com/`
        }),
        []
    );

    const signOut = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const logoutUrl = getCognitoLogoutUrl(cognitoConfig);
            const redirectUri = getCognitoLogoutRedirectUri(cognitoConfig);

            console.log('[auth] sign-out request debug', {
                logoutUrl,
                redirectUri
            });
            await clearStoredTokens();
            setTokens(null);
            await WebBrowser.openAuthSessionAsync(logoutUrl, redirectUri);
        } catch (authError) {
            console.log('[auth] sign-out failed', authError);
            setError(
                authError instanceof Error
                    ? authError.message
                    : 'Unable to complete sign out.'
            );
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        void restoreSession();
    }, [restoreSession]);

    const value = useMemo<AuthContextValue>(
        () => ({
            authRequestReady: true,
            confirmSignUp,
            getSignInDebugInfo,
            error,
            idTokenClaims: getIdTokenClaims(tokens?.idToken),
            isLoading,
            isSignedIn: Boolean(tokens?.accessToken),
            refreshSession,
            restoreSession,
            signIn,
            signUp,
            signOut,
            tokens
        }),
        [
            error,
            confirmSignUp,
            getSignInDebugInfo,
            isLoading,
            refreshSession,
            restoreSession,
            signIn,
            signUp,
            signOut,
            tokens
        ]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
