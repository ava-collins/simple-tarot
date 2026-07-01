import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { FirestoreCorpusExport } from './types';

export const DEFAULT_CORPUS_SOURCE_PATH = resolve(
    __dirname,
    '../../../../assets/ignore/corpus-source.json'
);

export function readFirestoreCorpusExport(
    sourcePath = DEFAULT_CORPUS_SOURCE_PATH
): FirestoreCorpusExport {
    return JSON.parse(readFileSync(sourcePath, 'utf8')) as FirestoreCorpusExport;
}
