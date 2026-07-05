import { createRemoteJWKSet, jwtVerify, JWTPayload } from 'jose';
import { CognitoAuthConfig } from '../config';
import {
    AuthenticatedUser,
    CognitoJwtVerifier,
    UnauthorizedError,
    authenticatedUserFromClaims
} from './auth-context';

type JwtVerifyResult = {
    payload: JWTPayload;
};

type JwtVerifyFn = (
    token: string,
    key: unknown,
    options: {
        issuer: string;
    }
) => Promise<JwtVerifyResult>;

type CognitoJwtVerifierDependencies = {
    createRemoteJWKSet?: typeof createRemoteJWKSet;
    jwtVerify?: JwtVerifyFn;
};

export const extractBearerToken = (header: string | undefined): string | undefined => {
    const match = header?.match(/^Bearer\s+(.+)$/i);

    return match?.[1]?.trim();
};

export const jwksUriForIssuer = (issuer: string): URL =>
    new URL(`${issuer.replace(/\/+$/, '')}/.well-known/jwks.json`);

const isTokenForClient = (payload: JWTPayload, clientId: string): boolean =>
    payload.client_id === clientId;

const validateAccessTokenClaims = (
    payload: JWTPayload,
    clientId: string
): AuthenticatedUser => {
    if (payload.token_use !== 'access' || !isTokenForClient(payload, clientId)) {
        throw new UnauthorizedError();
    }

    const user = authenticatedUserFromClaims(payload);

    if (!user) {
        throw new UnauthorizedError();
    }

    return user;
};

export const createCognitoJwtVerifier = (
    config: CognitoAuthConfig,
    dependencies: CognitoJwtVerifierDependencies = {}
): CognitoJwtVerifier => {
    const createJwks = dependencies.createRemoteJWKSet ?? createRemoteJWKSet;
    const verifyJwt = dependencies.jwtVerify ?? jwtVerify;
    const jwks = createJwks(jwksUriForIssuer(config.issuer));

    return {
        async verifyAuthorizationHeader(header) {
            const token = extractBearerToken(header);

            if (!token) {
                throw new UnauthorizedError();
            }

            try {
                const { payload } = await verifyJwt(token, jwks, {
                    issuer: config.issuer
                });

                return validateAccessTokenClaims(payload, config.clientId);
            } catch (error) {
                if (error instanceof UnauthorizedError) {
                    throw error;
                }

                throw new UnauthorizedError();
            }
        }
    };
};
