import { Router } from 'express';
import { ReadingRequest, ReadingResponse } from '../readings/contracts';
import { validateReadingRequest } from '../readings/validation';

export const readingsRouter = Router();

const createPlaceholderReading = (request: ReadingRequest): ReadingResponse => ({
    readingId: `placeholder-${request.spread}-${request.items.length}`,
    spread: request.spread,
    summary: `Placeholder reading for ${request.items.length} card${
        request.items.length === 1 ? '' : 's'
    }. Bedrock generation will be added in a later stage.`,
    positions: request.items.map(item => ({
        cardIndex: item.cardIndex,
        cardName: item.cardName,
        position: item.position,
        reversed: item.reversed,
        text: `${item.cardName} ${
            item.reversed ? 'reversed' : 'upright'
        } in ${item.position}.`
    })),
    citations: [],
    metadata: {
        mode: 'placeholder',
        itemCount: request.items.length
    }
});

readingsRouter.post('/readings', (req, res) => {
    const validation = validateReadingRequest(req.body);

    if (!validation.ok) {
        res.status(400).json({
            errors: validation.errors
        });
        return;
    }

    res.status(200).json(createPlaceholderReading(validation.value));
});
