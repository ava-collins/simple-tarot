import { readFileSync } from 'fs';
import path from 'path';
import { Request, Response, Router } from 'express';
import { BedrockService } from '../services/bedrock.js';
import { CardMetadata, DealtCard, ReadingRequest, ReadingResponse, SpreadPosition } from '../types.js';

const cards: CardMetadata[] = JSON.parse(
    readFileSync(path.join(__dirname, '../data/cards.json'), 'utf-8')
);
const positions: SpreadPosition[] = JSON.parse(
    readFileSync(path.join(__dirname, '../data/spread-positions.json'), 'utf-8')
);

const cardsByIndex = new Map(cards.map(c => [c.index, c]));
const positionsByIndex = new Map(positions.map(p => [p.index, p]));

export function createReadingRouter(bedrock: BedrockService): Router {
    const router = Router();

    router.post('/', async (req: Request, res: Response) => {
        const body = req.body as ReadingRequest;

        if (!Array.isArray(body?.items) || body.items.length === 0) {
            res.status(400).json({ error: 'items must be a non-empty array' });
            return;
        }

        const dealtCards: DealtCard[] = [];

        for (const item of body.items) {
            const card = cardsByIndex.get(item.cardIndex);
            if (!card) {
                res.status(400).json({ error: `Card not found: ${item.cardIndex}` });
                return;
            }

            const position = positionsByIndex.get(item.spreadPositionIndex);
            if (!position) {
                res.status(400).json({ error: `Spread position not found: ${item.spreadPositionIndex}` });
                return;
            }

            const query = `${card.name} ${item.reversed ? 'reversed' : 'upright'} in the ${position.displayName} position`;
            const context = await bedrock.retrieveContext(query);
            const cardReading = await bedrock.generateCardReading(card, position, item.reversed, context);

            dealtCards.push({
                positionDisplayName: position.displayName,
                positionDescription: position.description,
                spreadPositionIndex: position.index,
                card: { ...card, reversed: item.reversed },
                cardReading,
            });
        }

        const synthesis = await bedrock.synthesizeReading(dealtCards);

        const response: ReadingResponse = { cards: dealtCards, synthesis };
        res.json(response);
    });

    return router;
}
