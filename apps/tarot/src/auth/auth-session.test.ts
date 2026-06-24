import { describe, expect, it, vi } from 'vitest';

vi.mock('expo-auth-session', () => ({
  makeRedirectUri: vi.fn(() => 'tarot://auth/callback'),
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
});
