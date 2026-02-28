import { type Driver } from 'neo4j-driver';

export async function ensureConstraints(driver: Driver) {
    const session = driver.session();

    try {
        // Create unique constraint for Spread.name
        await session.run(`
            CREATE CONSTRAINT spread_name_unique IF NOT EXISTS 
            FOR (s:Spread) REQUIRE s.name IS UNIQUE
        `);

        // Drop stale constraints from old SpreadPosition model.
        await session.run(`
            DROP CONSTRAINT spread_position_name_unique IF EXISTS
        `);

        await session.run(`
            DROP CONSTRAINT spread_position_index_unique IF EXISTS
        `);

        // SpreadPosition index should be unique within a spread name.
        await session.run(`
            CREATE CONSTRAINT spread_position_index_unique IF NOT EXISTS
            FOR (sp:SpreadPosition) REQUIRE (sp.spreadName, sp.index) IS UNIQUE
        `);

        // NOTE: Neo4j Community does not support property existence constraints.
        // Data normalization + mutation/query logic enforce spreadName semantics instead.

        // Create unique constraint for Card.index
        await session.run(`
            CREATE CONSTRAINT card_index_unique IF NOT EXISTS 
            FOR (c:Card) REQUIRE c.index IS UNIQUE
        `);

        // Create unique constraint for Suite.name
        await session.run(`
            CREATE CONSTRAINT suite_name_unique IF NOT EXISTS 
            FOR (s:Suite) REQUIRE s.name IS UNIQUE
        `);
    } finally {
        await session.close();
    }
}
