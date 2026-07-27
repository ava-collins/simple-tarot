# Reading Tree Atom Migration Design

**Status:** Approved for implementation planning

**Date:** 2026-07-27

## Goal

Refactor the new-reading, reading-history, single-card reading, and
single-card result component trees to consume the generic design-system
`Button`, `Input`, and `FeedbackText` atoms instead of recreating controls and
feedback styles locally.

## Scope

This design covers checkpoint 3 of the UI design-system remediation:

1. the monochrome reading palette, completed in checkpoint 1;
2. generic button, input, and feedback atoms, completed in checkpoint 2;
3. reading, history, and result composition using those atoms, covered here;
4. repeated screen-state composition; and
5. final Storybook and repository verification.

Checkpoint 3 changes only the control, feedback, and remaining brown text
composition in the reading trees. It does not extract shared loading,
signed-out, error, or empty-state structures; that remains checkpoint 4.

## Design Principles

- Generic actions use `Button`; direct `Pressable` remains reserved for
  tarot-specific interactions such as selecting the card deck.
- Text entry uses `Input`; reading organisms do not own text-input borders,
  colors, or disabled presentation.
- Errors and transient loading/status copy use `FeedbackText`.
- Headings, explanatory copy, reading interpretations, metadata, and card
  labels remain ordinary `Text` because they are content rather than feedback.
- Neutral text uses black, white, and grey theme tokens. Reading text does not
  use the brown `theme.colors.secondary` token.
- Consumers own layout wrappers around atoms and do not add atom style escape
  hatches.
- Existing props, callbacks, validation flow, refresh behavior, and
  user-visible states remain unchanged.

## Component Migration

### `NewReadingForm`

`packages/ui/stories/organisms/new-reading-form.tsx` replaces:

- Back and History `Pressable` controls with compact secondary `Button`
  instances;
- the multiline native `TextInput` and separate label with `Input` using
  `label="Question"` and `multiline`;
- the local error `Text` with default-tone `FeedbackText`; and
- the Generate Reading `Pressable` with a standard primary `Button`.

The organism continues to own the local question value, asynchronous
`onGeneratePress` call, and clearing the question after that callback settles.
The generating label remains caller-owned:

```tsx
<Button
    disabled={isGenerating}
    label={isGenerating ? 'Generating...' : 'Generate reading'}
    onPress={generateReading}
/>
```

The latest-reading card, position rows, summary, headings, and scroll layout
remain reading-specific composition.

### `ReadingHistoryList`

`packages/ui/stories/organisms/reading-history-list.tsx` replaces the empty
state's custom Generate Reading `Pressable` with a standard primary `Button`.
The `ScrollView`, `RefreshControl`, empty-state message, and
`ReadingListCard` mapping remain unchanged.

### `NewReadingScreen`

`packages/ui/stories/screens/new-reading-screen.tsx` replaces:

- signed-out Sign In `Pressable` with a standard primary `Button`; and
- `Checking session...` with muted `FeedbackText`.

A layout wrapper may center the feedback without adding a style prop to the
atom. The signed-in screen continues to use `MobileView`,
`KeyboardAvoidingView`, and `NewReadingForm`.

### `ReadingHistoryScreen`

`packages/ui/stories/screens/reading-history-screen.tsx` replaces:

- signed-out Sign In `Pressable` with a standard primary `Button`;
- `Checking session...` with muted `FeedbackText`; and
- the history error `Text` with default-tone `FeedbackText`.

The error uses a wrapper for the existing bottom spacing. The header, list,
refresh flow, and mobile template remain unchanged.

The title changes from `theme.colors.secondary` to
`theme.colors.primary`.

### `SingleCardReadingScreen`

`packages/ui/stories/screens/single-card-reading-screen.tsx` replaces:

- signed-out Sign In and error-state Try Again `Pressable` controls with
  standard primary `Button` instances;
- `Checking session...` and `Drawing your card...` with muted
  `FeedbackText`; and
- the error-state `Text` with default-tone `FeedbackText`.

Layout wrappers center status/error feedback while keeping standard action
buttons stretched. The successful state continues to render the
tarot-specific `NewReading` organism and its interactive card deck.

### `SingleCardResultScreen`

`packages/ui/stories/screens/single-card-result-screen.tsx` replaces Done and
History `Pressable` controls with compact `Button` instances:

```tsx
<Button label="Done" onPress={onDonePress} size="compact" />
<Button
    label="History"
    onPress={onHistoryPress}
    size="compact"
    variant="secondary"
/>
```

The optional History behavior, reversed-card transform, card dimensions,
interpretation text, summary, and scroll layout remain unchanged.

### `ReadingListCard`

`packages/ui/stories/molecules/reading-list-card.tsx` retains its
reading-specific card structure. Its question color changes from
`theme.colors.secondary` to `theme.colors.primary`; metadata and summary
continue to use grey tokens.

### Excluded Components

`packages/ui/stories/organisms/new-reading.tsx`, `Card`, `CardDeck`,
`Background`, and `StartArrow` retain their current tarot-specific rendering
and interactions. They do not recreate a generic form control.

Account/authentication screens and other direct `Pressable` uses are outside
checkpoint 3 because their control migration either completed in checkpoint 2
or belongs to a later audit checkpoint.

## Public Interfaces

No reading component props or package exports change. The migration consumes
the checkpoint-2 atom interfaces as they are:

```ts
type ButtonVariant = 'primary' | 'secondary' | 'muted';
type ButtonSize = 'standard' | 'compact';

interface ButtonProps {
    accessibilityLabel?: string;
    disabled?: boolean;
    label: string;
    onPress: () => void;
    size?: ButtonSize;
    variant?: ButtonVariant;
}

interface InputProps {
    disabled?: boolean;
    hasError?: boolean;
    keyboardType?: KeyboardType;
    label?: string;
    multiline?: boolean;
    onChangeText?: (text: string) => void;
    placeholder?: string;
    textContentType?: TextInputProps['textContentType'];
    value?: string;
}

interface FeedbackTextProps {
    children?: React.ReactNode;
    tone?: 'error' | 'success' | 'warning' | 'muted';
}
```

No new atom variant, layout prop, or visual style override is introduced.

## Source Guard

The dependency-free UI source guard expands to cover these exact files:

- `organisms/new-reading-form.tsx`;
- `organisms/reading-history-list.tsx`;
- `screens/new-reading-screen.tsx`;
- `screens/reading-history-screen.tsx`;
- `screens/single-card-reading-screen.tsx`;
- `screens/single-card-result-screen.tsx`; and
- `molecules/reading-list-card.tsx`.

It reports:

- direct `<Pressable` use in the six control-owning files;
- direct `<TextInput` use in `new-reading-form.tsx`;
- local `primaryButton`, `secondaryButton`, `disabledButton`,
  `primaryButtonText`, `secondaryButtonText`, or `errorText` style keys; and
- `theme.colors.secondary` in any targeted reading file.

The guard is run in a failing state before migration and a passing state after
migration. It does not scan `new-reading.tsx`, preserving the card-deck
interaction.

## Storybook Contract

Every changed component keeps its co-located story and MDX page aligned with
the atom-backed implementation.

Existing variants remain:

- `NewReadingForm`: empty, generating, latest result, error;
- `ReadingHistoryList`: populated, empty, loading-empty;
- `NewReadingScreen`: empty, generating, latest result, error, auth-loading,
  signed-out;
- `ReadingHistoryScreen`: populated, empty, error, auth-loading, signed-out;
- `SingleCardReadingScreen`: default, generating, error, auth-loading,
  signed-out;
- `SingleCardResultScreen`: default, reversed, long text; and
- `ReadingListCard`: default and fallback question.

Story descriptions state which generic atoms provide controls and feedback.
No current state or callback is removed.

## Verification

Automated verification is:

```sh
yarn workspace @simpletarot/ui check-theme-colors
yarn workspace @simpletarot/ui check-ui-atoms
yarn workspace @simpletarot/ui build-types
yarn workspace @simpletarot/ui build-storybook
yarn lint
git diff --check
```

Focused source searches confirm that targeted files have no direct custom
button/input implementation or brown secondary text.

## Manual Acceptance

In Storybook, inspect every listed variant and confirm:

- Back and History header actions are compact secondary buttons;
- Generate, Sign In, and Try Again actions are standard primary buttons;
- result Done and History actions remain side-by-side and visually distinct;
- generating buttons preserve their labels and disabled state;
- the reading question input preserves its label, multiline height,
  placeholder, value changes, and keyboard behavior;
- error feedback uses the semantic error token;
- auth-loading and card-drawing status copy uses muted feedback styling;
- history titles and questions are monotone rather than brown;
- loading, empty, error, populated, reversed-card, and long-text states remain
  usable on the mobile viewport; and
- the card deck, card artwork, reading result layout, and pull-to-refresh
  behavior remain unchanged.

After automated and manual verification, changes remain uncommitted until the
user validates and creates the checkpoint commit. Checkpoint 4 does not begin
until that commit is confirmed and continuation is explicitly authorized.
