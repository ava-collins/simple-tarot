import { resolve } from 'node:path';
import { readFirestoreCorpusExport } from '../src/corpus/firestore-export';
import { normalizeFirestoreCorpus, writeNormalizedCorpus } from '../src/corpus/normalize-corpus';

const sourcePath = process.argv[2]
    ? resolve(process.cwd(), process.argv[2] as string)
    : undefined;
const outputDir = process.argv[3]
    ? resolve(process.cwd(), process.argv[3] as string)
    : resolve(__dirname, '../corpus/generated');

const source = readFirestoreCorpusExport(sourcePath);
const documents = normalizeFirestoreCorpus(source);
const outputPath = writeNormalizedCorpus(documents, outputDir);

console.log(`Wrote ${documents.length} corpus documents to ${outputPath}`);
