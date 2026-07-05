import { Router } from 'express';
import { createBedrockReadingGenerator } from '../bedrock/bedrock-client';
import { getApiConfig } from '../config';
import { GeneratedReading, ReadingRequest } from '../readings/contracts';
import { createLocalGeneratedReading } from '../readings/local-generated-reading';
import { buildReadingPrompt } from '../readings/prompt-builder';
import { mapGeneratedReadingResponse } from '../readings/response-mapper';
import { validateReadingRequest } from '../readings/validation';

export const readingsRouter = Router();

const generateReading = async (
    request: ReadingRequest,
    prompt: string,
    requestId?: string
): Promise<GeneratedReading> => {
    const config = getApiConfig().bedrock;

    if (config.mode === 'bedrock') {
        return createBedrockReadingGenerator(config, undefined, {
            requestId
        }).generateReading(prompt);
    }

    return createLocalGeneratedReading(request);
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
        const generated = await generateReading(
            validation.value,
            prompt,
            res.locals.requestId
        );

        res.status(200).json(mapGeneratedReadingResponse(validation.value, generated));
    } catch (error) {
        next(error);
    }
});
