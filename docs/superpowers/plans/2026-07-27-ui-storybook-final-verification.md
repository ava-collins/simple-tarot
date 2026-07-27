# UI Storybook Final Verification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish the UI remediation with theme-owned fixtures, explicit story coverage, focused Storybook interaction tests, and representative real-browser verification.

**Architecture:** Keep production UI presentational and unchanged except for QuickNav's theme/style cleanup. Enforce the remediated Storybook contract with dependency-free source scripts, put behavioral assertions in co-located story `play` functions, and use Storybook's real browser runtime for representative rendering, interaction, and console checks.

**Tech Stack:** React 19, React Native Web, TypeScript 6, Storybook 10, `storybook/test`, Node.js ESM source guards, Yarn 4.

## Global Constraints

- Keep `packages/ui` presentational: no network requests, server actions, environment access, or app-specific data fetching.
- Preserve atom → molecule → organism → screen composition and retain `MobileView` around mobile screens.
- Ordinary controls, text, borders, and fixtures use existing black, white, and grey `theme.colors` tokens.
- Preserve fallback background gradients, tarot cards, card imagery, interpretation layouts, and other domain-specific visual colors.
- Preserve `theme.colors.secondary` where it belongs to tarot card-deck presentation.
- Add no dependency; use the installed Storybook testing APIs and dependency-free Node.js guards.
- Keep interaction tests behavioral: query accessible roles, labels, or existing test IDs, and do not assert internal styles or component structure.
- Keep reading-history cards display-only; test the existing empty-state Generate reading callback rather than adding a selection API.
- This is one repository checkpoint. Do not commit during its internal tasks; after all automated and browser verification, leave every change uncommitted for user validation and commit.

---

### Task 1: Add Failing Theme and Story-Coverage Guards

**Files:**
- Create: `packages/ui/scripts/check-story-coverage.mjs`
- Modify: `packages/ui/scripts/check-theme-color-usage.mjs`
- Modify: `packages/ui/package.json`

**Interfaces:**
- Consumes: Node.js `fs`, `path`, and `url` built-ins plus the existing co-located component/story/MDX layout.
- Produces: package command `yarn workspace @simpletarot/ui check-story-coverage`; an explicit `storyContract` manifest whose entries contain `component`, `story`, `docs`, and `variants`.

- [ ] **Step 1: Expand the theme guard targets before cleaning the sources**

Add these exact targets to `targetFiles` in
`packages/ui/scripts/check-theme-color-usage.mjs`:

```js
'../stories/atoms/background.stories.tsx',
'../stories/molecules/quick-nav.tsx',
'../stories/screens/account-screen.stories.tsx',
```

Keep the existing regex and existing reading targets unchanged. The background
component itself remains excluded because its fallback gradient literals are
intentional.

- [ ] **Step 2: Run the theme guard and verify the new targets fail**

Run:

```sh
yarn workspace @simpletarot/ui check-theme-colors
```

Expected: FAIL listing the `#fff`/`rgba(...)` Background fixture, the
black/white/`#000` QuickNav values, and the Account avatar fixture's `#333`.

- [ ] **Step 3: Create the explicit story contract**

Create `packages/ui/scripts/check-story-coverage.mjs` with this manifest and
validation shape:

```js
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const storyContract = [
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
        variants: ['Default', 'Generating', 'WithError', 'AuthLoading', 'SignedOut']
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
            violations.push(`${path}: required Storybook contract file is missing`);
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
            violations.push(`${entry.story}: required story ${variant} is missing`);
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
```

- [ ] **Step 4: Register and run the story guard red**

Insert this script in alphabetical order in `packages/ui/package.json`:

```json
"check-story-coverage": "node ./scripts/check-story-coverage.mjs",
```

Run:

```sh
yarn workspace @simpletarot/ui check-story-coverage
```

Expected: FAIL because `stories/molecules/quick-nav.stories.tsx` lacks an
explicit `tags: ['autodocs']`.

### Task 2: Clean the Remaining Theme Violations and Make Both Guards Green

**Files:**
- Modify: `packages/ui/stories/molecules/quick-nav.tsx`
- Modify: `packages/ui/stories/molecules/quick-nav.stories.tsx`
- Modify: `packages/ui/stories/molecules/quick-nav.mdx`
- Modify: `packages/ui/stories/screens/account-screen.stories.tsx`
- Modify: `packages/ui/stories/atoms/background.stories.tsx`

**Interfaces:**
- Consumes: existing `theme.colors.white`, `theme.colors.black`, and grey tokens.
- Produces: the same `QuickNavProps` and story variants; no production callback or layout contract changes.

- [ ] **Step 1: Tokenize QuickNav and move its wrapper style**

Change the React Native import and add the theme import:

```tsx
import { StyleSheet, View } from 'react-native';
import theme from '../utils/theme';
```

Replace the wrapper's inline object with `style={styles.container}` and replace
every named or hex color:

```tsx
<SpeedDial
    color={open ? theme.colors.white : theme.colors.black}
    isOpen={open}
    icon={{ name: 'navigation', color: theme.colors.white }}
    openIcon={{ name: 'close', color: theme.colors.black }}
    onOpen={() => setOpen(true)}
    onClose={() => setOpen(false)}
    testID="quick-nav-toggle">
    <SpeedDial.Action
        color={theme.colors.white}
        icon={{
            type: 'material-community',
            name: 'account-outline',
            color: theme.colors.black
        }}
        title="Profile"
        onPress={openProfile}
        testID="quick-nav-profile-action"
    />
    <SpeedDial.Action
        color={theme.colors.white}
        icon={{ name: 'history', color: theme.colors.black }}
        title="History"
        onPress={goToHistory}
        testID="quick-nav-history-action"
    />
    <SpeedDial.Action
        color={theme.colors.white}
        icon={{
            type: 'material-community',
            name: 'cards-outline',
            color: theme.colors.black
        }}
        title="New Reading"
        onPress={startNewReading}
        testID="quick-nav-new-reading-action"
    />
</SpeedDial>
```

Apply `theme.colors.white` and `theme.colors.black` identically to the History
and New Reading actions, then add:

```tsx
const styles = StyleSheet.create({
    container: {
        bottom: 0,
        position: 'absolute',
        right: 0
    }
});
```

- [ ] **Step 2: Make the QuickNav story explicitly documented**

Add visible default callbacks and autodocs:

```tsx
args: {
    onNewReadingPress: () => console.log('New reading pressed'),
    onProfilePress: () => console.log('Profile pressed'),
    onReadingHistoryPress: () => console.log('History pressed')
},
tags: ['autodocs']
```

Insert these properties in the existing `meta` object without changing its
title, component, documentation parameters, or viewport.

Update `quick-nav.mdx` with a `## Palette` section stating that the dial,
actions, and icons use the theme's black and white tokens.

- [ ] **Step 3: Tokenize the two story fixtures**

In `account-screen.stories.tsx`, import `theme` and change:

```tsx
borderColor: theme.colors.grey5
```

In `background.stories.tsx`, import `theme` and change:

```tsx
const styles = StyleSheet.create({
    text: {
        backgroundColor: theme.colors.grey5,
        borderRadius: 8,
        color: theme.colors.white,
        fontSize: 24,
        fontWeight: 'bold',
        padding: 12
    }
});
```

- [ ] **Step 4: Run both guards green**

Run:

```sh
yarn workspace @simpletarot/ui check-theme-colors
yarn workspace @simpletarot/ui check-story-coverage
```

Expected: both commands PASS.

### Task 3: Add Co-Located Atom and Molecule Interaction Tests

**Files:**
- Modify: `packages/ui/stories/atoms/button.stories.tsx`
- Modify: `packages/ui/stories/atoms/input.stories.tsx`
- Modify: `packages/ui/stories/atoms/feedback-text.stories.tsx`
- Modify: `packages/ui/stories/molecules/screen-state.stories.tsx`
- Modify: `packages/ui/stories/molecules/quick-nav.stories.tsx`
- Delete: `packages/ui/stories/tests/quick-nav.stories.tsx`

**Interfaces:**
- Consumes: `expect`, `fireEvent`, `fn`, `waitFor`, and Storybook play-context queries from `storybook/test`.
- Produces: focused `play` functions on existing named variants; production component interfaces remain unchanged.

- [ ] **Step 1: Add enabled and disabled Button behavior**

Import `expect` and `fn`, then make `Primary` and `Disabled` use isolated mock
callbacks:

```tsx
import { expect, fn } from 'storybook/test';

export const Primary: Story = {
    args: {
        onPress: fn()
    },
    play: async ({ args, canvas, userEvent }) => {
        await userEvent.click(canvas.getByRole('button', { name: 'Continue' }));
        await expect(args.onPress).toHaveBeenCalledTimes(1);
    }
};

export const Disabled: Story = {
    args: {
        disabled: true,
        onPress: fn()
    },
    play: async ({ args, canvas, userEvent }) => {
        const button = canvas.getByRole('button', { name: 'Continue' });
        await expect(button).toBeDisabled();
        await userEvent.click(button);
        await expect(args.onPress).not.toHaveBeenCalled();
    }
};
```

- [ ] **Step 2: Add Input text-entry behavior**

Import `expect` and `fn`, and update `Default`:

```tsx
export const Default: Story = {
    args: {
        onChangeText: fn()
    },
    play: async ({ args, canvas, userEvent }) => {
        const input = canvas.getByLabelText('Question');
        await userEvent.type(input, 'What should I notice?');
        await expect(args.onChangeText).toHaveBeenLastCalledWith(
            'What should I notice?'
        );
    }
};
```

If React Native Web reports incremental values, retain the public-behavior
assertion by checking the last call, not an exact total call count.

- [ ] **Step 3: Add the non-interactive FeedbackText assertion**

Import `expect` and update `Error`:

```tsx
export const Error: Story = {
    play: async ({ canvas }) => {
        await expect(
            canvas.getByText('Please review this message.')
        ).toBeVisible();
    }
};
```

Do not add a synthetic click to this non-interactive atom.

- [ ] **Step 4: Add ScreenState action behavior**

Import `expect` and `fn`. Give `ErrorStatusWithAction` an isolated callback and
click its public label:

```tsx
export const ErrorStatusWithAction: Story = {
    args: {
        action: {
            label: 'Try again',
            onPress: fn()
        },
        kind: 'status',
        message: 'Unable to continue.',
        tone: 'error'
    },
    play: async ({ args, canvas, userEvent }) => {
        await userEvent.click(
            canvas.getByRole('button', { name: 'Try again' })
        );

        if (!args.action) {
            throw new Error('ErrorStatusWithAction requires an action');
        }

        await expect(args.action.onPress).toHaveBeenCalledTimes(1);
    }
};
```

- [ ] **Step 5: Consolidate QuickNav behavior into its co-located story**

Add the existing `forceReloadDecorator`, testing imports, isolated `fn()`
callbacks, and a minimal play function to `Default`:

```tsx
import { expect, fireEvent, fn, waitFor } from 'storybook/test';
import { forceReloadDecorator } from '../tests/force-reload-decorator';

const meta: Meta<typeof QuickNav> = {
    title: 'Molecules/QuickNav',
    component: QuickNav,
    decorators: [forceReloadDecorator],
    parameters: {
        docs: {
            page: mdx,
            story: { height: '400px' }
        },
        viewport: { value: 'iphone14pro', isRotated: false }
    },
    tags: ['autodocs']
} satisfies Meta<typeof QuickNav>;

export const Default: Story = {
    args: {
        onNewReadingPress: fn(),
        onProfilePress: fn(),
        onReadingHistoryPress: fn()
    },
    play: async ({ args, canvas, step }) => {
        const toggle = canvas.getByTestId('quick-nav-toggle');

        await step('open the quick navigation', async () => {
            fireEvent.click(toggle);
            fireEvent.animationEnd(toggle);
            await waitFor(() =>
                expect(
                    canvas.getByTestId('quick-nav-profile-action')
                ).toBeVisible()
            );
        });

        await step('invoke an action and close', async () => {
            fireEvent.click(
                canvas.getByTestId('quick-nav-profile-action')
            );
            await expect(args.onProfilePress).toHaveBeenCalledTimes(1);
            await waitFor(() =>
                expect(
                    canvas.queryByTestId('quick-nav-profile-action')
                ).not.toBeVisible()
            );
        });
    }
};
```

Delete `stories/tests/quick-nav.stories.tsx` after this behavior is co-located.
Update QuickNav MDX's interaction section to refer to `Default` and the
open/action/close behavior rather than `QuickNavOpenTest`.

- [ ] **Step 6: Compile the interaction stories**

Run:

```sh
yarn workspace @simpletarot/ui build-types
yarn workspace @simpletarot/ui build-storybook
```

Expected: both commands PASS. If a query or Storybook type fails, use
`superpowers:systematic-debugging`, preserve the public behavior being tested,
and adjust only the test implementation.

### Task 4: Add Co-Located Screen and Reading-Tree Interaction Tests

**Files:**
- Modify: `packages/ui/stories/screens/account-screen.stories.tsx`
- Modify: `packages/ui/stories/screens/account-screen.mdx`
- Modify: `packages/ui/stories/screens/cognito-sign-in-screen.stories.tsx`
- Modify: `packages/ui/stories/screens/cognito-sign-in-screen.mdx`
- Modify: `packages/ui/stories/organisms/new-reading-form.stories.tsx`
- Modify: `packages/ui/stories/organisms/new-reading-form.mdx`
- Modify: `packages/ui/stories/organisms/reading-history-list.stories.tsx`
- Modify: `packages/ui/stories/organisms/reading-history-list.mdx`
- Modify: `packages/ui/stories/screens/single-card-reading-screen.stories.tsx`
- Modify: `packages/ui/stories/screens/single-card-reading-screen.mdx`
- Modify: `packages/ui/stories/screens/single-card-result-screen.stories.tsx`
- Modify: `packages/ui/stories/screens/single-card-result-screen.mdx`
- Delete: `packages/ui/stories/tests/account-screen.stories.tsx`
- Delete: `packages/ui/stories/tests/cognito-sign-in-screen.stories.tsx`

**Interfaces:**
- Consumes: existing callback props and accessible labels from atom-backed controls.
- Produces: behavior coverage for Account/Cognito, new reading, history empty state, reading retry, and result completion without adding production props.

- [ ] **Step 1: Consolidate Account behavior**

Import `expect` and `fn`. Replace the callback on `Default` with `fn()` and add:

```tsx
play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Sign in' }));
    await expect(args.onSignInPress).toHaveBeenCalledTimes(1);
}
```

Give `SignedIn` an isolated `onSignOutPress: fn()` and add a matching play
assertion for the `Sign out` button. Keep the Start a reading and Reading
history callbacks visible in its args.

Delete `stories/tests/account-screen.stories.tsx` because its visibility-only
coverage is subsumed. Update Account MDX to say the co-located Default and
SignedIn stories verify the corresponding callbacks.

- [ ] **Step 2: Consolidate Cognito behavior**

Import `expect` and `fn`. Give `Default` an `onContinuePress: fn()` and add:

```tsx
play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(
        canvas.getByRole('button', { name: 'Continue' })
    );
    await expect(args.onContinuePress).toHaveBeenCalledTimes(1);
}
```

Give `NotReady` its own `fn()` and add a disabled/no-callback assertion:

```tsx
play: async ({ args, canvas, userEvent }) => {
    const button = canvas.getByRole('button', { name: 'Continue' });
    await expect(button).toBeDisabled();
    await userEvent.click(button);
    await expect(args.onContinuePress).not.toHaveBeenCalled();
}
```

Keep Loading and WithError as visual states. Delete
`stories/tests/cognito-sign-in-screen.stories.tsx` and update the Cognito MDX
interaction section to describe the co-located callback and disabled tests.

- [ ] **Step 3: Test NewReadingForm submission**

Import `expect` and `fn`. Give `EmptyForm` its own `onGeneratePress: fn()` while
preserving the other base args:

```tsx
export const EmptyForm: Story = {
    args: {
        ...baseArgs,
        isGenerating: false,
        latestReading: null,
        onGeneratePress: fn()
    },
    play: async ({ args, canvas, userEvent }) => {
        await userEvent.type(
            canvas.getByLabelText('Question'),
            'What should I notice today?'
        );
        await userEvent.click(
            canvas.getByRole('button', { name: 'Generate reading' })
        );
        await expect(args.onGeneratePress).toHaveBeenCalledWith(
            'What should I notice today?'
        );
    }
};
```

Document this behavior in `new-reading-form.mdx`.

- [ ] **Step 4: Test the existing history empty-state action**

Import `expect` and `fn`. Give `Empty` an isolated
`onCreateReadingPress: fn()` and add:

```tsx
play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(
        canvas.getByRole('button', { name: 'Generate reading' })
    );
    await expect(args.onCreateReadingPress).toHaveBeenCalledTimes(1);
}
```

Document in `reading-history-list.mdx` that saved-reading cards are
display-only and the empty-state action is the tested interactive contract.

- [ ] **Step 5: Test reading retry**

Import `expect` and `fn`. Override `onStart` in `WithError` and add:

```tsx
export const WithError: Story = {
    args: {
        ...baseArgs,
        error: 'Unable to draw a card.',
        onStart: fn()
    },
    play: async ({ args, canvas, userEvent }) => {
        await userEvent.click(
            canvas.getByRole('button', { name: 'Try again' })
        );
        await expect(args.onStart).toHaveBeenCalledTimes(1);
    }
};
```

Document the retry callback assertion in `single-card-reading-screen.mdx`.

- [ ] **Step 6: Test result completion**

Import `expect` and `fn`. Override `onDonePress` in `Default` and add:

```tsx
export const Default: Story = {
    args: {
        ...baseArgs,
        onDonePress: fn()
    },
    play: async ({ args, canvas, userEvent }) => {
        await userEvent.click(
            canvas.getByRole('button', { name: 'Done' })
        );
        await expect(args.onDonePress).toHaveBeenCalledTimes(1);
    }
};
```

Document the Done callback assertion in `single-card-result-screen.mdx`.

- [ ] **Step 7: Compile and build all focused stories**

Run:

```sh
yarn workspace @simpletarot/ui check-story-coverage
yarn workspace @simpletarot/ui build-types
yarn workspace @simpletarot/ui build-storybook
```

Expected: all commands PASS and the deleted legacy test stories are not needed
for the Storybook build.

### Task 5: Document and Perform Final Automated and Browser Verification

**Files:**
- Modify: `packages/ui/README.md`
- Modify: `README.md`
- Verify: all files changed in Tasks 1–4

**Interfaces:**
- Consumes: the three UI guards, Storybook index, co-located play functions, and Chrome DevTools browser control.
- Produces: durable validation commands and a user-verifiable uncommitted checkpoint.

- [ ] **Step 1: Update durable UI validation guidance**

Update `packages/ui/README.md` so its Validation command block is:

```sh
yarn workspace @simpletarot/ui check-theme-colors
yarn workspace @simpletarot/ui check-ui-atoms
yarn workspace @simpletarot/ui check-story-coverage
yarn workspace @simpletarot/ui build-types
yarn workspace @simpletarot/ui build-storybook
yarn lint
```

State immediately below it:

- focused interaction coverage lives in co-located Storybook `play` functions;
- representative changes should be smoke-tested in the running Storybook with
  browser-console review; and
- fallback background gradients and tarot/card visuals are intentional domain
  exceptions, while ordinary controls, text, borders, and fixtures must use
  theme tokens.

Add the implementation-plan link below the final-verification design in the
root README:

```md
-   [UI Storybook Final Verification Implementation Plan](./docs/superpowers/plans/2026-07-27-ui-storybook-final-verification.md) — checkpoint plan for remaining theme cleanup, explicit story coverage, focused interaction tests, browser smoke verification, and repository validation
```

- [ ] **Step 2: Review multiple TSX edits against React guidance**

Use `vercel:react-best-practices` and inspect the changed stories and QuickNav.
Confirm that:

- mocks remain story-only;
- no production component gains test-only state or props;
- play functions use stable public queries; and
- no unnecessary render-time work or effects were introduced.

Apply any required corrections before verification.

- [ ] **Step 3: Run the full automated sequence**

Run:

```sh
yarn install --immutable
yarn workspace @simpletarot/ui check-theme-colors
yarn workspace @simpletarot/ui check-ui-atoms
yarn workspace @simpletarot/ui check-story-coverage
yarn workspace @simpletarot/ui build-types
yarn workspace @simpletarot/ui build-storybook
yarn lint
git diff --check
```

Expected: every command exits zero. Use `superpowers:systematic-debugging` for
any unexpected failure and rerun the failing command plus the complete
sequence after the fix.

- [ ] **Step 4: Launch Storybook and resolve exact story IDs**

Read and follow `chrome-devtools-mcp:chrome-devtools`, then start the server:

```sh
yarn workspace @simpletarot/ui exec storybook dev -p 6006 --ci
```

Keep the process running in its PTY session. Fetch
`http://localhost:6006/index.json` and resolve exact IDs for:

- Button Primary and Disabled;
- Input Default;
- FeedbackText Error;
- ScreenState ErrorStatusWithAction;
- QuickNav Default;
- Account Default or SignedOutWithError and Cognito NotReady;
- NewReadingForm EmptyForm;
- ReadingHistoryList Empty;
- SingleCardReadingScreen WithError; and
- SingleCardResultScreen Default and Reversed.

Do not guess IDs when the Storybook index supplies them.

- [ ] **Step 5: Execute the real-browser smoke and play checks**

Using Chrome DevTools, navigate to each representative Storybook story. For
each:

1. wait for the story root to render;
2. confirm the expected label or text is visible;
3. allow its co-located `play` function to complete;
4. confirm no Storybook error overlay is present; and
5. inspect new browser-console entries for unexpected errors.

For QuickNav, also manually click the toggle, confirm Profile/History/New
Reading actions appear, close the dial, and confirm the actions disappear.
Reopen it and invoke Profile to confirm the callback path and close behavior.

Expected: all representative stories render, focused plays complete, QuickNav
opens/closes, and no unexpected story-attributable console errors appear.

- [ ] **Step 6: Stop Storybook and perform completion verification**

Send Ctrl-C to the Storybook PTY, then use
`superpowers:verification-before-completion` and run:

```sh
git status --short
git diff --stat
git diff --check
```

Expected: only the checkpoint's intended files are modified/deleted/created,
the implementation plan remains ignored unless force-added later, and the diff
check passes.

- [ ] **Step 7: Manual verification and explicit stop**

Leave all checkpoint changes uncommitted. Ask the user to:

1. run `yarn workspace @simpletarot/ui storybook`;
2. review QuickNav, Account/Cognito, New Reading, Reading History, and
   Single-card Result in the iPhone viewport;
3. exercise QuickNav and the representative action stories; and
4. confirm the monotone controls/fixtures and preserved tarot visuals.

Stop. Do not commit or start any follow-up checkpoint until the user confirms
manual validation, confirms their checkpoint commit, and explicitly
authorizes continuation.
