import type { CognitoConfig } from './cognito-config';
import type { AuthTokens } from './token-storage';

type CognitoAuthenticationResult = {
  AccessToken?: string;
  ExpiresIn?: number;
  IdToken?: string;
  RefreshToken?: string;
  TokenType?: string;
};

type CognitoInitiateAuthResponse = {
  AuthenticationResult?: CognitoAuthenticationResult;
  message?: string;
};

type CognitoSignUpResponse = {
  UserConfirmed?: boolean;
  UserSub?: string;
  message?: string;
};

export type CognitoSignUpResult = {
  userConfirmed: boolean;
  userSub?: string;
};

const cognitoInitiateAuthTarget = 'AWSCognitoIdentityProviderService.InitiateAuth';
const cognitoSignUpTarget = 'AWSCognitoIdentityProviderService.SignUp';
const cognitoConfirmSignUpTarget = 'AWSCognitoIdentityProviderService.ConfirmSignUp';

function getCognitoEndpoint(config: CognitoConfig) {
  return `https://cognito-idp.${config.awsRegion}.amazonaws.com/`;
}

async function readCognitoResponse(response: Response): Promise<CognitoInitiateAuthResponse> {
  const payload: unknown = await response.json();

  return payload && typeof payload === 'object' ? payload as CognitoInitiateAuthResponse : {};
}

async function readCognitoSignUpResponse(response: Response): Promise<CognitoSignUpResponse> {
  const payload: unknown = await response.json();

  return payload && typeof payload === 'object' ? payload as CognitoSignUpResponse : {};
}

function getCognitoErrorMessage(
  config: CognitoConfig,
  payload: CognitoInitiateAuthResponse,
  fallbackErrorMessage: string
) {
  if (payload.message?.includes('USER_PASSWORD_AUTH flow not enabled')) {
    return [
      `Cognito app client ${config.clientId} does not allow USER_PASSWORD_AUTH.`,
      'Deploy the Cognito stack and sync EXPO_PUBLIC_COGNITO_CLIENT_ID from the stack output.'
    ].join(' ');
  }

  return payload.message ?? fallbackErrorMessage;
}

async function initiateAuth(
  config: CognitoConfig,
  body: Record<string, unknown>,
  fallbackErrorMessage: string
) {
  const response = await fetch(`https://cognito-idp.${config.awsRegion}.amazonaws.com/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-amz-json-1.1',
      'X-Amz-Target': cognitoInitiateAuthTarget
    },
    body: JSON.stringify(body)
  });
  const payload = await readCognitoResponse(response);

  if (!response.ok) {
    throw new Error(getCognitoErrorMessage(config, payload, fallbackErrorMessage));
  }

  const result = payload.AuthenticationResult;

  if (!result?.AccessToken) {
    throw new Error('Cognito did not return an access token.');
  }

  return result;
}

function toAuthTokens(result: CognitoAuthenticationResult, refreshToken?: string): AuthTokens {
  return {
    accessToken: result.AccessToken as string,
    idToken: result.IdToken,
    refreshToken: result.RefreshToken ?? refreshToken,
    issuedAt: Math.floor(Date.now() / 1000),
    expiresIn: result.ExpiresIn,
    tokenType: result.TokenType
  };
}

export async function signInWithCognitoPassword(
  config: CognitoConfig,
  emailAddress: string,
  password: string
): Promise<AuthTokens> {
  const result = await initiateAuth(
    config,
    {
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: config.clientId,
      AuthParameters: {
        USERNAME: emailAddress,
        PASSWORD: password
      }
    },
    'Unable to sign in.'
  );

  return toAuthTokens(result);
}

export async function refreshCognitoPasswordSession(
  config: CognitoConfig,
  refreshToken: string
): Promise<AuthTokens> {
  const result = await initiateAuth(
    config,
    {
      AuthFlow: 'REFRESH_TOKEN_AUTH',
      ClientId: config.clientId,
      AuthParameters: {
        REFRESH_TOKEN: refreshToken
      }
    },
    'Unable to refresh session.'
  );

  return toAuthTokens(result, refreshToken);
}

export async function signUpWithCognitoPassword(
  config: CognitoConfig,
  emailAddress: string,
  password: string
): Promise<CognitoSignUpResult> {
  const response = await fetch(getCognitoEndpoint(config), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-amz-json-1.1',
      'X-Amz-Target': cognitoSignUpTarget
    },
    body: JSON.stringify({
      ClientId: config.clientId,
      Username: emailAddress,
      Password: password,
      UserAttributes: [
        {
          Name: 'email',
          Value: emailAddress
        }
      ]
    })
  });
  const payload = await readCognitoSignUpResponse(response);

  if (!response.ok) {
    throw new Error(payload.message ?? 'Unable to create account.');
  }

  return {
    userConfirmed: payload.UserConfirmed ?? false,
    userSub: payload.UserSub
  };
}

export async function confirmCognitoSignUp(
  config: CognitoConfig,
  emailAddress: string,
  verificationCode: string
): Promise<void> {
  const response = await fetch(getCognitoEndpoint(config), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-amz-json-1.1',
      'X-Amz-Target': cognitoConfirmSignUpTarget
    },
    body: JSON.stringify({
      ClientId: config.clientId,
      Username: emailAddress,
      ConfirmationCode: verificationCode
    })
  });
  const payload = await readCognitoSignUpResponse(response);

  if (!response.ok) {
    throw new Error(payload.message ?? 'Unable to verify account.');
  }
}
