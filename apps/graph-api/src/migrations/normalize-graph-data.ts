import { Driver } from 'neo4j-driver';
import dotenv from 'dotenv';
import neo4j from 'neo4j-driver';

dotenv.config();

export async function normalizeGraphData(driver: Driver) {
    const session = driver.session();

    try {
        // Ensure non-null card properties expected by the GraphQL schema.
        await session.run(`
            MATCH (c:Card)
            SET c.description = coalesce(c.description, ""),
                c.image = coalesce(c.image, ""),
                c.name = coalesce(c.name, ""),
                c.numeral = coalesce(c.numeral, ""),
                c.title = coalesce(c.title, ""),
                c.type = coalesce(c.type, ""),
                c.keywords = coalesce(c.keywords, []),
                c.reversedKeywords = coalesce(c.reversedKeywords, [])
        `);

        // Backfill missing card indexes before unique constraints are enforced.
        await session.run(`
            MATCH (c:Card)
            WHERE c.index IS NULL
            WITH c ORDER BY id(c)
            WITH collect(c) AS missing
            OPTIONAL MATCH (existing:Card)
            WHERE existing.index IS NOT NULL
            WITH missing, coalesce(max(existing.index), -1) AS maxIndex
            UNWIND range(0, size(missing) - 1) AS offset
            WITH missing[offset] AS c, maxIndex + offset + 1 AS generated
            SET c.index = generated
        `);

        // Normalize spread position fields and backfill index/spreadName where missing.
        await session.run(`
            MATCH (sp:SpreadPosition)
            SET sp.displayName = coalesce(sp.displayName, ""),
                sp.description = coalesce(sp.description, ""),
                sp.spreadName = CASE
                    WHEN sp.spreadName IS NULL OR trim(sp.spreadName) = ""
                    THEN CASE
                        WHEN sp.name IS NULL OR trim(sp.name) = ""
                        THEN CASE
                            WHEN sp.displayName IS NULL OR trim(sp.displayName) = ""
                            THEN "spread-position-" + toString(id(sp))
                            ELSE sp.displayName
                        END
                        ELSE sp.name
                    END
                    ELSE sp.spreadName
                END,
                sp.name = CASE
                    WHEN sp.name IS NULL OR trim(sp.name) = ""
                    THEN CASE
                        WHEN sp.displayName IS NULL OR trim(sp.displayName) = ""
                        THEN "spread-position-" + toString(id(sp))
                        ELSE sp.displayName
                    END
                    ELSE sp.name
                END
        `);

        await session.run(`
            MATCH (sp:SpreadPosition)
            WHERE sp.index IS NULL
            WITH sp ORDER BY id(sp)
            WITH collect(sp) AS missing
            OPTIONAL MATCH (existing:SpreadPosition)
            WHERE existing.index IS NOT NULL
            WITH missing, coalesce(max(existing.index), -1) AS maxIndex
            UNWIND range(0, size(missing) - 1) AS offset
            WITH missing[offset] AS sp, maxIndex + offset + 1 AS generated
            SET sp.index = generated
        `);

        // Migrate legacy CardPositionMeaning scalar fields into related nodes.
        await session.run(`
            MATCH (m:CardPositionMeaning)
            WHERE NOT EXISTS { MATCH (m)-[:HAS_UPRIGHT]->(:Upright) }
            CREATE (u:Upright {
                meaning: coalesce(m.upright, ""),
                keywords: coalesce(m.uprightKeywords, "")
            })
            MERGE (m)-[:HAS_UPRIGHT]->(u)
        `);

        await session.run(`
            MATCH (m:CardPositionMeaning)
            WHERE NOT EXISTS { MATCH (m)-[:HAS_REVERSED]->(:Reversed) }
            CREATE (r:Reversed {
                meaning: coalesce(m.reversed, ""),
                keywords: coalesce(m.reversedKeywords, "")
            })
            MERGE (m)-[:HAS_REVERSED]->(r)
        `);

        // Normalize non-null Upright/Reversed node properties.
        await session.run(`
            MATCH (u:Upright)
            SET u.meaning = coalesce(u.meaning, ""),
                u.keywords = coalesce(u.keywords, "")
        `);

        await session.run(`
            MATCH (r:Reversed)
            SET r.meaning = coalesce(r.meaning, ""),
                r.keywords = coalesce(r.keywords, "")
        `);
    } finally {
        await session.close();
    }
}

if ((process.argv[1] || '').includes('normalize-graph-data')) {
    (async () => {
        const NEO4J_URL = process.env.NEO4J_DB_URL || 'bolt://localhost:7687';
        const NEO4J_USER = process.env.NEO4J_AUTH_USER || 'neo4j';
        const NEO4J_PASSWORD = process.env.NEO4J_AUTH_PASSWORD || 'password';

        const driver = neo4j.driver(
            NEO4J_URL,
            neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD)
        );

        try {
            await normalizeGraphData(driver);
            console.log('Graph data normalization completed.');
        } finally {
            await driver.close();
        }
    })().catch(error => {
        console.error('Graph data normalization failed:', error);
        process.exit(1);
    });
}
