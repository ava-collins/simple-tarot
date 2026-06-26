import express from 'express';
import { errorHandler } from './errors';
import { healthRouter } from './routes/health';
import { readingsRouter } from './routes/readings';

export function createApiServer() {
    const app = express();

    app.use(express.json());
    app.use(healthRouter);
    app.use(readingsRouter);
    app.use(errorHandler);

    return app;
}
