import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const targetFiles = [
    '../stories/atoms/background.stories.tsx',
    '../stories/molecules/quick-nav.tsx',
    '../stories/screens/account-screen.stories.tsx',
    '../stories/screens/new-reading-screen.tsx',
    '../stories/screens/single-card-reading-screen.tsx',
    '../stories/screens/single-card-result-screen.tsx',
    '../stories/organisms/new-reading-form.tsx',
    '../stories/molecules/reading-list-card.tsx'
];

const forbiddenColorLiteral =
    /#[0-9a-f]{3,8}\b|rgba?\s*\(|(['"`])(?:black|white|red|gr[ae]y|brown|beige)\1/i;

const violations = targetFiles.flatMap(relativePath => {
    const fileUrl = new URL(relativePath, import.meta.url);
    const filePath = fileURLToPath(fileUrl);

    return readFileSync(fileUrl, 'utf8')
        .split('\n')
        .flatMap((line, index) =>
            forbiddenColorLiteral.test(line)
                ? [`${filePath}:${index + 1}: ${line.trim()}`]
                : []
        );
});

if (violations.length > 0) {
    console.error('Theme color literals found in targeted UI components:');
    console.error(violations.join('\n'));
    process.exitCode = 1;
}
