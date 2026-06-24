import * as SecureStore from 'expo-secure-store';

const tokenStorageKey = 'simple-tarot.auth.tokens';

export type AuthTokens = {
  accessToken: string;
  idToken?: string;
  refreshToken?: string;
  issuedAt: number;
  expiresIn?: number;
  tokenType?: string;
};

function isStoredTokens(value: unknown): value is AuthTokens {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const tokens = value as Partial<AuthTokens>;

  return typeof tokens.accessToken === 'string' && typeof tokens.issuedAt === 'number';
}

export async function storeTokens(tokens: AuthTokens) {
  await SecureStore.setItemAsync(tokenStorageKey, JSON.stringify(tokens));
}

export async function loadStoredTokens() {
  const storedValue = await SecureStore.getItemAsync(tokenStorageKey);

  if (!storedValue) {
    return null;
  }

  try {
    const parsedValue: unknown = JSON.parse(storedValue);

    if (isStoredTokens(parsedValue)) {
      return parsedValue;
    }
  } catch {
    // A corrupt payload should not keep the app in a broken auth state.
  }

  await clearStoredTokens();

  return null;
}

export async function clearStoredTokens() {
  await SecureStore.deleteItemAsync(tokenStorageKey);
}
