/* eslint-disable arrow-body-style */
import { ApolloServer } from '@apollo/server';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { AvatarImageAPI } from './datasources/avatar-image-api';
import { Neo4jGraphQL } from '@neo4j/graphql';
import bodyparser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import { ensureConstraints } from './utils/constraints';
import express from 'express';
import { expressMiddleware } from '@as-integrations/express5';
import { gql } from 'graphql-tag';
import http from 'http';
import https from 'https';
import neo4j from 'neo4j-driver';
import { normalizeGraphData } from './migrations/normalize-graph-data';
import path from 'path';
import { readFileSync } from 'fs';
import { resolvers } from './resolvers';

dotenv.config();

const configurations = {
    production: {
        ssl: true,
        port: process.env.PROD_PORT || 443,
        hostname: process.env.PROD_HOST || '192.168.4.156'
    },
    development: {
        ssl: false,
        port: process.env.DEV_PORT || 4000,
        hostname: process.env.DEV_HOST
    }
};

type Environment = keyof typeof configurations;
const environment: Environment =
    process.env.NODE_ENV === 'development' ? 'development' : 'production';

const serverConfig = configurations[environment];

const typeDefs = gql(
    readFileSync(path.resolve(__dirname, './schema.graphql'), {
        encoding: 'utf-8'
    })
);

const NEO4J_URL = process.env.NEO4J_DB_URL || 'bolt://localhost:7687';
const NEO4J_USER = process.env.NEO4J_AUTH_USER || 'neo4j';
const NEO4J_PASSWORD = process.env.NEO4J_AUTH_PASSWORD || 'password';

const driver = neo4j.driver(NEO4J_URL, neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD));

const neoSchema = new Neo4jGraphQL({ typeDefs, resolvers, driver });
const app = express();

const graphqlPath = process.env.GRAPHQL_ENDPOINT || '/graphql';

let httpServer;
if (serverConfig.ssl) {
    httpServer = https.createServer(
        {
            key: readFileSync(`./ssl/${environment}/key.pem`),
            cert: readFileSync(`./ssl/${environment}/cert.pem`)
        },

        app
    );
} else {
    httpServer = http.createServer(app);
}

(async () => {
    try {
        // Normalize legacy records before strict constraints are applied.
        await normalizeGraphData(driver);

        // Ensure constraints are created
        await ensureConstraints(driver);

        const schema = await neoSchema.getSchema();
        const server = new ApolloServer({
            schema,
            plugins: [ApolloServerPluginDrainHttpServer({ httpServer: httpServer })]
        });

        await server.start();

        app.use(
            graphqlPath,
            cors<cors.CorsRequest>({ origin: '*' }),
            bodyparser.json(),
            expressMiddleware(server, {
                context: async ({ req }) => {
                    return {
                        dataSources: {
                            avatarImageAPI: new AvatarImageAPI()
                        },
                        driver,
                        req
                    };
                }
            })
        );

        await new Promise<void>(resolve =>
            httpServer.listen({ port: serverConfig.port }, resolve)
        );

        console.log(
            `🚀 Server ready at ${serverConfig.ssl === true ? ' https' : 'http'}://${
                serverConfig.hostname
            }:${serverConfig.port}${graphqlPath}`
        );
    } catch (error) {
        console.error('Error creating schema:', error);
        process.exit(1);
    }
})();
