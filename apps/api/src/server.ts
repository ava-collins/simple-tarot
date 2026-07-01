import express from 'express';
import { errorHandler } from './errors';
import {
    errorLoggingMiddleware,
    requestIdMiddleware,
    requestLoggingMiddleware
} from './logger';
import { healthRouter } from './routes/health';
import { readingsRouter } from './routes/readings';

export function createApiServer() {
    const app = express();

    app.use(express.json());
    app.use(requestIdMiddleware);
    app.use(requestLoggingMiddleware);
    app.use(healthRouter);
    app.use(readingsRouter);
    app.use(errorLoggingMiddleware);
    app.use(errorHandler);

    return app;
}
