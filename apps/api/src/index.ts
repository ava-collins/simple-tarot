import dotenv from 'dotenv';
import { getApiConfig } from './config';
import { createApiServer } from './server';

dotenv.config();

const config = getApiConfig();
const app = createApiServer();

app.listen(config.port, config.hostname, () => {
    console.log(`API server ready at http://${config.hostname}:${config.port}`);
});
