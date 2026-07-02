import serverlessExpress from '@codegenie/serverless-express';
import { createApiServer } from './server';

export const handler = serverlessExpress({
    app: createApiServer()
});
