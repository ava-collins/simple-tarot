import { Record as Neo4jRecord } from 'neo4j-driver';
import { Resolvers } from './types';

export const resolvers: Resolvers = {
    Query: {
        avatarImages: (_, __, { dataSources }) =>
            dataSources.avatarImageAPI.getAvatarImages(),
        cardsByIndex: async (_, args, { driver }) => {
            const session = driver.session();
            try {
                const result = await session.run(
                    'MATCH (c:Card) WHERE c.index IN $indexes RETURN c ORDER BY c.index',
                    { indexes: args.indexes }
                );

                return result.records.map((record: Neo4jRecord) => {
                    const card = record.get('c').properties;

                    return {
                        description: card.description,
                        image: card.image,
                        index: card.index.toNumber(),
                        keywords: card.keywords || [],
                        meanings: [],
                        name: card.name,
                        numeral: card.numeral,
                        reversedKeywords: card.reversedKeywords || [],
                        title: card.title,
                        type: card.type
                    };
                });
            } finally {
                await session.close();
            }
        }
    }
};
