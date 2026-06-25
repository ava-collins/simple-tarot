import cors from 'cors';
import dotenv from 'dotenv';
import express, { NextFunction, Request, Response } from 'express';
import http from 'http';
import https from 'https';
import { readFileSync } from 'fs';
import { BedrockService } from './services/bedrock.js';
import { createReadingRouter } from './routes/reading.js';

dotenv.config();

const REQUIRED_ENV_VARS = [
    'AWS_REGION',
    'BEDROCK_KB_ID',
    'BEDROCK_MODEL_ID_HAIKU',
    'BEDROCK_MODEL_ID_SONNET',
];

function validateEnv() {
    const missing = REQUIRED_ENV_VARS.filter(k => !process.env[k]);
    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
}

const configurations = {
    production: {
        ssl: true,
        port: process.env.PROD_PORT || 443,
    },
    development: {
        ssl: false,
        port: process.env.DEV_PORT || 4000,
    },
} as const;

type Environment = keyof typeof configurations;

const environment: Environment =
    process.env.NODE_ENV === 'production' ? 'production' : 'development';

const serverConfig = configurations[environment];

validateEnv();

const bedrock = new BedrockService();
const app = express();

app.use(cors());
app.use(express.json());

app.use('/reading', createReadingRouter(bedrock));

// Surfaces errors as structured JSON. Unknown (non-Error) objects are re-thrown
// so Node.js can handle them and they don't silently disappear.
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof Error) {
        const status = (err as Error & { status?: number }).status ?? 500;
        res.status(status).json({ error: err.message });
        return;
    }
    throw err;
});

let httpServer: http.Server | https.Server;

if (serverConfig.ssl) {
    httpServer = https.createServer(
        {
            key: readFileSync(`./ssl/${environment}/key.pem`),
            cert: readFileSync(`./ssl/${environment}/cert.pem`),
        },
        app
    );
} else {
    httpServer = http.createServer(app);
}

httpServer.listen(serverConfig.port, () => {
    const protocol = serverConfig.ssl ? 'https' : 'http';
    console.log(`Server ready at ${protocol}://localhost:${serverConfig.port}`);
});
