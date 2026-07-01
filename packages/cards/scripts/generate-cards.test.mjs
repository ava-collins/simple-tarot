import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { describe, expect, it } from 'vitest';

import { generateCards, resolveSourceDir, selfCloseEmptyElements } from './generate-cards.mjs';

const tinySvg = '<svg viewBox="0 0 10 10"><path d="M0 0h10v10H0z" /></svg>';

const makeTempDir = () => mkdtemp(join(tmpdir(), 'simple-tarot-cards-'));

describe('generateCards', () => {
    it('generates React Native SVG components and indexes from source SVG folders', async () => {
        const root = await makeTempDir();
        const sourceDir = join(root, 'source');
        const outputDir = join(root, 'output');

        try {
            for (const suite of ['major-arcana', 'wands', 'cups', 'swords', 'coins']) {
                await mkdir(join(sourceDir, suite), { recursive: true });
            }

            await writeFile(join(sourceDir, 'major-arcana', 'arcana_0_fool.svg'), tinySvg);
            await writeFile(join(sourceDir, 'wands', 'wand_1.svg'), tinySvg);
            await writeFile(join(sourceDir, 'wands', '.DS_Store'), 'ignored');

            const result = await generateCards({
                expectedCardCount: 2,
                outputDir,
                sourceDir
            });

            expect(result.generated).toEqual([
                {
                    cardNumber: 0,
                    componentName: 'Arcana0Fool',
                    relativePath: 'major-arcana/Arcana0Fool.tsx'
                },
                {
                    cardNumber: 22,
                    componentName: 'Wand1',
                    relativePath: 'wands/Wand1.tsx'
                }
            ]);

            const fool = await readFile(
                join(outputDir, 'major-arcana', 'Arcana0Fool.tsx'),
                'utf8'
            );
            expect(fool).toContain('/* eslint-disable @typescript-eslint/ban-ts-comment */');
            expect(fool).toContain('// @ts-nocheck');
            expect(fool).toContain('from "react-native-svg"');
            expect(fool).toContain('const Arcana0Fool =');
            expect(fool).toContain('export default Arcana0Fool');

            await expect(
                readFile(join(outputDir, 'wands', 'index.tsx'), 'utf8')
            ).resolves.toContain("export { default as Wand1 } from './Wand1';");

            await expect(
                readFile(join(outputDir, 'cards.index.json'), 'utf8')
            ).resolves.toBe('{\n    "0": "Arcana0Fool",\n    "22": "Wand1"\n}\n');
        } finally {
            await rm(root, { force: true, recursive: true });
        }
    });

    it('requires CARD_SVG_SOURCE_DIR instead of using a hard-coded fallback', () => {
        expect(() => resolveSourceDir({})).toThrow(
            'Missing CARD_SVG_SOURCE_DIR environment variable.'
        );
        expect(
            resolveSourceDir({
                CARD_SVG_SOURCE_DIR: '  /tmp/source-cards  '
            })
        ).toBe('/tmp/source-cards');
    });

    it('self-closes empty generated JSX elements', () => {
        expect(selfCloseEmptyElements('<Defs id="defs292"></Defs>')).toBe(
            '<Defs id="defs292" />'
        );
        expect(selfCloseEmptyElements('<G\n    id="layer1"\n></G>')).toBe(
            '<G\n    id="layer1"\n />'
        );
    });
});
