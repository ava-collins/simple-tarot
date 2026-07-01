import { readdir, readFile, rm, mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { transform } from '@svgr/core';
import dotenv from 'dotenv';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const defaultOutputDir = resolve(scriptDir, '../src/cards');

const cardRanks = [
    '1',
    '2',
    '3',
    '4',
    '5',
    '6',
    '7',
    '8',
    '9',
    '10',
    'page',
    'knight',
    'queen',
    'king'
];

const suites = [
    {
        directory: 'major-arcana',
        filePrefix: 'arcana',
        componentPrefix: 'Arcana',
        cardNumberFor: nameParts => Number.parseInt(nameParts[0], 10)
    },
    {
        directory: 'wands',
        filePrefix: 'wand',
        componentPrefix: 'Wand',
        cardNumberFor: nameParts => 22 + cardRanks.indexOf(nameParts[0])
    },
    {
        directory: 'cups',
        filePrefix: 'cup',
        componentPrefix: 'Cup',
        cardNumberFor: nameParts => 36 + cardRanks.indexOf(nameParts[0])
    },
    {
        directory: 'swords',
        filePrefix: 'sword',
        componentPrefix: 'Sword',
        cardNumberFor: nameParts => 50 + cardRanks.indexOf(nameParts[0])
    },
    {
        directory: 'coins',
        filePrefix: 'coin',
        componentPrefix: 'Coin',
        cardNumberFor: nameParts => 64 + cardRanks.indexOf(nameParts[0])
    }
];

const toPascalPart = value =>
    value
        .split('-')
        .filter(Boolean)
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join('');

const componentNameFor = (suite, fileName) => {
    const baseName = fileName.replace(/\.svg$/u, '');
    const expectedPrefix = `${suite.filePrefix}_`;

    if (!baseName.startsWith(expectedPrefix)) {
        throw new Error(
            `SVG file "${fileName}" in ${suite.directory} must start with "${expectedPrefix}".`
        );
    }

    const nameParts = baseName.slice(expectedPrefix.length).split('_');
    const cardNumber = suite.cardNumberFor(nameParts);

    if (!Number.isInteger(cardNumber) || cardNumber < 0) {
        throw new Error(`Could not determine card number for "${fileName}".`);
    }

    return {
        cardNumber,
        componentName: `${suite.componentPrefix}${nameParts.map(toPascalPart).join('')}`
    };
};

const getSvgFiles = async directory => {
    const entries = await readdir(directory);

    return entries
        .filter(entry => entry.endsWith('.svg'))
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
};

export const selfCloseEmptyElements = code =>
    code.replace(/<([A-Z][A-Za-z0-9]*)\b([^>]*)>\s*<\/\1>/gu, '<$1$2 />');

const generateComponent = async ({ componentName, sourcePath, outputPath }) => {
    const source = await readFile(sourcePath, 'utf8');
    const code = await transform(
        source,
        {
            native: true,
            plugins: ['@svgr/plugin-jsx', '@svgr/plugin-prettier'],
            typescript: true
        },
        {
            componentName,
            filePath: outputPath,
            caller: {
                name: '@simpletarot/cards'
            }
        }
    );
    const generatedCode = `/* eslint-disable @typescript-eslint/ban-ts-comment */\n// @ts-nocheck\n${selfCloseEmptyElements(code)}`;

    await writeFile(
        outputPath,
        generatedCode.endsWith('\n') ? generatedCode : `${generatedCode}\n`
    );
};

const writeSuiteIndex = async (outputSuiteDir, componentNames) => {
    const index = componentNames
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
        .map(componentName => `export { default as ${componentName} } from './${componentName}';`)
        .join('\n');

    await writeFile(outputSuiteDir, `${index}\n`);
};

export const resolveSourceDir = env => {
    const sourceDir = env.CARD_SVG_SOURCE_DIR?.trim();

    if (!sourceDir) {
        throw new Error('Missing CARD_SVG_SOURCE_DIR environment variable.');
    }

    return sourceDir;
};

export const generateCards = async ({
    expectedCardCount = 78,
    outputDir = defaultOutputDir,
    sourceDir
}) => {
    await rm(outputDir, { force: true, recursive: true });
    await mkdir(outputDir, { recursive: true });

    const generated = [];

    for (const suite of suites) {
        const sourceSuiteDir = join(sourceDir, suite.directory);
        const outputSuiteDir = join(outputDir, suite.directory);
        const svgFiles = await getSvgFiles(sourceSuiteDir);
        const componentNames = [];

        await mkdir(outputSuiteDir, { recursive: true });

        for (const fileName of svgFiles) {
            const { cardNumber, componentName } = componentNameFor(suite, fileName);
            const outputPath = join(outputSuiteDir, `${componentName}.tsx`);

            await generateComponent({
                componentName,
                outputPath,
                sourcePath: join(sourceSuiteDir, fileName)
            });

            componentNames.push(componentName);
            generated.push({
                cardNumber,
                componentName,
                relativePath: relative(outputDir, outputPath)
            });
        }

        await writeSuiteIndex(join(outputSuiteDir, 'index.tsx'), componentNames);
    }

    if (generated.length !== expectedCardCount) {
        throw new Error(
            `Expected ${expectedCardCount} SVG card files, but generated ${generated.length}.`
        );
    }

    generated.sort((a, b) => a.cardNumber - b.cardNumber);

    const cardIndex = Object.fromEntries(
        generated.map(({ cardNumber, componentName }) => [cardNumber, componentName])
    );

    await writeFile(
        join(outputDir, 'cards.index.json'),
        `${JSON.stringify(cardIndex, null, 4)}\n`
    );

    return { generated };
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    dotenv.config();

    try {
        const sourceDir = resolveSourceDir(process.env);
        const result = await generateCards({ sourceDir });

        console.log(`Generated ${result.generated.length} card components.`);
    } catch (error) {
        console.error(error instanceof Error ? error.message : error);
        process.exitCode = 1;
    }
}
