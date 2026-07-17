import { resolve } from 'node:path';
import { validateCanonicalCorpus } from '../src/corpus/canonical-validation';
import { readFirestoreCorpusExport } from '../src/corpus/firestore-export';
import {
    migrateFirestoreCorpus,
    writeCanonicalCorpus
} from '../src/corpus/migrate-firestore-corpus';

const CORPUS_SOURCE_PATH = '../../../assets/corpus';
const sourcePath = process.argv[2] ? resolve(process.cwd(), process.argv[2]) : undefined;
const outputDirectory = process.argv[3]
    ? resolve(process.cwd(), process.argv[3])
    : resolve(__dirname, CORPUS_SOURCE_PATH);

const corpus = migrateFirestoreCorpus(readFirestoreCorpusExport(sourcePath));
const validation = validateCanonicalCorpus(corpus);

if (!validation.ok) {
    throw new Error(
        `Canonical corpus validation failed:\n${validation.errors
            .map(error => `${error.code} ${error.path}: ${error.message}`)
            .join('\n')}`
    );
}

const paths = writeCanonicalCorpus(corpus, outputDirectory);

console.log(`cards: ${corpus.cards.items.length}`);
console.log(`spreads: ${corpus.spreads.items.length}`);
console.log(`correspondences: ${corpus.correspondences.items.length}`);
console.log(`themeFragments: ${corpus.themeFragments.items.length}`);
console.log(`relationshipRules: ${corpus.relationshipRules.items.length}`);
console.log(`legacyPositionMeanings: ${corpus.legacyPositionMeanings.items.length}`);
console.log(`warnings: ${validation.warnings.length}`);
validation.warnings.forEach(warning =>
    console.warn(`${warning.code} ${warning.path}: ${warning.message}`)
);
console.log(`Wrote ${paths.length} canonical corpus files to ${outputDirectory}`);
