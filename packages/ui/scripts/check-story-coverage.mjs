import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const storyContract = [
    {
        component: 'stories/atoms/avatar-display.tsx',
        story: 'stories/atoms/avatar-display.stories.tsx',
        docs: 'stories/atoms/avatar-display.mdx',
        variants: [
            'DefaultAvatarImage',
            'CustomNumericSize',
            'PressCallbacks'
        ]
    },
    {
        component: 'stories/atoms/button.tsx',
        story: 'stories/atoms/button.stories.tsx',
        docs: 'stories/atoms/button.mdx',
        variants: ['Primary', 'Secondary', 'Muted', 'Compact', 'Disabled']
    },
    {
        component: 'stories/atoms/input.tsx',
        story: 'stories/atoms/input.stories.tsx',
        docs: 'stories/atoms/input.mdx',
        variants: ['Default', 'Error', 'Password', 'Multiline', 'Disabled']
    },
    {
        component: 'stories/atoms/feedback-text.tsx',
        story: 'stories/atoms/feedback-text.stories.tsx',
        docs: 'stories/atoms/feedback-text.mdx',
        variants: ['Error', 'Success', 'Warning', 'Muted', 'Empty']
    },
    {
        component: 'stories/molecules/input-field.tsx',
        story: 'stories/molecules/input-field.stories.tsx',
        docs: 'stories/molecules/input-field.mdx',
        variants: ['Default', 'Error']
    },
    {
        component: 'stories/molecules/screen-state.tsx',
        story: 'stories/molecules/screen-state.stories.tsx',
        docs: 'stories/molecules/screen-state.mdx',
        variants: [
            'LoadingStatus',
            'ErrorStatusWithAction',
            'Prompt',
            'PromptWithFeedback',
            'PromptWithDisabledAction'
        ]
    },
    {
        component: 'stories/molecules/reading-list-card.tsx',
        story: 'stories/molecules/reading-list-card.stories.tsx',
        docs: 'stories/molecules/reading-list-card.mdx',
        variants: ['Default', 'WithoutQuestion']
    },
    {
        component: 'stories/molecules/quick-nav.tsx',
        story: 'stories/molecules/quick-nav.stories.tsx',
        docs: 'stories/molecules/quick-nav.mdx',
        variants: ['Default']
    },
    {
        component: 'stories/organisms/login-form.tsx',
        story: 'stories/organisms/login-form.stories.tsx',
        docs: 'stories/organisms/login-form.mdx',
        variants: ['Default', 'WithError', 'Loading', 'WithAuthError']
    },
    {
        component: 'stories/organisms/signup-form.tsx',
        story: 'stories/organisms/signup-form.stories.tsx',
        docs: 'stories/organisms/signup-form.mdx',
        variants: [
            'Default',
            'WithEmailError',
            'WithPasswordError',
            'WithConfirmPasswordError',
            'CreatingAccount',
            'AwaitingVerification',
            'VerifyingAccount'
        ]
    },
    {
        component: 'stories/organisms/forgot-password-form.tsx',
        story: 'stories/organisms/forgot-password.stories.tsx',
        docs: 'stories/organisms/forgot-password-form.mdx',
        variants: ['Default', 'WithEmailError']
    },
    {
        component: 'stories/organisms/reading-history-list.tsx',
        story: 'stories/organisms/reading-history-list.stories.tsx',
        docs: 'stories/organisms/reading-history-list.mdx',
        variants: ['Populated', 'Empty', 'LoadingEmpty']
    },
    {
        component: 'stories/organisms/new-reading-form.tsx',
        story: 'stories/organisms/new-reading-form.stories.tsx',
        docs: 'stories/organisms/new-reading-form.mdx',
        variants: ['EmptyForm', 'Generating', 'LatestResult', 'WithError']
    },
    {
        component: 'stories/organisms/user-account.tsx',
        story: 'stories/organisms/user-account.stories.tsx',
        docs: 'stories/organisms/user-account.mdx',
        variants: ['Default', 'Anonymous']
    },
    {
        component: 'stories/screens/account-screen.tsx',
        story: 'stories/screens/account-screen.stories.tsx',
        docs: 'stories/screens/account-screen.mdx',
        variants: [
            'Default',
            'SignedIn',
            'SignedInWithAvatarSlot',
            'Loading',
            'SignedOutWithError'
        ]
    },
    {
        component: 'stories/screens/cognito-sign-in-screen.tsx',
        story: 'stories/screens/cognito-sign-in-screen.stories.tsx',
        docs: 'stories/screens/cognito-sign-in-screen.mdx',
        variants: ['Default', 'NotReady', 'Loading', 'WithError']
    },
    {
        component: 'stories/screens/auth-callback-screen.tsx',
        story: 'stories/screens/auth-callback-screen.stories.tsx',
        docs: 'stories/screens/auth-callback-screen.mdx',
        variants: ['Loading', 'Success', 'WithError']
    },
    {
        component: 'stories/screens/sign-out-screen.tsx',
        story: 'stories/screens/sign-out-screen.stories.tsx',
        docs: 'stories/screens/sign-out-screen.mdx',
        variants: ['Default']
    },
    {
        component: 'stories/screens/logout-callback-screen.tsx',
        story: 'stories/screens/logout-callback-screen.stories.tsx',
        docs: 'stories/screens/logout-callback-screen.mdx',
        variants: ['Default']
    },
    {
        component: 'stories/screens/new-reading-screen.tsx',
        story: 'stories/screens/new-reading-screen.stories.tsx',
        docs: 'stories/screens/new-reading-screen.mdx',
        variants: [
            'EmptyForm',
            'Generating',
            'LatestResult',
            'WithError',
            'AuthLoading',
            'SignedOut'
        ]
    },
    {
        component: 'stories/screens/reading-history-screen.tsx',
        story: 'stories/screens/reading-history-screen.stories.tsx',
        docs: 'stories/screens/reading-history-screen.mdx',
        variants: [
            'PopulatedHistory',
            'EmptyHistory',
            'HistoryError',
            'AuthLoading',
            'SignedOut'
        ]
    },
    {
        component: 'stories/screens/single-card-reading-screen.tsx',
        story: 'stories/screens/single-card-reading-screen.stories.tsx',
        docs: 'stories/screens/single-card-reading-screen.mdx',
        variants: [
            'Default',
            'Generating',
            'WithError',
            'AuthLoading',
            'SignedOut'
        ]
    },
    {
        component: 'stories/screens/single-card-result-screen.tsx',
        story: 'stories/screens/single-card-result-screen.stories.tsx',
        docs: 'stories/screens/single-card-result-screen.mdx',
        variants: ['Default', 'Reversed', 'LongText']
    }
];

const violations = [];
const exportedStoryPattern = /export const\s+([A-Za-z_$][\w$]*)\s*:/g;
const autodocsPattern = /tags\s*:\s*\[\s*['"]autodocs['"]\s*\]/;

for (const entry of storyContract) {
    for (const path of [entry.component, entry.story, entry.docs]) {
        if (!existsSync(resolve(packageRoot, path))) {
            violations.push(
                `${path}: required Storybook contract file is missing`
            );
        }
    }

    const storyPath = resolve(packageRoot, entry.story);

    if (!existsSync(storyPath)) {
        continue;
    }

    const source = readFileSync(storyPath, 'utf8');
    const exports = new Set(
        Array.from(source.matchAll(exportedStoryPattern), match => match[1])
    );

    for (const variant of entry.variants) {
        if (!exports.has(variant)) {
            violations.push(
                `${entry.story}: required story ${variant} is missing`
            );
        }
    }

    if (!autodocsPattern.test(source)) {
        violations.push(`${entry.story}: explicit autodocs tag is missing`);
    }
}

if (violations.length > 0) {
    console.error('Storybook coverage check failed:');
    violations.sort().forEach(violation => console.error(`- ${violation}`));
    process.exitCode = 1;
} else {
    console.log('Storybook coverage check passed.');
}
