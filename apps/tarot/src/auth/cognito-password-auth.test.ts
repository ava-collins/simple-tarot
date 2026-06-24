import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  refreshCognitoPasswordSession,
  signInWithCognitoPassword
} from './cognito-password-auth';

const config = {
  awsRegion: 'us-east-1',
  userPoolId: 'us-east-1_example',
  clientId: 'public-client-id',
  domain: 'example.auth.us-east-1.amazoncognito.com',
  issuer: 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_example',
  redirectPath: 'auth/callback',
  logoutPath: 'auth/sign-out'
};

describe('signInWithCognitoPassword', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('initiates Cognito USER_PASSWORD_AUTH and maps tokens for storage', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        AuthenticationResult: {
          AccessToken: 'access-token',
          ExpiresIn: 3600,
          IdToken: 'id-token',
          RefreshToken: 'refresh-token',
          TokenType: 'Bearer'
        }
      })
    });
    vi.stubGlobal('fetch', fetchMock);

    const tokens = await signInWithCognitoPassword(config, 'reader@example.com', 'secret-pass');

    expect(fetchMock).toHaveBeenCalledWith(
      'https://cognito-idp.us-east-1.amazonaws.com/',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-amz-json-1.1',
          'X-Amz-Target': 'AWSCognitoIdentityProviderService.InitiateAuth'
        },
        body: JSON.stringify({
          AuthFlow: 'USER_PASSWORD_AUTH',
          ClientId: 'public-client-id',
          AuthParameters: {
            USERNAME: 'reader@example.com',
            PASSWORD: 'secret-pass'
          }
        })
      }
    );
    expect(tokens).toMatchObject({
      accessToken: 'access-token',
      idToken: 'id-token',
      refreshToken: 'refresh-token',
      expiresIn: 3600,
      tokenType: 'Bearer'
    });
    expect(tokens.issuedAt).toBeGreaterThan(0);
  });

  it('throws the Cognito message when authentication fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      json: vi.fn().mockResolvedValue({
        __type: 'NotAuthorizedException',
        message: 'Incorrect username or password.'
      })
    }));

    await expect(
      signInWithCognitoPassword(config, 'reader@example.com', 'wrong-pass')
    ).rejects.toThrow('Incorrect username or password.');
  });

  it('explains when the deployed app client has not enabled password auth', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      json: vi.fn().mockResolvedValue({
        __type: 'InvalidParameterException',
        message: 'USER_PASSWORD_AUTH flow not enabled for this client'
      })
    }));

    await expect(
      signInWithCognitoPassword(config, 'reader@example.com', 'secret-pass')
    ).rejects.toThrow(
      'Cognito app client public-client-id does not allow USER_PASSWORD_AUTH. Deploy the Cognito stack and sync EXPO_PUBLIC_COGNITO_CLIENT_ID from the stack output.'
    );
  });

  it('refreshes a Cognito password-auth session with REFRESH_TOKEN_AUTH', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        AuthenticationResult: {
          AccessToken: 'new-access-token',
          ExpiresIn: 3600,
          IdToken: 'new-id-token',
          TokenType: 'Bearer'
        }
      })
    });
    vi.stubGlobal('fetch', fetchMock);

    const tokens = await refreshCognitoPasswordSession(config, 'existing-refresh-token');

    expect(fetchMock).toHaveBeenCalledWith(
      'https://cognito-idp.us-east-1.amazonaws.com/',
      expect.objectContaining({
        body: JSON.stringify({
          AuthFlow: 'REFRESH_TOKEN_AUTH',
          ClientId: 'public-client-id',
          AuthParameters: {
            REFRESH_TOKEN: 'existing-refresh-token'
          }
        })
      })
    );
    expect(tokens).toMatchObject({
      accessToken: 'new-access-token',
      idToken: 'new-id-token',
      refreshToken: 'existing-refresh-token',
      expiresIn: 3600,
      tokenType: 'Bearer'
    });
  });
});
