#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

function isObject(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function main() {
    const inputArg = process.argv[2];

    if (!inputArg) {
        console.error(
            'Usage: yarn generate:card-position-meanings -- <path-to-cards.json>'
        );
        process.exit(1);
    }

    const inputPath = path.resolve(process.cwd(), inputArg);

    if (!fs.existsSync(inputPath)) {
        console.error(`Input file not found: ${inputPath}`);
        process.exit(1);
    }

    let parsed;
    try {
        parsed = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
    } catch (error) {
        console.error(`Failed to parse JSON at ${inputPath}`);
        console.error(error instanceof Error ? error.message : String(error));
        process.exit(1);
    }

    if (!isObject(parsed) && !Array.isArray(parsed)) {
        console.error('cards.json must be a top-level object or array-like object.');
        process.exit(1);
    }

    const cards = parsed;
    const keys = Object.keys(cards);
    const output = [];
    let skipped = 0;

    for (const index of keys) {
        const card = cards[index];

        if (!isObject(card) || typeof card.index !== 'number' || Number.isNaN(card.index)) {
            skipped += 1;
            continue;
        }

        output.push({
            cardIndex: card.index,
            reversedMeaning: card.celtic_cross?.reversed?.outcome ?? '',
            spreadPositionIndex: 9,
            uprightMeaning: card.celtic_cross?.upright?.outcome ?? '',
        });
    }

    const outputPath = path.join(
        path.dirname(inputPath),
        'card-position-meaning-seed.json'
    );

    fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8');

    console.log(`Generated ${output.length} rows.`);
    console.log(`Skipped ${skipped} rows (invalid or missing card.index).`);
    console.log(`Wrote output to ${outputPath}`);
}

main();
