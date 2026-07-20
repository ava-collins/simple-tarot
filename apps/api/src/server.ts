import express from 'express';
import { RequestHandler } from 'express';
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
import { avatarsRouter } from './routes/avatars';
import { healthRouter } from './routes/health';
import { createReadingRuntime, type ReadingRuntime } from './readings/runtime';
import { createReadingEvaluationsRouter } from './routes/reading-evaluations';
import { createReadingsRouter } from './routes/readings';

const { eventContext } = require('@codegenie/serverless-express/src/middleware') as {
    eventContext: () => RequestHandler;
};

export type CreateApiServerOptions = {
    config?: ApiConfig;
    readingRuntime?: ReadingRuntime;
    tokenVerifier?: CognitoJwtVerifier;
};

export function createApiServer(options: CreateApiServerOptions = {}) {
    const config = options.config ?? getApiConfig();
    const readingRuntime =
        options.readingRuntime ?? createReadingRuntime(config);
    const readingsRouter = createReadingsRouter(readingRuntime);
    const readingEvaluationsRouter =
        config.evaluation.mode === 'enabled'
            ? createReadingEvaluationsRouter({
                  ...(readingRuntime.apiLogSink === undefined
                      ? {}
                      : { apiLogSink: readingRuntime.apiLogSink }),
                  executor: readingRuntime.executor
              })
            : undefined;
    const app = express();

    app.use(express.json());
    app.use(requestIdMiddleware);
    app.use(requestLoggingMiddleware);
    app.use(eventContext());
    app.use(apiGatewayAuthContextMiddleware);
    app.use(healthRouter);
    app.use(avatarsRouter);

    if (config.auth.mode === 'cognito') {
        const requireCognitoAuthentication = requireAuthentication(
            options.tokenVerifier ?? createCognitoJwtVerifier(config.auth)
        );

        app.use(requireCognitoAuthentication, readingsRouter);
        if (readingEvaluationsRouter) {
            app.use(requireCognitoAuthentication, readingEvaluationsRouter);
        }
    } else {
        app.use(readingsRouter);
    }

    app.use(errorLoggingMiddleware);
    app.use(errorHandler);

    return app;
}
