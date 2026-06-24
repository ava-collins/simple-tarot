import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

import { type CognitoConfig } from './cognito-config';

WebBrowser.maybeCompleteAuthSession();

export const cognitoScopes = ['openid', 'email', 'profile'];

export function getCognitoRedirectUri(path = 'auth/callback') {
  return AuthSession.makeRedirectUri({
    scheme: 'tarot',
    path
  });
}

export function buildCognitoDiscovery(config: CognitoConfig) {
  const hostedUiOrigin = `https://${config.domain}`;

  return {
    authorizationEndpoint: `${hostedUiOrigin}/oauth2/authorize`,
    tokenEndpoint: `${hostedUiOrigin}/oauth2/token`,
    revocationEndpoint: `${hostedUiOrigin}/oauth2/revoke`
  };
}

export function buildCognitoAuthRequestConfig(config: CognitoConfig) {
  return {
    clientId: config.clientId,
    redirectUri: getCognitoRedirectUri(config.redirectPath),
    responseType: AuthSession.ResponseType.Code,
    scopes: cognitoScopes,
    usePKCE: true
  };
}

export function getCognitoLogoutRedirectUri(config: CognitoConfig) {
  return getCognitoRedirectUri(config.logoutPath);
}

export function getCognitoLogoutUrl(config: CognitoConfig, redirectUri = getCognitoLogoutRedirectUri(config)) {
  const url = new URL(`https://${config.domain}/logout`);

  url.searchParams.set('client_id', config.clientId);
  url.searchParams.set('logout_uri', redirectUri);

  return url.toString();
}
