import { describe, expect, it, vi } from 'vitest';

vi.mock('expo-auth-session', () => ({
  makeRedirectUri: vi.fn(({ path }: { path: string }) => `tarot://${path}`),
  ResponseType: {
    Code: 'code'
  }
}));
vi.mock('expo-web-browser', () => ({
  maybeCompleteAuthSession: vi.fn()
}));

import * as AuthSession from 'expo-auth-session';

import {
  buildCognitoDiscovery,
  buildCognitoAuthRequestConfig,
  getCognitoLogoutRedirectUri,
  getCognitoLogoutUrl,
  getCognitoRedirectUri
} from './auth-session';

const config = {
  awsRegion: 'us-east-1',
  userPoolId: 'us-east-1_example',
  clientId: 'public-client-id',
  domain: 'example.auth.us-east-1.amazoncognito.com',
  issuer: 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_example',
  redirectPath: 'auth/callback',
  logoutPath: 'auth/sign-out'
};

describe('auth-session helpers', () => {
  it('builds Cognito hosted UI endpoints from the configured domain', () => {
    expect(buildCognitoDiscovery(config)).toEqual({
      authorizationEndpoint: 'https://example.auth.us-east-1.amazoncognito.com/oauth2/authorize',
      tokenEndpoint: 'https://example.auth.us-east-1.amazoncognito.com/oauth2/token',
      revocationEndpoint: 'https://example.auth.us-east-1.amazoncognito.com/oauth2/revoke'
    });
  });

  it('uses the configured tarot callback redirect URI for PKCE requests', () => {
    expect(getCognitoRedirectUri()).toBe('tarot://auth/callback');
    expect(AuthSession.makeRedirectUri).toHaveBeenCalledWith({
      scheme: 'tarot',
      path: 'auth/callback'
    });
    expect(buildCognitoAuthRequestConfig(config)).toMatchObject({
      clientId: 'public-client-id',
      redirectUri: 'tarot://auth/callback',
      responseType: 'code',
      scopes: ['openid', 'email', 'profile'],
      usePKCE: true
    });
  });

  it('uses Cognito logout_uri for logout with the configured logout path', () => {
    const logoutUrl = new URL(getCognitoLogoutUrl(config));

    expect(getCognitoLogoutRedirectUri(config)).toBe('tarot://auth/sign-out');
    expect(logoutUrl.origin).toBe('https://example.auth.us-east-1.amazoncognito.com');
    expect(logoutUrl.pathname).toBe('/logout');
    expect(logoutUrl.searchParams.get('client_id')).toBe('public-client-id');
    expect(logoutUrl.searchParams.get('logout_uri')).toBe('tarot://auth/sign-out');
    expect(logoutUrl.searchParams.has('redirect_uri')).toBe(false);
  });
});
