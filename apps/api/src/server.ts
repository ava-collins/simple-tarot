import express from 'express';
import { healthRouter } from './routes/health';
import { readingsRouter } from './routes/readings';

export function createApiServer() {
    const app = express();

    app.use(express.json());
    app.use(healthRouter);
    app.use(readingsRouter);

    return app;
}
