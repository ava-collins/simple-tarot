# Screen State Composition Design

**Status:** Approved for implementation planning

**Date:** 2026-07-27

## Goal

Extract repeated full-screen loading, signed-out, retry, callback, and
informational composition into one internal `ScreenState` molecule, then
migrate the remaining custom screen-level buttons and feedback to the generic
design-system atoms.

## Scope

This design covers checkpoint 4 of the UI design-system remediation:

1. the monochrome reading palette, completed in checkpoint 1;
2. generic button, input, and feedback atoms, completed in checkpoint 2;
3. reading, history, and result composition using those atoms, completed in
   checkpoint 3;
4. repeated screen-state composition, covered here; and
5. final Storybook and repository verification.

Checkpoint 4 covers full-screen states in reading, account, and hosted-auth
screens. It also removes the final custom screen-level buttons from Account
and Cognito sign-in.

Inline form errors, errors shown alongside populated screen content, and the
refreshable reading-history empty state do not become `ScreenState`. They
remain local composition because they do not replace the full screen.

## Architecture

`packages/ui/stories/molecules/screen-state.tsx` is an internal,
presentation-only molecule. Screens continue to own `MobileView`, state
precedence, callback selection, and all domain content. `ScreenState` owns the
shared centered layout, monotone title/body typography, semantic feedback, and
optional action composition.

The molecule uses a discriminated union so status and prompt states cannot be
configured with ambiguous combinations of props.

## Interfaces

```ts
import type { ButtonVariant } from '../atoms/button';
import type { FeedbackTone } from '../atoms/feedback-text';

export interface ScreenStateAction {
    disabled?: boolean;
    label: string;
    onPress: () => void;
    variant?: ButtonVariant;
}

export type ScreenStateProps =
    | {
          action?: ScreenStateAction;
          kind: 'status';
          message: React.ReactNode;
          title?: string;
          tone?: FeedbackTone;
      }
    | {
          action?: ScreenStateAction;
          feedback?: React.ReactNode;
          feedbackTone?: FeedbackTone;
          kind: 'prompt';
          message?: React.ReactNode;
          title: string;
      };
```

`ScreenState` is not exported from `packages/ui/index.tsx`. It is an internal
molecule composed by public screens.

## Rendering Contract

### Status

A status state renders:

1. optional title as ordinary monotone `Text`;
2. message through `FeedbackText`; and
3. optional standard `Button`.

The default `tone` is `muted`. Retry/error states pass `tone="error"`.

### Prompt

A prompt state renders:

1. required title as ordinary monotone `Text`;
2. optional message as ordinary muted `Text`;
3. optional feedback through `FeedbackText`, defaulting to error tone; and
4. optional standard `Button`.

### Layout

Both kinds use one full-height centered container:

- `flex: 1`;
- `width: "100%"`;
- `justifyContent: "center"`;
- `gap: 16`;
- horizontal padding of 32;
- `theme.colors.grey0` background;
- monotone title and body colors; and
- a stretched action wrapper.

Status text is centered. Prompt title, message, and feedback remain
left-aligned while its action stretches to the available width.

The molecule accepts no arbitrary style, color, alignment, or child-rendering
escape hatch.

## Screen Migration

### Reading Screens

`NewReadingScreen` uses:

```tsx
<ScreenState
    kind="status"
    message="Checking session..."
/>
```

for auth loading and:

```tsx
<ScreenState
    action={{ label: 'Sign in', onPress: onSignInPress }}
    kind="prompt"
    message="Sign in to generate and save readings."
    title="New reading"
/>
```

for signed out.

`ReadingHistoryScreen` uses equivalent status and prompt states with its
existing title and copy. The populated-screen error remains inline
`FeedbackText` above `ReadingHistoryList`.

`SingleCardReadingScreen` uses:

- muted status for auth loading;
- prompt for signed out;
- muted status for card drawing; and
- error status with a Try Again action.

Its state precedence remains auth loading, signed out, generating, error,
successful `NewReading`.

### Account Screen

`AccountScreen` uses status for session loading and prompt for signed out. The
signed-out prompt includes optional error feedback and a Sign In action.

The signed-in screen retains its avatar, claims, email, scroll layout, and
optional reading actions. It replaces:

- signed-in error `Text` with inline `FeedbackText`;
- Start a Reading and Reading History custom `Pressable` controls with
  standard primary `Button`; and
- Sign Out custom `Pressable` with standard muted `Button`.

The three buttons remain in the existing vertical `buttonGroup`.

### Cognito Sign-In

`CognitoSignInScreen` becomes one prompt state:

```tsx
<ScreenState
    action={{
        disabled: !authRequestReady || isLoading,
        label: isLoading ? 'Opening...' : 'Continue',
        onPress: onContinuePress
    }}
    feedback={error}
    kind="prompt"
    message="Continue with the secure sign-in page."
    title="Sign in"
/>
```

The existing disabled condition and loading label remain unchanged.

### Auth Callback

`AuthCallbackScreen` keeps its title precedence:

1. `Finishing sign in` while loading;
2. `Sign in needs attention` when an error exists; and
3. `Welcome back` after successful completion.

It renders one prompt `ScreenState`. An error is passed as `feedback`;
otherwise the current return-to-app copy is passed as `message`.

### Sign-Out and Logout Callback

`SignOutScreen` renders a prompt state titled `Signing out` with the current
session-clearing message.

`LogoutCallbackScreen` renders a prompt state titled `Signed out` with the
current account-return message.

### Excluded Composition

The following remain local:

- Login, Signup, and Forgot Password forms;
- generation errors inside `NewReadingForm`;
- populated history errors above `ReadingHistoryList`;
- the refreshable `ReadingHistoryList` empty state;
- result content in `SingleCardResultScreen`;
- the card-deck interaction in `NewReading`; and
- tarot cards, imagery, reading interpretations, and domain layouts.

## Source Guard

The dependency-free `check-ui-atoms` guard expands to enforce:

- no direct `<Pressable` in any file under `stories/screens`;
- no custom `button`, `buttonText`, `primaryButton`, `signOutButton`,
  `signOutButtonText`, `disabledButton`, or `pressed` style keys in screens;
- no custom `mutedText` or `errorText` full-screen feedback styles in the
  migrated state screens;
- every target state screen imports and renders `ScreenState`; and
- `screen-state.tsx` exposes no arbitrary style or color prop and contains no
  color literal.

Target state screens are:

- `account-screen.tsx`;
- `cognito-sign-in-screen.tsx`;
- `auth-callback-screen.tsx`;
- `sign-out-screen.tsx`;
- `logout-callback-screen.tsx`;
- `new-reading-screen.tsx`;
- `reading-history-screen.tsx`; and
- `single-card-reading-screen.tsx`.

The guard runs red before the migration and green after it.

## Storybook Contract

Create co-located component, story, and MDX files for `ScreenState`.

`Molecules/ScreenState` demonstrates:

- muted loading status;
- error status with retry action;
- prompt;
- prompt with error feedback; and
- prompt with disabled action.

Update the stories and MDX pages for all eight target screens. Existing screen
variants remain, including:

- reading auth-loading, signed-out, generating, and retry states;
- Account loading, signed-out error, signed-in, and avatar-slot states;
- Cognito default, ready, loading, and error states;
- Auth Callback loading, success, and error states; and
- static Sign Out and Logout Callback states.

No screen prop or story state is removed.

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

Focused searches confirm no screen directly renders `Pressable` or retains
the removed local state/control style keys.

## Manual Acceptance

In Storybook, confirm:

- status states are vertically centered and use muted or semantic feedback;
- prompt states retain their title, body, feedback, and action copy;
- standard actions stretch and disabled Cognito action remains recognizable;
- Account signed-in reading actions are primary and Sign Out is muted;
- Account avatar, email, claims, and scroll layout remain unchanged;
- callback title precedence and error copy remain correct;
- reading state precedence and successful content remain unchanged;
- populated history errors and reading-list empty states remain inline;
- all states use monotone presentation except semantic feedback; and
- no custom screen-level button remains.

After automated and manual verification, changes remain uncommitted until the
user validates and creates the checkpoint commit. Checkpoint 5 does not begin
until that commit is confirmed and continuation is explicitly authorized.
