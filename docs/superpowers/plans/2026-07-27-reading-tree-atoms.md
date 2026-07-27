# Reading Tree Atom Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace custom reading/history/result controls and feedback with the generic design-system atoms while retaining tarot-specific composition, behavior, and component interfaces.

**Architecture:** The existing reading organisms and screens import `Button`, `Input`, and `FeedbackText` directly and use local `View` wrappers only for layout. The UI source guard gains a targeted reading-tree policy that prevents direct generic control recreation and brown text without restricting the card-deck interaction reserved for `NewReading`.

**Tech Stack:** React 19, React Native 0.86, TypeScript 6, Storybook 10, Node.js ESM, Yarn 4

## Global Constraints

- Do not change reading component props, callbacks, data contracts, package exports, or navigation behavior.
- Do not add an atom variant, style prop, color prop, or compatibility wrapper.
- Keep `Card`, `CardDeck`, `Background`, `StartArrow`, `NewReading`, reading-result containers, and pull-to-refresh behavior unchanged.
- Use `Button` for generic actions, `Input` for question entry, and `FeedbackText` for errors and transient loading/status copy.
- Keep headings, explanatory copy, reading interpretations, metadata, and card labels as ordinary `Text`.
- Use black, white, and grey theme tokens for neutral text; do not use `theme.colors.secondary` in targeted reading files.
- Do not extract shared screen-state composition; that belongs to checkpoint 4.
- Every changed component must have its co-located Storybook story and MDX page updated or explicitly verified.
- Leave the completed checkpoint uncommitted for user validation.

---

### Task 1: Extend the UI atom source guard

**Files:**
- Modify: `packages/ui/scripts/check-ui-atom-usage.mjs`

**Interfaces:**
- Consumes: the existing `check-ui-atoms` command
- Produces: targeted reading-tree violations without scanning `organisms/new-reading.tsx`

- [ ] **Step 1: Add the reading target list and rules**

Add:

```js
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
```

For every existing target, read its source and add
`${path}: ${reason}` for every matching rule. Keep the current legacy-file,
legacy-name, atom-color, and style-escape checks unchanged.

- [ ] **Step 2: Run the guard and verify the red state**

Run:

```sh
yarn workspace @simpletarot/ui check-ui-atoms
```

Expected: exit 1 with custom button violations in all six control-owning
files, the custom input violation in `new-reading-form.tsx`, control/feedback
style violations, and secondary-token violations in
`reading-history-screen.tsx` and `reading-list-card.tsx`.

- [ ] **Step 3: Review the guard boundary**

Confirm `organisms/new-reading.tsx` is absent from `readingFiles`, every
message includes a package-relative path, and the script remains
dependency-free.

---

### Task 2: Migrate the reading form and history list

**Files:**
- Modify: `packages/ui/stories/organisms/new-reading-form.tsx`
- Modify: `packages/ui/stories/organisms/new-reading-form.stories.tsx`
- Modify: `packages/ui/stories/organisms/new-reading-form.mdx`
- Modify: `packages/ui/stories/organisms/reading-history-list.tsx`
- Modify: `packages/ui/stories/organisms/reading-history-list.stories.tsx`
- Modify: `packages/ui/stories/organisms/reading-history-list.mdx`

**Interfaces:**
- Consumes: `Button`, `Input`, and `FeedbackText` from `../atoms/*`
- Preserves: `NewReadingFormProps` and `ReadingHistoryListProps` exactly

- [ ] **Step 1: Replace `NewReadingForm` header controls**

Remove `Pressable` and `TextInput` imports. Render the header as:

```tsx
<View style={styles.header}>
    <Button
        label="Back"
        onPress={onBackPress}
        size="compact"
        variant="secondary"
    />
    <Button
        label="History"
        onPress={onHistoryPress}
        size="compact"
        variant="secondary"
    />
</View>
```

Keep the header flex layout and remove only obsolete local control styles.

- [ ] **Step 2: Replace question input, error, and generation control**

Inside `formSection`, render:

```tsx
<Input
    label="Question"
    multiline
    onChangeText={setQuestion}
    placeholder="What should I notice today?"
    value={question}
/>
<FeedbackText>{error}</FeedbackText>
<Button
    disabled={isGenerating}
    label={isGenerating ? 'Generating...' : 'Generate reading'}
    onPress={generateReading}
/>
```

Retain `generateReading`, its await, and the subsequent `setQuestion('')`.
Delete `label`, `input`, `errorText`, button, disabled, and pressed styles.
Do not alter latest-reading rendering or styles.

- [ ] **Step 3: Replace the history empty-state control**

In `ReadingHistoryList`, remove `Pressable` and replace its custom action with:

```tsx
<Button
    label="Generate reading"
    onPress={onCreateReadingPress}
/>
```

Delete only `primaryButton`, `primaryButtonText`, and `pressed`; retain the
empty message, scroll container, refresh control, and card mapping.

- [ ] **Step 4: Update stories and MDX**

Add `tags: ['autodocs']` to both story metas. Preserve every existing story
and arg. Update MDX to state:

- `NewReadingForm` uses compact secondary Buttons for navigation, multiline
  Input for the question, FeedbackText for errors, and a standard Button for
  generation.
- `ReadingHistoryList` uses a standard Button only in the empty state and
  retains native pull-to-refresh.

Do not add a new behavior state.

- [ ] **Step 5: Run focused type generation**

Run:

```sh
yarn workspace @simpletarot/ui build-types
```

Expected: exit 0.

---

### Task 3: Migrate reading screen state controls and feedback

**Files:**
- Modify: `packages/ui/stories/screens/new-reading-screen.tsx`
- Modify: `packages/ui/stories/screens/new-reading-screen.stories.tsx`
- Modify: `packages/ui/stories/screens/new-reading-screen.mdx`
- Modify: `packages/ui/stories/screens/reading-history-screen.tsx`
- Modify: `packages/ui/stories/screens/reading-history-screen.stories.tsx`
- Modify: `packages/ui/stories/screens/reading-history-screen.mdx`
- Modify: `packages/ui/stories/screens/single-card-reading-screen.tsx`
- Modify: `packages/ui/stories/screens/single-card-reading-screen.stories.tsx`
- Modify: `packages/ui/stories/screens/single-card-reading-screen.mdx`

**Interfaces:**
- Consumes: `Button` and `FeedbackText`
- Preserves: all three screen prop interfaces and their state precedence

- [ ] **Step 1: Migrate `NewReadingScreen`**

Remove `Pressable`. In the auth-loading branch, wrap:

```tsx
<FeedbackText tone="muted">Checking session...</FeedbackText>
```

in a `status` View with `alignItems: 'center'`. In the signed-out branch,
replace the Sign In control with a standard primary `Button`. Keep the
signed-in `KeyboardAvoidingView` and form unchanged. Delete obsolete
`mutedText`, button-text, button, and pressed styles; add:

```ts
action: { alignSelf: 'stretch' },
status: { alignItems: 'center' }
```

Use the action wrapper around the standard Button.

- [ ] **Step 2: Migrate `ReadingHistoryScreen`**

Use muted `FeedbackText` for auth loading, a standard primary `Button` for
signed-out sign-in, and default `FeedbackText` for `error`. Wrap error feedback
in `errorFeedback: { marginBottom: 16 }`.

Change the title color to `theme.colors.primary`. Delete obsolete
`mutedText`, `errorText`, button, button-text, icon-button, icon-button-text,
and pressed styles; the unused icon styles are removed because no icon
control is rendered.

- [ ] **Step 3: Migrate `SingleCardReadingScreen`**

Use muted `FeedbackText` for both `Checking session...` and
`Drawing your card...`. Use default `FeedbackText` for `error`. Replace Sign
In and Try Again with standard primary Buttons. Use `status` and `action`
wrappers to preserve centered feedback and stretched buttons.

Keep branch order exactly: auth loading, signed out, generating, error,
success. Do not modify the successful `<NewReading onStart={onStart} />`
branch.

- [ ] **Step 4: Update stories and MDX**

Add `tags: ['autodocs']` to all three story metas. Preserve every existing
story and arg. Update MDX responsibilities to identify atom-backed muted
status, semantic error feedback, and standard primary actions. State that
screen-state structures remain local until checkpoint 4.

- [ ] **Step 5: Run focused type generation**

Run:

```sh
yarn workspace @simpletarot/ui build-types
```

Expected: exit 0.

---

### Task 4: Migrate result actions and remaining brown reading text

**Files:**
- Modify: `packages/ui/stories/screens/single-card-result-screen.tsx`
- Modify: `packages/ui/stories/screens/single-card-result-screen.stories.tsx`
- Modify: `packages/ui/stories/screens/single-card-result-screen.mdx`
- Modify: `packages/ui/stories/molecules/reading-list-card.tsx`
- Modify: `packages/ui/stories/molecules/reading-list-card.stories.tsx`
- Modify: `packages/ui/stories/molecules/reading-list-card.mdx`

**Interfaces:**
- Consumes: compact `Button` primary and secondary variants
- Preserves: `SingleCardResultScreenProps`, `ReadingListCardProps`, card
  rendering, optional history behavior, and all reading content

- [ ] **Step 1: Replace result controls**

Remove `Pressable` and render:

```tsx
<View style={styles.buttonGroup}>
    <Button label="Done" onPress={onDonePress} size="compact" />
    {onHistoryPress ? (
        <Button
            label="History"
            onPress={onHistoryPress}
            size="compact"
            variant="secondary"
        />
    ) : null}
</View>
```

Delete custom primary/secondary button, label, and pressed styles. Retain the
row gap and top margin. Do not alter card dimensions, transforms, content, or
summary behavior.

- [ ] **Step 2: Replace remaining brown text**

Set `ReadingListCard` question text and `ReadingHistoryScreen` title text to
`theme.colors.primary`. No other typography or card style changes.

- [ ] **Step 3: Update stories and MDX**

Add `tags: ['autodocs']` to the result and list-card story metas. Preserve
Default, Reversed, LongText, WithoutQuestion, and all args. Document the
compact primary/secondary result actions and monotone question text.

- [ ] **Step 4: Run the guard and type generation**

Run:

```sh
yarn workspace @simpletarot/ui check-ui-atoms
yarn workspace @simpletarot/ui build-types
```

Expected: both exit 0.

- [ ] **Step 5: Run focused source scans**

Run:

```sh
rg -n "<Pressable|<TextInput|primaryButton|secondaryButton|disabledButton|errorText|theme\\.colors\\.secondary" packages/ui/stories/organisms/new-reading-form.tsx packages/ui/stories/organisms/reading-history-list.tsx packages/ui/stories/screens/new-reading-screen.tsx packages/ui/stories/screens/reading-history-screen.tsx packages/ui/stories/screens/single-card-reading-screen.tsx packages/ui/stories/screens/single-card-result-screen.tsx packages/ui/stories/molecules/reading-list-card.tsx
```

Expected: no matches.

Confirm separately that `packages/ui/stories/organisms/new-reading.tsx` still
renders `CardDeck` and was not modified.

---

### Task 5: Update documentation and verify checkpoint 3

**Files:**
- Modify: `packages/ui/README.md`
- Modify: `README.md`
- Verify: all files from Tasks 1–4
- Do not commit

**Interfaces:**
- Produces: discoverable checkpoint plan and current package validation rules

- [ ] **Step 1: Update documentation**

Add this implementation plan beside the checkpoint-3 design under root
README Planning. In `packages/ui/README.md`, state that reading/history/result
trees compose generic controls and feedback from the atoms while tarot cards,
decks, and reading content remain domain-specific.

- [ ] **Step 2: Synchronize the immutable workspace**

Run:

```sh
yarn install --immutable --mode=skip-build
```

Expected: exit 0; existing peer-dependency warnings are acceptable.

- [ ] **Step 3: Run guards and type generation**

Run:

```sh
yarn workspace @simpletarot/ui check-theme-colors
yarn workspace @simpletarot/ui check-ui-atoms
yarn workspace @simpletarot/ui build-types
```

Expected: all exit 0.

- [ ] **Step 4: Build Storybook**

Run:

```sh
yarn workspace @simpletarot/ui build-storybook
```

Expected: exit 0. Existing eval, chunk-size, and Babel deoptimization warnings
remain non-blocking.

- [ ] **Step 5: Run repository lint and final diff checks**

Run:

```sh
yarn lint
git diff --check
git status --short
```

Expected: lint exits 0 with no errors; existing warnings may remain;
`git diff --check` is clean; status contains only checkpoint-3 files and the
ignored implementation plan exists on disk.

- [ ] **Step 6: Stop for manual acceptance**

Ask the user to inspect all variants listed in the design spec. Specifically
verify compact header/result actions, stretched standard CTAs, multiline
question input, disabled generating state, muted loading copy, semantic error
feedback, monotone history text, reversed/long results, card-deck interaction,
and pull-to-refresh.

Leave all changes uncommitted. Do not start checkpoint 4 until the user
confirms visual acceptance, confirms the checkpoint commit, and explicitly
authorizes continuation.
