import {
    BedrockAgentClient,
    GetIngestionJobCommand,
    StartIngestionJobCommand,
} from '@aws-sdk/client-bedrock-agent';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { readdirSync, readFileSync, statSync } from 'fs';
import path from 'path';

const CORPUS_DIR = path.join(__dirname, '../corpus');

function requireEnvVar(name: string): string {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
}

function collectFiles(dir: string, base = dir): string[] {
    const entries = readdirSync(dir);
    const files: string[] = [];
    for (const entry of entries) {
        const full = path.join(dir, entry);
        if (statSync(full).isDirectory()) {
            files.push(...collectFiles(full, base));
        } else if (entry.endsWith('.md')) {
            files.push(full);
        }
    }
    return files;
}

async function uploadCorpus(s3: S3Client, bucketName: string): Promise<number> {
    const files = collectFiles(CORPUS_DIR);
    if (files.length === 0) {
        throw new Error(`No .md files found in ${CORPUS_DIR}. Run yarn corpus:build first.`);
    }

    for (const filePath of files) {
        const key = path.relative(CORPUS_DIR, filePath);
        const body = readFileSync(filePath);
        await s3.send(
            new PutObjectCommand({
                Bucket: bucketName,
                Key: key,
                Body: body,
                ContentType: 'text/markdown',
            })
        );
        console.log(`  uploaded ${key}`);
    }

    return files.length;
}

async function syncKnowledgeBase(
    agent: BedrockAgentClient,
    knowledgeBaseId: string,
    dataSourceId: string
): Promise<void> {
    const start = await agent.send(
        new StartIngestionJobCommand({ knowledgeBaseId, dataSourceId })
    );

    const jobId = start.ingestionJob?.ingestionJobId;
    if (!jobId) {
        throw new Error('StartIngestionJob did not return an ingestionJobId');
    }

    console.log(`Ingestion job started: ${jobId}`);

    let status = start.ingestionJob?.status ?? 'STARTING';
    while (status !== 'COMPLETE' && status !== 'FAILED' && status !== 'STOPPED') {
        await new Promise(resolve => setTimeout(resolve, 10_000));

        const poll = await agent.send(
            new GetIngestionJobCommand({ knowledgeBaseId, dataSourceId, ingestionJobId: jobId })
        );

        status = poll.ingestionJob?.status ?? status;
        const stats = poll.ingestionJob?.statistics;
        process.stdout.write(
            `  status: ${status}` +
                (stats ? ` (scanned: ${stats.numberOfDocumentsScanned ?? 0}, indexed: ${stats.numberOfNewDocumentsIndexed ?? 0})` : '') +
                '\n'
        );
    }

    if (status !== 'COMPLETE') {
        const poll = await agent.send(
            new GetIngestionJobCommand({ knowledgeBaseId, dataSourceId, ingestionJobId: jobId })
        );
        const reason = poll.ingestionJob?.failureReasons?.join('; ') ?? 'unknown';
        throw new Error(`Ingestion job ${jobId} ended with status ${status}: ${reason}`);
    }
}

async function main() {
    const awsRegion = requireEnvVar('AWS_REGION');
    const bucketName = requireEnvVar('CORPUS_BUCKET_NAME');
    const knowledgeBaseId = requireEnvVar('BEDROCK_KB_ID');
    const dataSourceId = requireEnvVar('BEDROCK_KB_DATA_SOURCE_ID');

    const s3 = new S3Client({ region: awsRegion });
    const agent = new BedrockAgentClient({ region: awsRegion });

    console.log(`Uploading corpus to s3://${bucketName}...`);
    const count = await uploadCorpus(s3, bucketName);
    console.log(`Uploaded ${count} documents.`);

    console.log('\nStarting Bedrock Knowledge Base ingestion...');
    await syncKnowledgeBase(agent, knowledgeBaseId, dataSourceId);

    console.log('\nKnowledge Base sync complete.');
}

main();
