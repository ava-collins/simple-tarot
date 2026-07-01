import dotenv from 'dotenv';
import { getApiConfig } from './config';
import { logInfo } from './logger';
import { createApiServer } from './server';

dotenv.config();

const config = getApiConfig();
const app = createApiServer();

app.listen(config.port, config.hostname, () => {
    logInfo('API server ready.', {
        bedrockMode: config.bedrock.mode,
        hostname: config.hostname,
        port: config.port
    });
});
