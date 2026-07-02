import express from 'express';
import {
    CognitoJwtVerifier,
    apiGatewayAuthContextMiddleware,
    requireAuthentication
} from './auth/auth-context';
import { createCognitoJwtVerifier } from './auth/cognito-jwt';
import { ApiConfig, getApiConfig } from './config';
import { errorHandler } from './errors';
import {
    errorLoggingMiddleware,
    requestIdMiddleware,
    requestLoggingMiddleware
} from './logger';
import { healthRouter } from './routes/health';
import { readingsRouter } from './routes/readings';

export type CreateApiServerOptions = {
    config?: ApiConfig;
    tokenVerifier?: CognitoJwtVerifier;
};

export function createApiServer(options: CreateApiServerOptions = {}) {
    const config = options.config ?? getApiConfig();
    const app = express();

    app.use(express.json());
    app.use(requestIdMiddleware);
    app.use(requestLoggingMiddleware);
    app.use(apiGatewayAuthContextMiddleware);
    app.use(healthRouter);

    if (config.auth.mode === 'cognito') {
        app.use(
            requireAuthentication(
                options.tokenVerifier ?? createCognitoJwtVerifier(config.auth)
            ),
            readingsRouter
        );
    } else {
        app.use(readingsRouter);
    }

    app.use(errorLoggingMiddleware);
    app.use(errorHandler);

    return app;
}
