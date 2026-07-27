import {
    existsSync,
    readFileSync,
    readdirSync,
    statSync
} from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const storiesRoot = resolve(packageRoot, 'stories');
const violations = new Set();

const legacyFiles = [
    'stories/atoms/form-button.tsx',
    'stories/atoms/form-button.stories.tsx',
    'stories/atoms/form-input.tsx',
    'stories/atoms/form-input.stories.tsx',
    'stories/atoms/form-error-text.tsx',
    'stories/atoms/form-error-text.stories.tsx',
    'stories/molecules/form-input-row.tsx',
    'stories/molecules/form-input-row.stories.tsx',
    'stories/molecules/form-input-row.mdx'
];

const atomFiles = [
    'stories/atoms/button.tsx',
    'stories/atoms/input.tsx',
    'stories/atoms/feedback-text.tsx',
    'stories/molecules/input-field.tsx'
];

const collectSourceFiles = directory =>
    readdirSync(directory)
        .flatMap(entry => {
            const path = resolve(directory, entry);

            if (statSync(path).isDirectory()) {
                return collectSourceFiles(path);
            }

            return /\.(ts|tsx)$/.test(entry) ? [path] : [];
        });

for (const path of legacyFiles) {
    if (existsSync(resolve(packageRoot, path))) {
        violations.add(`${path}: legacy component file remains`);
    }
}

const legacyNamePattern =
    /\b(FormButton|FormInput|FormErrorText|FormInputRow)\b/g;

for (const path of [resolve(packageRoot, 'index.tsx'), ...collectSourceFiles(storiesRoot)]) {
    const source = readFileSync(path, 'utf8');
    const names = new Set(source.match(legacyNamePattern) ?? []);

    for (const name of names) {
        violations.add(
            `${relative(packageRoot, path)}: legacy identifier ${name} remains`
        );
    }
}

const colorLiteralPattern =
    /#[0-9a-f]{3,8}\b|rgba?\s*\(|(['"])(black|white)\1/i;
const styleEscapePattern =
    /\b(buttonStyle|titleStyle|containerStyle|style)\??\s*:/;

for (const path of atomFiles) {
    const absolutePath = resolve(packageRoot, path);

    if (!existsSync(absolutePath)) {
        continue;
    }

    const source = readFileSync(absolutePath, 'utf8');

    if (colorLiteralPattern.test(source)) {
        violations.add(`${path}: color literal bypasses the theme`);
    }

    if (styleEscapePattern.test(source)) {
        violations.add(`${path}: arbitrary style escape hatch is exposed`);
    }
}

if (violations.size > 0) {
    console.error('UI atom usage check failed:');

    for (const violation of [...violations].sort()) {
        console.error(`- ${violation}`);
    }

    process.exitCode = 1;
} else {
    console.log('UI atom usage check passed.');
}
