import { Router } from 'express';
import { GeneratedReading, ReadingRequest } from '../readings/contracts';
import { buildReadingPrompt } from '../readings/prompt-builder';
import { mapGeneratedReadingResponse } from '../readings/response-mapper';
import { validateReadingRequest } from '../readings/validation';

export const readingsRouter = Router();

const createLocalGeneratedReading = (
    request: ReadingRequest,
    prompt: string
): GeneratedReading => ({
    text: [
        `Local placeholder reading for ${request.items.length} card${
            request.items.length === 1 ? '' : 's'
        }. Bedrock generation will be added in a later stage.`,
        ...request.items.map(
            item =>
                `${item.position}: ${item.cardName} ${
                    item.reversed ? 'reversed' : 'upright'
                } awaits generated interpretation.`
        )
    ].join('\n'),
    citations: [],
    modelId: `local-prompt-v1:${prompt.length}`
});

readingsRouter.post('/readings', (req, res) => {
    const validation = validateReadingRequest(req.body);

    if (!validation.ok) {
        res.status(400).json({
            errors: validation.errors
        });
        return;
    }

    const prompt = buildReadingPrompt(validation.value);
    const generated = createLocalGeneratedReading(validation.value, prompt);

    res.status(200).json(mapGeneratedReadingResponse(validation.value, generated));
});
