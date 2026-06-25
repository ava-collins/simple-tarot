import {
    BedrockAgentRuntimeClient,
    RetrieveCommand,
} from '@aws-sdk/client-bedrock-agent-runtime';
import {
    BedrockRuntimeClient,
    InvokeModelCommand,
} from '@aws-sdk/client-bedrock-runtime';
import { CardMetadata, DealtCard, SpreadPosition } from '../types.js';

type ClaudeMessage = { role: 'user' | 'assistant'; content: string };

type ClaudeRequestBody = {
    anthropic_version: string;
    max_tokens: number;
    messages: ClaudeMessage[];
};

export class BedrockService {
    private readonly agentClient: BedrockAgentRuntimeClient;
    private readonly runtimeClient: BedrockRuntimeClient;
    private readonly kbId: string;
    private readonly haikuModelId: string;
    private readonly sonnetModelId: string;

    constructor() {
        const region = requireEnv('AWS_REGION');
        this.kbId = requireEnv('BEDROCK_KB_ID');
        this.haikuModelId = requireEnv('BEDROCK_MODEL_ID_HAIKU');
        this.sonnetModelId = requireEnv('BEDROCK_MODEL_ID_SONNET');

        this.agentClient = new BedrockAgentRuntimeClient({ region });
        this.runtimeClient = new BedrockRuntimeClient({ region });
    }

    async retrieveContext(query: string): Promise<string> {
        const response = await this.agentClient.send(
            new RetrieveCommand({
                knowledgeBaseId: this.kbId,
                retrievalQuery: { text: query },
                retrievalConfiguration: {
                    vectorSearchConfiguration: { numberOfResults: 5 },
                },
            })
        );

        const chunks = (response.retrievalResults ?? [])
            .map(r => r.content?.text ?? '')
            .filter(Boolean);

        return chunks.join('\n\n');
    }

    async generateCardReading(
        card: CardMetadata,
        position: SpreadPosition,
        reversed: boolean,
        retrievedContext: string
    ): Promise<string> {
        const orientation = reversed ? 'reversed' : 'upright';
        const keywords = reversed ? card.reversedKeywords : card.keywords;

        const prompt = [
            'You are an expert tarot reader. Generate a rich, personal reading for one card in a Celtic Cross spread.',
            '',
            `Card: ${card.name} (${orientation})`,
            `Keywords: ${keywords}`,
            `Card description: ${card.description}`,
            '',
            `Position: ${position.displayName}`,
            `Position significance: ${position.description}`,
            '',
            'Relevant tarot knowledge:',
            retrievedContext,
            '',
            `Write 2-3 sentences interpreting this card in this position for the querent. Be specific to this position's meaning and the card's ${orientation} orientation. Do not repeat the card name or position name verbatim.`,
        ].join('\n');

        return this.invokeModel(this.haikuModelId, prompt);
    }

    async synthesizeReading(cards: DealtCard[]): Promise<string> {
        const cardLines = cards
            .map(c => {
                const orientation = c.card.reversed ? 'reversed' : 'upright';
                return `${c.positionDisplayName}: ${c.card.name} (${orientation}) — ${c.cardReading}`;
            })
            .join('\n');

        const prompt = [
            'You are an expert tarot reader. The following Celtic Cross reading has been laid out.',
            'Provide a cohesive 3-4 sentence synthesis of the overall reading, weaving the positions and cards into a unified narrative.',
            '',
            'Reading cards (in order):',
            cardLines,
            '',
            "Synthesize the reading's overall message. Do not list the cards again.",
        ].join('\n');

        return this.invokeModel(this.sonnetModelId, prompt);
    }

    private async invokeModel(modelId: string, prompt: string): Promise<string> {
        const body: ClaudeRequestBody = {
            anthropic_version: 'bedrock-2023-05-31',
            max_tokens: 512,
            messages: [{ role: 'user', content: prompt }],
        };

        const response = await this.runtimeClient.send(
            new InvokeModelCommand({
                modelId,
                contentType: 'application/json',
                accept: 'application/json',
                body: Buffer.from(JSON.stringify(body)),
            })
        );

        const decoded = JSON.parse(Buffer.from(response.body).toString('utf-8'));
        const text = decoded?.content?.[0]?.text;

        if (typeof text !== 'string' || text.length === 0) {
            throw new Error(`Bedrock model ${modelId} returned no text content`);
        }

        return text.trim();
    }
}

function requireEnv(name: string): string {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
}
