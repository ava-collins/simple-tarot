# UI Monochrome Palette Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:executing-plans` to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace beige and brown literals in the newer reading UI with the
existing black, white, and grey theme tokens while preserving semantic status
colors and all component behavior.

**Architecture:** Keep the existing `theme.colors` object as the sole color
boundary for the targeted components. Add a dependency-free source guard to
the UI workspace, prove it fails against the current literals, replace those
literals with the approved token mapping, and keep the affected Storybook
documentation aligned with the resulting contract.

**Tech Stack:** React Native, TypeScript, Storybook 10 with React Native Web and
Vite, Yarn 4, Node.js ESM.

## Global Constraints

- Neutral surfaces, text, borders, icons, and actions use only existing black,
  white, and grey values exposed through `theme.colors`.
- `theme.colors.error`, `theme.colors.success`, and `theme.colors.warning`
  remain unchanged.
- Do not add palette values or semantic aliases in this checkpoint.
- Do not replace `Pressable`, `TextInput`, or feedback text with atoms in this
  checkpoint.
- Preserve component props, callbacks, state behavior, layout, typography,
  scrolling, and card orientation.
- Keep `packages/ui` presentational and keep every screen wrapped in
  `MobileView`.
- Update or newly verify every co-located story for a changed UI component.
- Leave the checkpoint uncommitted after automated verification. The user
  performs manual verification and creates the checkpoint commit.

---

## Checkpoint 1: Adopt the Existing Monochrome Theme

### Task 1: Add and prove the targeted palette guard

**Files:**

- Create: `packages/ui/scripts/check-theme-color-usage.mjs`
- Modify: `packages/ui/package.json`

**Interfaces:**

- Produces the UI workspace command
  `yarn workspace @simpletarot/ui check-theme-colors`.
- The command exits `0` when no targeted file contains a hexadecimal,
  `rgb(...)`, `rgba(...)`, or named black/white/red/grey/gray/brown/beige color
  literal.
- The command exits `1` and prints every file, line number, and source line
  containing a forbidden literal.
- No runtime dependencies or exported application interfaces are added.

- [ ] **Step 1: Create the source guard**

Create `packages/ui/scripts/check-theme-color-usage.mjs`:

```js
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const targetFiles = [
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
```

- [ ] **Step 2: Expose the guard through the UI workspace**

Add this alphabetized script to `packages/ui/package.json`:

```json
"check-theme-colors": "node ./scripts/check-theme-color-usage.mjs"
```

- [ ] **Step 3: Run the guard and verify the RED state**

Run:

```sh
yarn workspace @simpletarot/ui check-theme-colors
```

Expected: FAIL with exit code `1`. Output must identify literals in all five
targeted components, including `#F7F3EA` in `new-reading-screen.tsx`,
`#8F2D2D` in `single-card-reading-screen.tsx`, `#765B2B` in
`single-card-result-screen.tsx`, `#8A8172` in `new-reading-form.tsx`, and
`#39342C` in `reading-list-card.tsx`.

Do not proceed if the command passes or fails for a file-system, syntax, or
path error. Correct the guard until it fails specifically on the current color
literals.

### Task 2: Replace targeted literals with approved theme tokens

**Files:**

- Modify: `packages/ui/stories/screens/new-reading-screen.tsx`
- Modify: `packages/ui/stories/screens/single-card-reading-screen.tsx`
- Modify: `packages/ui/stories/screens/single-card-result-screen.tsx`
- Modify: `packages/ui/stories/organisms/new-reading-form.tsx`
- Modify: `packages/ui/stories/molecules/reading-list-card.tsx`

**Interfaces:**

- Consumes the unchanged default `theme` export from
  `packages/ui/stories/utils/theme.tsx`.
- Produces no new props, exports, states, callbacks, or runtime behavior.
- Applies this exact mapping:

| Existing visual role | Replacement |
| --- | --- |
| `#F7F3EA` page background | `theme.colors.grey0` |
| `#FFFDF8` elevated/input/card surface or action text | `theme.colors.white` |
| `#1B1A18` primary text | `theme.colors.primary` |
| `#1B1A18` primary action background | `theme.colors.black` |
| `#39342C` body or summary text | `theme.colors.grey5` |
| `#6C665B` muted text | `theme.colors.grey4` |
| `#8A8172` placeholder text | `theme.colors.grey4` |
| `#765B2B` eyebrow or position text | `theme.colors.grey5` |
| `#D9CBAE` or `#B9A77F` border | `theme.colors.greyOutline` |
| `#8F2D2D` error text | `theme.colors.error` |

- [ ] **Step 1: Update `NewReadingScreen`**

Import `theme` from `../utils/theme`, then replace:

```tsx
backgroundColor: theme.colors.grey0
color: theme.colors.primary
color: theme.colors.grey5
color: theme.colors.grey4
backgroundColor: theme.colors.black
color: theme.colors.white
```

for the `centered`, `title`, `body`, `mutedText`, `primaryButton`, and
`primaryButtonText` roles respectively. Do not change any non-color style.

- [ ] **Step 2: Update `SingleCardReadingScreen`**

Import `theme` from `../utils/theme`, then map:

```tsx
centered.backgroundColor -> theme.colors.grey0
title.color -> theme.colors.primary
body.color -> theme.colors.grey5
mutedText.color -> theme.colors.grey4
errorText.color -> theme.colors.error
primaryButton.backgroundColor -> theme.colors.black
primaryButtonText.color -> theme.colors.white
```

Do not change branch ordering, copy, or callbacks.

- [ ] **Step 3: Finish `SingleCardResultScreen`**

Preserve the committed `theme` import, `screen.backgroundColor`, and
`secondaryButton.borderColor` changes. Map the remaining roles:

```tsx
eyebrow.color -> theme.colors.grey5
title.color -> theme.colors.primary
body.color -> theme.colors.grey5
summaryText.color -> theme.colors.grey5
primaryButton.backgroundColor -> theme.colors.black
primaryButtonText.color -> theme.colors.white
secondaryButtonText.color -> theme.colors.primary
```

Do not change card sizing, rotation, scroll layout, or optional action logic.

- [ ] **Step 4: Update `NewReadingForm`**

Import `theme` from `../utils/theme`. Apply:

```tsx
placeholderTextColor={theme.colors.grey4}
screen.backgroundColor -> theme.colors.grey0
eyebrow.color -> theme.colors.grey5
title.color -> theme.colors.primary
body.color -> theme.colors.grey5
label.color -> theme.colors.primary
input.backgroundColor -> theme.colors.white
input.borderColor -> theme.colors.greyOutline
input.color -> theme.colors.primary
errorText.color -> theme.colors.error
primaryButton.backgroundColor -> theme.colors.black
primaryButtonText.color -> theme.colors.white
secondaryButton.borderColor -> theme.colors.greyOutline
secondaryButtonText.color -> theme.colors.primary
resultCard.backgroundColor -> theme.colors.white
resultCard.borderColor -> theme.colors.greyOutline
resultTitle.color -> theme.colors.primary
summaryText.color -> theme.colors.grey5
positionTitle.color -> theme.colors.grey5
```

Do not alter question state, submission behavior, result rendering, or button
implementation.

- [ ] **Step 5: Update `ReadingListCard`**

Replace only:

```tsx
summaryText.color -> theme.colors.grey5
```

Keep its existing theme-backed surface, border, title, and metadata colors.

- [ ] **Step 6: Run the guard and verify the GREEN state**

Run:

```sh
yarn workspace @simpletarot/ui check-theme-colors
```

Expected: PASS with exit code `0` and no output.

### Task 3: Align stories and durable UI documentation

**Files:**

- Modify: `packages/ui/stories/screens/new-reading-screen.stories.tsx`
- Modify: `packages/ui/stories/screens/single-card-reading-screen.stories.tsx`
- Modify: `packages/ui/stories/screens/single-card-result-screen.stories.tsx`
- Modify: `packages/ui/stories/organisms/new-reading-form.stories.tsx`
- Modify: `packages/ui/stories/molecules/reading-list-card.stories.tsx`
- Modify: `packages/ui/stories/screens/new-reading-screen.mdx`
- Modify: `packages/ui/stories/screens/single-card-reading-screen.mdx`
- Modify: `packages/ui/stories/screens/single-card-result-screen.mdx`
- Modify: `packages/ui/stories/organisms/new-reading-form.mdx`
- Modify: `packages/ui/stories/molecules/reading-list-card.mdx`
- Modify: `packages/ui/README.md`

**Interfaces:**

- Story args, component props, viewport settings, callbacks, and visible states
  remain unchanged.
- Each affected story meta documents that neutral presentation uses
  `theme.colors`.
- Each affected MDX page states the relevant monochrome palette
  responsibility.
- `packages/ui/README.md` becomes the durable package-level color contract.

- [ ] **Step 1: Update the five story metadata objects**

In each affected `*.stories.tsx`, add this entry beside the existing `page`
entry in `parameters.docs`:

```tsx
description: {
    component:
        'Neutral presentation uses the shared black, white, and grey theme tokens; status feedback uses its semantic theme color.'
}
```

Retain each story's existing title, args, viewport, layout, MDX page, and
callback examples.

- [ ] **Step 2: Add a Palette section to each affected MDX page**

Add this section before `Props` or `Responsibilities`, whichever appears
first:

```mdx
## Palette

Neutral surfaces, text, borders, and actions use the shared black, white, and
grey values from `theme.colors`. Status feedback retains its semantic theme
color.
```

Do not duplicate component behavior documentation or change rendered canvases.

- [ ] **Step 3: Document the package-level color contract**

Add a `### Design-system colors` subsection under `## Components` in
`packages/ui/README.md`:

```md
### Design-system colors

Components consume colors through `stories/utils/theme.tsx`. Neutral
presentation uses the theme's black, white, and grey tokens; errors, success,
and warnings use their semantic theme tokens. Component-level color literals
are not part of the UI contract.
```

### Task 4: Run automated verification and stop

**Files:**

- Verify only; do not create a commit.

**Interfaces:**

- Produces a checkpoint ready for user-run manual Storybook validation.
- Does not authorize checkpoint 2.

- [ ] **Step 1: Verify the workspace manifest remains immutable**

Run:

```sh
yarn install --immutable --mode=skip-build
```

Expected: PASS with exit code `0` and no lockfile changes.

- [ ] **Step 2: Run the targeted palette guard**

Run:

```sh
yarn workspace @simpletarot/ui check-theme-colors
```

Expected: PASS with exit code `0`.

- [ ] **Step 3: Run UI type checking**

Run:

```sh
yarn workspace @simpletarot/ui build-types
```

Expected: PASS with exit code `0`.

- [ ] **Step 4: Build Storybook**

Run:

```sh
yarn workspace @simpletarot/ui build-storybook
```

Expected: PASS with exit code `0`. Report warnings separately; do not describe
warnings as failures unless the command exits nonzero or the built stories are
unusable.

- [ ] **Step 5: Run repository lint**

Run:

```sh
yarn lint
```

Expected: PASS with exit code `0`.

- [ ] **Step 6: Check patch hygiene and scope**

Run:

```sh
git diff --check
git status --short
git diff -- packages/ui README.md docs/superpowers
```

Expected: `git diff --check` passes. The status and diff contain only the
checkpoint files listed above plus this implementation plan. No lockfile,
generated Storybook build, unrelated application, or infrastructure changes
remain.

- [ ] **Step 7: Stop for manual verification**

Leave every checkpoint change uncommitted. Ask the user to run Storybook and
inspect:

- New Reading: signed out, empty form, generating, error, and latest result;
- Single Card Reading: signed out, generating, error, and default;
- Single Card Result: default, reversed, and long text; and
- Reading History: populated, empty, loading, and error.

The user confirms the monochrome appearance, semantic error color, visual
separation, unchanged layout/behavior, and checkpoint commit before
authorizing checkpoint 2.

