import { describe, expect, it, vi } from 'vitest';
import {
    createCognitoJwtVerifier,
    extractBearerToken,
    jwksUriForIssuer
} from './cognito-jwt';

const config = {
    clientId: 'public-client-id',
    issuer: 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_example',
    mode: 'cognito' as const
};

describe('extractBearerToken', () => {
    it('extracts bearer tokens case-insensitively', () => {
        expect(extractBearerToken('Bearer access-token')).toBe('access-token');
        expect(extractBearerToken('bearer another-token')).toBe('another-token');
    });

    it('rejects missing or malformed authorization headers', () => {
        expect(extractBearerToken(undefined)).toBeUndefined();
        expect(extractBearerToken('Basic abc')).toBeUndefined();
        expect(extractBearerToken('Bearer')).toBeUndefined();
    });
});

describe('jwksUriForIssuer', () => {
    it('builds the Cognito JWKS URL from the issuer', () => {
        expect(jwksUriForIssuer(`${config.issuer}/`).toString()).toBe(
            `${config.issuer}/.well-known/jwks.json`
        );
    });
});

describe('createCognitoJwtVerifier', () => {
    it('returns an authenticated user from a valid Cognito access token', async () => {
        const jwtVerify = vi.fn().mockResolvedValue({
            payload: {
                client_id: 'public-client-id',
                email: 'reader@example.com',
                sub: 'user-sub-123',
                token_use: 'access'
            }
        });
        const verifier = createCognitoJwtVerifier(config, {
            createRemoteJWKSet: vi.fn().mockReturnValue('jwks'),
            jwtVerify
        });

        await expect(verifier.verifyAuthorizationHeader('Bearer signed-token')).resolves.toEqual(
            {
                claims: {
                    client_id: 'public-client-id',
                    email: 'reader@example.com',
                    sub: 'user-sub-123',
                    token_use: 'access'
                },
                tokenUse: 'access',
                userId: 'user-sub-123'
            }
        );
        expect(jwtVerify).toHaveBeenCalledWith('signed-token', 'jwks', {
            issuer: config.issuer
        });
    });

    it('rejects missing authorization headers', async () => {
        const verifier = createCognitoJwtVerifier(config, {
            createRemoteJWKSet: vi.fn(),
            jwtVerify: vi.fn()
        });

        await expect(verifier.verifyAuthorizationHeader(undefined)).rejects.toMatchObject({
            code: 'UNAUTHORIZED',
            status: 401
        });
    });

    it('rejects tokens for another Cognito app client', async () => {
        const verifier = createCognitoJwtVerifier(config, {
            createRemoteJWKSet: vi.fn().mockReturnValue('jwks'),
            jwtVerify: vi.fn().mockResolvedValue({
                payload: {
                    client_id: 'another-client-id',
                    sub: 'user-sub-123',
                    token_use: 'access'
                }
            })
        });

        await expect(
            verifier.verifyAuthorizationHeader('Bearer signed-token')
        ).rejects.toMatchObject({
            code: 'UNAUTHORIZED',
            status: 401
        });
    });

    it('rejects ID tokens when access tokens are required', async () => {
        const verifier = createCognitoJwtVerifier(config, {
            createRemoteJWKSet: vi.fn().mockReturnValue('jwks'),
            jwtVerify: vi.fn().mockResolvedValue({
                payload: {
                    aud: 'public-client-id',
                    sub: 'user-sub-123',
                    token_use: 'id'
                }
            })
        });

        await expect(
            verifier.verifyAuthorizationHeader('Bearer signed-token')
        ).rejects.toMatchObject({
            code: 'UNAUTHORIZED',
            status: 401
        });
    });
});
