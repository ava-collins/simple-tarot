import { Request, RequestHandler } from 'express';

export type AuthenticatedUser = {
    claims: Record<string, unknown>;
    tokenUse?: string;
    userId: string;
};

export type CognitoJwtVerifier = {
    verifyAuthorizationHeader(header: string | undefined): Promise<AuthenticatedUser>;
};

export class UnauthorizedError extends Error {
    readonly code = 'UNAUTHORIZED';
    readonly status = 401;

    constructor(message = 'Authentication is required.') {
        super(message);
        this.name = 'UnauthorizedError';
    }
}

type ApiGatewayJwtAuthorizer = {
    claims?: Record<string, unknown>;
};

type ApiGatewayRequest = Request & {
    apiGateway?: {
        event?: {
            requestContext?: {
                authorizer?: {
                    jwt?: ApiGatewayJwtAuthorizer;
                };
            };
        };
    };
};

export const authenticatedUserFromClaims = (
    claims: Record<string, unknown> | undefined
): AuthenticatedUser | undefined => {
    if (typeof claims?.sub !== 'string' || claims.sub.length === 0) {
        return undefined;
    }

    return {
        claims,
        tokenUse: typeof claims.token_use === 'string' ? claims.token_use : undefined,
        userId: claims.sub
    };
};

export const authenticatedUserFromGatewayRequest = (
    request: Pick<ApiGatewayRequest, 'apiGateway'>
): AuthenticatedUser | undefined =>
    authenticatedUserFromClaims(
        request.apiGateway?.event?.requestContext?.authorizer?.jwt?.claims
    );

export const apiGatewayAuthContextMiddleware: RequestHandler = (req, res, next) => {
    const user = authenticatedUserFromGatewayRequest(req as ApiGatewayRequest);

    if (user) {
        res.locals.authenticatedUser = user;
    }

    next();
};

export const requireAuthentication =
    (tokenVerifier: CognitoJwtVerifier): RequestHandler =>
    async (req, res, next) => {
        if (res.locals.authenticatedUser) {
            next();

            return;
        }

        try {
            const user = await tokenVerifier.verifyAuthorizationHeader(
                req.header('authorization')
            );

            if (!user) {
                throw new UnauthorizedError();
            }

            res.locals.authenticatedUser = user;
            next();
        } catch (error) {
            next(error instanceof UnauthorizedError ? error : new UnauthorizedError());
        }
    };
