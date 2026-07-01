import { Router } from 'express';
import { createBedrockReadingGenerator } from '../bedrock/bedrock-client';
import { getApiConfig } from '../config';
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

const generateReading = async (
    request: ReadingRequest,
    prompt: string
): Promise<GeneratedReading> => {
    const config = getApiConfig().bedrock;

    if (config.mode === 'bedrock') {
        return createBedrockReadingGenerator(config).generateReading(prompt);
    }

    return createLocalGeneratedReading(request, prompt);
};

readingsRouter.post('/readings', async (req, res, next) => {
    const validation = validateReadingRequest(req.body);

    if (!validation.ok) {
        res.status(400).json({
            errors: validation.errors
        });

return;
    }

    const prompt = buildReadingPrompt(validation.value);

    try {
        const generated = await generateReading(validation.value, prompt);

        res.status(200).json(mapGeneratedReadingResponse(validation.value, generated));
    } catch (error) {
        next(error);
    }
});
