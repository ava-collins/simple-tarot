import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren
} from 'react';

import {
  buildCognitoAuthRequestConfig,
  buildCognitoDiscovery,
  cognitoScopes,
  getCognitoLogoutUrl,
  getCognitoRedirectUri
} from './auth-session';
import { getCognitoConfig } from './cognito-config';
import {
  clearStoredTokens,
  loadStoredTokens,
  storeTokens,
  type AuthTokens
} from './token-storage';

export type IdTokenClaims = Record<string, unknown>;

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
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  tokens: AuthTokens | null;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

const cognitoConfig = getCognitoConfig();
const cognitoDiscovery = buildCognitoDiscovery(cognitoConfig);
const cognitoAuthRequestConfig = buildCognitoAuthRequestConfig(cognitoConfig);

function toStoredTokens(response: AuthSession.TokenResponse, previousTokens?: AuthTokens | null): AuthTokens {
  return {
    accessToken: response.accessToken,
    idToken: response.idToken,
    refreshToken: response.refreshToken ?? previousTokens?.refreshToken,
    issuedAt: response.issuedAt,
    expiresIn: response.expiresIn,
    tokenType: response.tokenType
  };
}

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
  const base64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
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

    return parsedClaims && typeof parsedClaims === 'object' ? (parsedClaims as IdTokenClaims) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    cognitoAuthRequestConfig,
    cognitoDiscovery
  );
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

    const responseTokens = await AuthSession.refreshAsync(
      {
        clientId: cognitoConfig.clientId,
        refreshToken: tokens.refreshToken,
        scopes: cognitoScopes
      },
      cognitoDiscovery
    );
    const nextTokens = toStoredTokens(responseTokens, tokens);

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
        const refreshedTokens = await AuthSession.refreshAsync(
          {
            clientId: cognitoConfig.clientId,
            refreshToken: storedTokens.refreshToken,
            scopes: cognitoScopes
          },
          cognitoDiscovery
        );

        await persistTokens(toStoredTokens(refreshedTokens, storedTokens));
      }
    } catch (authError) {
      await clearStoredTokens();
      setTokens(null);
      setError(authError instanceof Error ? authError.message : 'Unable to restore session.');
    } finally {
      setIsLoading(false);
    }
  }, [persistTokens]);

  const signIn = useCallback(async () => {
    setError(null);

    if (!request) {
      throw new Error('Sign in is not ready yet.');
    }

    const result = await promptAsync();

    if (result.type === 'dismiss' || result.type === 'cancel') {
      return;
    }

    if (result.type === 'error') {
      throw new Error(result.error?.message ?? 'Sign in failed.');
    }
  }, [promptAsync, request]);

  const getSignInDebugInfo = useCallback(async () => {
    const redirectUri = getCognitoRedirectUri();
    const authorizationUrl = request ? await request.makeAuthUrlAsync(cognitoDiscovery) : null;

    return {
      authorizationUrl,
      redirectUri
    };
  }, [request]);

  const signOut = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      await clearStoredTokens();
      setTokens(null);
      await WebBrowser.openAuthSessionAsync(getCognitoLogoutUrl(cognitoConfig), getCognitoRedirectUri());
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void restoreSession();
  }, [restoreSession]);

  useEffect(() => {
    async function exchangeCode() {
      if (response?.type !== 'success') {
        if (response?.type === 'error') {
          setError(response.error?.message ?? 'Sign in failed.');
        }

        return;
      }

      if (!request?.codeVerifier) {
        setError('Missing PKCE verifier for Cognito token exchange.');

        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const tokenResponse = await AuthSession.exchangeCodeAsync(
          {
            clientId: cognitoConfig.clientId,
            code: response.params.code,
            redirectUri: getCognitoRedirectUri(),
            extraParams: {
              code_verifier: request.codeVerifier
            }
          },
          cognitoDiscovery
        );

        await persistTokens(toStoredTokens(tokenResponse));
      } catch (authError) {
        setError(authError instanceof Error ? authError.message : 'Unable to complete sign in.');
      } finally {
        setIsLoading(false);
      }
    }

    void exchangeCode();
  }, [persistTokens, request?.codeVerifier, response]);

  const value = useMemo<AuthContextValue>(
    () => ({
      authRequestReady: Boolean(request),
      getSignInDebugInfo,
      error,
      idTokenClaims: getIdTokenClaims(tokens?.idToken),
      isLoading,
      isSignedIn: Boolean(tokens?.accessToken),
      refreshSession,
      restoreSession,
      signIn,
      signOut,
      tokens
    }),
    [
      error,
      getSignInDebugInfo,
      isLoading,
      refreshSession,
      request,
      restoreSession,
      signIn,
      signOut,
      tokens
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
