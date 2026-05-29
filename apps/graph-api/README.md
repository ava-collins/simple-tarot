# Graph API

`apps/graph-api` is the backend GraphQL API for Simple Tarot. It serves tarot
data from Neo4j: cards, suits, spreads, spread positions, and card meanings for
upright/reversed readings.

The main API entry point starts an Apollo Server on Express, connects to Neo4j,
builds the GraphQL schema and exposes the API at /graphql by default.

The data model is graph-shaped:
- **Card**: a tarot card with index, name, title, image, keywords, etc.
- **Spread**: a tarot spread, such as a reading layout.
- **SpreadPosition**: a position inside a spread.
- **CardPositionMeaning**: connects a card to a spread position and stores
  upright/reversed meanings through Upright and Reversed nodes.
- **Suite**: tarot suit metadata.

The schema uses @neo4j/graphql, so many GraphQL operations are backed directly
by Cypher. Custom Cypher takes selected cards and positions and returns a fully
assembled reading.

On startup, the server also runs two database preparation steps:
normalizeGraphData, which backfills missing fields and migrates older meaning
data into the current node structure. ensureConstraints, which creates Neo4j
uniqueness constraints for cards, spreads, spread positions, and suites.

Custom TypeScript resolvers handle:
- avatarImages, using SerpAPI through avatar-image-api.ts (line 1)
- cardsByIndex, using a direct Neo4j query How To Run It From the repo root:
  bash



## Environment variables:
```bash
NODE_ENV
NEO4J_DB_URL
NEO4J_AUTH_USER
NEO4J_AUTH_PASSWORD
DEV_HOST
DEV_PORT
PROD_PORT
GRAPHQL_ENDPOINT
SERPAPI_API_KEY
```

## How to run
```bash
yarn run-db
yarn run-db yarn graph:dev
```

The development server defaults to: text
```bash
http://localhost:4000/graphql
```

## How To Use The API

GraphQL clients use this API to ask, “Given these cards in these spread
positions, what should the tarot reading say?” The API looks up the card,
position, orientation, keywords, and stored meaning in Neo4j, then returns a
clean SpreadCard response ready for the app UI.

### Example Queries

Fetch cards by index:
```
query {
  cardsByIndex(indexes: [0, 1, 2]) {
    index
    name
    title
    image
    keywords
    reversedKeywords
  }
}
```

Generate a reading from selected card/position:
```query {
    reading(
        items: [
        { cardIndex: 0, spreadPositionIndex: 0, reversed: false }
        { cardIndex: 1, spreadPositionIndex: 1, reversed: true }
        ]
    ) {
        reversed
        cardReading
        keywords
        card {
        index
        name
        title
        }
        position {
        index
        displayName
        description
        }
    }
    }
```

Create or update cards in bulk:
```mutation {
    createCards(
        cards: [
        {
            index: 0
            name: "the-fool"
            title: "The Fool"
            description: "A new beginning."
            image: "/cards/fool.png"
            numeral: "0"
            type: "major"
            keywords: "beginnings, innocence, spontaneity"
            reversedKeywords: "recklessness, hesitation"
        }
        ]
    ) {
        index
        name
        title
    }
    }
```

