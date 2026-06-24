type CognitoEnvKey =
  | 'EXPO_PUBLIC_AWS_REGION'
  | 'EXPO_PUBLIC_COGNITO_USER_POOL_ID'
  | 'EXPO_PUBLIC_COGNITO_CLIENT_ID'
  | 'EXPO_PUBLIC_COGNITO_DOMAIN'
  | 'EXPO_PUBLIC_COGNITO_ISSUER'
  | 'EXPO_PUBLIC_COGNITO_REDIRECT_PATH'
  | 'EXPO_PUBLIC_COGNITO_LOGOUT_PATH';

export type CognitoConfig = {
  awsRegion: string;
  userPoolId: string;
  clientId: string;
  domain: string;
  issuer: string;
  redirectPath: string;
  logoutPath: string;
};

function readRequiredEnv(key: CognitoEnvKey) {
  const value = process.env[key]?.trim();

  if (!value) {
    throw new Error(`Missing required Expo public Cognito config: ${key}`);
  }

  return value;
}

export function getCognitoConfig(): CognitoConfig {
  return {
    awsRegion: readRequiredEnv('EXPO_PUBLIC_AWS_REGION'),
    userPoolId: readRequiredEnv('EXPO_PUBLIC_COGNITO_USER_POOL_ID'),
    clientId: readRequiredEnv('EXPO_PUBLIC_COGNITO_CLIENT_ID'),
    domain: readRequiredEnv('EXPO_PUBLIC_COGNITO_DOMAIN').replace(/^https?:\/\//, ''),
    issuer: readRequiredEnv('EXPO_PUBLIC_COGNITO_ISSUER'),
    redirectPath: readRequiredEnv('EXPO_PUBLIC_COGNITO_REDIRECT_PATH'),
    logoutPath: readRequiredEnv('EXPO_PUBLIC_COGNITO_LOGOUT_PATH')
  };
}
