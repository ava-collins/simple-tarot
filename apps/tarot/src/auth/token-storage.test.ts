import { beforeEach, describe, expect, it, vi } from 'vitest';

const secureStore = vi.hoisted(() => ({
  deleteItemAsync: vi.fn(),
  getItemAsync: vi.fn(),
  setItemAsync: vi.fn()
}));

vi.mock('expo-secure-store', () => secureStore);

import { clearStoredTokens, loadStoredTokens, storeTokens, type AuthTokens } from './token-storage';

const tokens: AuthTokens = {
  accessToken: 'access-token',
  idToken: 'id-token',
  refreshToken: 'refresh-token',
  issuedAt: 1000,
  expiresIn: 3600,
  tokenType: 'Bearer'
};

describe('token storage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('stores and loads serialized tokens from SecureStore', async () => {
    secureStore.getItemAsync.mockResolvedValueOnce(JSON.stringify(tokens));

    await storeTokens(tokens);

    expect(secureStore.setItemAsync).toHaveBeenCalledWith('simple-tarot.auth.tokens', JSON.stringify(tokens));
    await expect(loadStoredTokens()).resolves.toEqual(tokens);
    expect(secureStore.getItemAsync).toHaveBeenCalledWith('simple-tarot.auth.tokens');
  });

  it('clears invalid stored token payloads', async () => {
    secureStore.getItemAsync.mockResolvedValueOnce('{');

    await expect(loadStoredTokens()).resolves.toBeNull();
    expect(secureStore.deleteItemAsync).toHaveBeenCalledWith('simple-tarot.auth.tokens');
  });

  it('clears stored tokens', async () => {
    await clearStoredTokens();

    expect(secureStore.deleteItemAsync).toHaveBeenCalledWith('simple-tarot.auth.tokens');
  });
});
