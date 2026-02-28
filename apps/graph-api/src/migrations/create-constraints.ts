import { ensureConstraints } from '../utils/constraints';
import dotenv from 'dotenv';
import neo4j from 'neo4j-driver';

dotenv.config();

const NEO4J_URL = process.env.NEO4J_DB_URL || 'bolt://localhost:7687';
const NEO4J_USER = process.env.NEO4J_AUTH_USER || 'neo4j';
const NEO4J_PASSWORD = process.env.NEO4J_AUTH_PASSWORD || 'password';

(async () => {
    const driver = neo4j.driver(NEO4J_URL, neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD));

    try {
        await ensureConstraints(driver);
        console.log('Constraints migration completed.');
    } finally {
        await driver.close();
    }
})().catch(error => {
    console.error('Constraints migration failed:', error);
    process.exit(1);
});
