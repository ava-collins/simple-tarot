import { describe, expect, it, vi } from 'vitest';
import {
    authenticatedUserFromClaims,
    authenticatedUserFromGatewayRequest,
    requireAuthentication
} from './auth-context';

describe('authenticatedUserFromClaims', () => {
    it('derives the API user id from the Cognito subject claim', () => {
        expect(
            authenticatedUserFromClaims({
                client_id: 'public-client-id',
                sub: 'user-sub-123',
                token_use: 'access'
            })
        ).toEqual({
            claims: {
                client_id: 'public-client-id',
                sub: 'user-sub-123',
                token_use: 'access'
            },
            tokenUse: 'access',
            userId: 'user-sub-123'
        });
    });

    it('ignores claim sets without a stable subject', () => {
        expect(authenticatedUserFromClaims({ email: 'reader@example.com' })).toBeUndefined();
    });
});

describe('authenticatedUserFromGatewayRequest', () => {
    it('reads Cognito JWT claims attached by API Gateway Lambda events', () => {
        expect(
            authenticatedUserFromGatewayRequest({
                apiGateway: {
                    event: {
                        requestContext: {
                            authorizer: {
                                jwt: {
                                    claims: {
                                        client_id: 'public-client-id',
                                        sub: 'user-sub-123',
                                        token_use: 'access'
                                    }
                                }
                            }
                        }
                    }
                }
            })
        ).toMatchObject({
            userId: 'user-sub-123'
        });
    });

    it('reads Cognito JWT claims from the serverless-express eventContext middleware shape', () => {
        expect(
            authenticatedUserFromGatewayRequest({
                apiGateway: {
                    context: {
                        awsRequestId: 'lambda-request-123'
                    },
                    event: {
                        requestContext: {
                            authorizer: {
                                jwt: {
                                    claims: {
                                        client_id: 'public-client-id',
                                        sub: 'user-sub-123',
                                        token_use: 'access'
                                    }
                                }
                            }
                        }
                    }
                }
            })
        ).toMatchObject({
            userId: 'user-sub-123'
        });
    });
});

describe('requireAuthentication', () => {
    it('rejects protected routes when no authenticated user is available', async () => {
        const next = vi.fn();
        const middleware = requireAuthentication({
            verifyAuthorizationHeader: vi.fn()
        });

        await middleware(
            {
                header: vi.fn().mockReturnValue(undefined)
            } as never,
            {
                locals: {}
            } as never,
            next
        );

        expect(next).toHaveBeenCalledWith(
            expect.objectContaining({
                code: 'UNAUTHORIZED',
                status: 401
            })
        );
    });

    it('allows protected routes when a bearer token verifies successfully', async () => {
        const next = vi.fn();
        const middleware = requireAuthentication({
            verifyAuthorizationHeader: vi.fn().mockResolvedValue({
                claims: {
                    client_id: 'public-client-id',
                    sub: 'user-sub-123',
                    token_use: 'access'
                },
                tokenUse: 'access',
                userId: 'user-sub-123'
            })
        });
        const res = {
            locals: {}
        };

        await middleware(
            {
                header: vi.fn().mockReturnValue('Bearer signed-token')
            } as never,
            res as never,
            next
        );

        expect(res.locals).toEqual({
            authenticatedUser: {
                claims: {
                    client_id: 'public-client-id',
                    sub: 'user-sub-123',
                    token_use: 'access'
                },
                tokenUse: 'access',
                userId: 'user-sub-123'
            }
        });
        expect(next).toHaveBeenCalledWith();
    });
});
