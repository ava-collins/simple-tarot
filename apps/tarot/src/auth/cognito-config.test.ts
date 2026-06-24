import { afterEach, describe, expect, it } from 'vitest';

import { getCognitoConfig } from './cognito-config';

const requiredEnv = {
  EXPO_PUBLIC_AWS_REGION: 'us-east-1',
  EXPO_PUBLIC_COGNITO_USER_POOL_ID: 'us-east-1_example',
  EXPO_PUBLIC_COGNITO_CLIENT_ID: 'public-client-id',
  EXPO_PUBLIC_COGNITO_DOMAIN: 'example.auth.us-east-1.amazoncognito.com',
  EXPO_PUBLIC_COGNITO_ISSUER: 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_example',
  EXPO_PUBLIC_COGNITO_REDIRECT_PATH: 'auth/callback',
  EXPO_PUBLIC_COGNITO_LOGOUT_PATH: 'auth/sign-out'
} as const;

describe('getCognitoConfig', () => {
  const originalEnv = process.env;

  afterEach(() => {
    process.env = originalEnv;
  });

  it('returns trimmed Expo public Cognito values', () => {
    process.env = { ...originalEnv, ...requiredEnv, EXPO_PUBLIC_AWS_REGION: ' us-east-1 ' };

    expect(getCognitoConfig()).toEqual({
      awsRegion: 'us-east-1',
      userPoolId: 'us-east-1_example',
      clientId: 'public-client-id',
      domain: 'example.auth.us-east-1.amazoncognito.com',
      issuer: 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_example',
      redirectPath: 'auth/callback',
      logoutPath: 'auth/sign-out'
    });
  });

  it('throws a helpful error when a required Expo public value is missing', () => {
    process.env = { ...originalEnv, ...requiredEnv, EXPO_PUBLIC_COGNITO_CLIENT_ID: '' };

    expect(() => getCognitoConfig()).toThrow(
      'Missing required Expo public Cognito config: EXPO_PUBLIC_COGNITO_CLIENT_ID'
    );
  });
});
