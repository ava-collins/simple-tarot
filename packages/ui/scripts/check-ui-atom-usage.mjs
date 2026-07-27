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
    'stories/molecules/input-field.tsx',
    'stories/molecules/screen-state.tsx'
];

const screenStateFiles = [
    'stories/screens/account-screen.tsx',
    'stories/screens/cognito-sign-in-screen.tsx',
    'stories/screens/auth-callback-screen.tsx',
    'stories/screens/sign-out-screen.tsx',
    'stories/screens/logout-callback-screen.tsx',
    'stories/screens/new-reading-screen.tsx',
    'stories/screens/reading-history-screen.tsx',
    'stories/screens/single-card-reading-screen.tsx'
];

const duplicatedScreenStylePattern =
    /\b(button|buttonText|primaryButton|signOutButton|signOutButtonText|disabledButton|pressed|mutedText|errorText)\s*:/;

const readingFiles = [
    'stories/organisms/new-reading-form.tsx',
    'stories/organisms/reading-history-list.tsx',
    'stories/screens/new-reading-screen.tsx',
    'stories/screens/reading-history-screen.tsx',
    'stories/screens/single-card-reading-screen.tsx',
    'stories/screens/single-card-result-screen.tsx',
    'stories/molecules/reading-list-card.tsx'
];

const readingPatterns = [
    [/<Pressable\b/, 'custom button bypasses the Button atom'],
    [/<TextInput\b/, 'custom input bypasses the Input atom'],
    [
        /\b(primaryButton|secondaryButton|disabledButton|primaryButtonText|secondaryButtonText|errorText)\s*:/,
        'custom control or feedback style remains'
    ],
    [
        /theme\.colors\.secondary\b/,
        'brown secondary token remains in reading text'
    ]
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

for (const path of readingFiles) {
    const absolutePath = resolve(packageRoot, path);

    if (!existsSync(absolutePath)) {
        continue;
    }

    const source = readFileSync(absolutePath, 'utf8');

    for (const [pattern, reason] of readingPatterns) {
        if (pattern.test(source)) {
            violations.add(`${path}: ${reason}`);
        }
    }
}

for (const absolutePath of collectSourceFiles(resolve(storiesRoot, 'screens'))) {
    const source = readFileSync(absolutePath, 'utf8');

    if (/<Pressable\b/.test(source)) {
        violations.add(
            `${relative(packageRoot, absolutePath)}: custom screen button bypasses the Button atom`
        );
    }
}

for (const path of screenStateFiles) {
    const absolutePath = resolve(packageRoot, path);

    if (!existsSync(absolutePath)) {
        continue;
    }

    const source = readFileSync(absolutePath, 'utf8');

    if (duplicatedScreenStylePattern.test(source)) {
        violations.add(`${path}: duplicated full-screen state style remains`);
    }

    if (!/<ScreenState\b/.test(source)) {
        violations.add(`${path}: screen does not compose ScreenState`);
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
