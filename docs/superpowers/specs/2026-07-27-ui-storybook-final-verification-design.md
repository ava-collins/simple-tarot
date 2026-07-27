# UI Storybook Final Verification Design

**Status:** Approved for implementation planning

**Date:** 2026-07-27

## Goal

Finish the UI design-system remediation with complete, durable Storybook
coverage, minimal interaction tests for reusable controls and screen actions,
automated source guards, and representative real-browser verification.

This checkpoint proves that the remediated atoms, molecules, organisms, and
mobile screens remain theme-owned and composable without turning browser smoke
checks into a brittle exhaustive test suite.

## Scope

This design covers checkpoint 5 of the UI design-system remediation:

1. the monochrome reading palette, completed in checkpoint 1;
2. generic button, input, and feedback atoms, completed in checkpoint 2;
3. reading, history, and result composition using those atoms, completed in
   checkpoint 3;
4. repeated screen-state composition, completed in checkpoint 4; and
5. final Storybook coverage and repository verification, covered here.

The final checkpoint:

- removes the remaining non-domain color literals found by the final audit;
- documents every remediated component and its intended variants;
- adds dependency-free coverage enforcement;
- adds focused Storybook interaction tests;
- performs a representative real-browser Storybook smoke pass; and
- updates the UI package's durable validation guidance.

It does not redesign tarot cards, card imagery, reading interpretations,
background gradients, or other intentionally domain-specific visuals.

## Remaining Theme Cleanup

### Quick Navigation

`packages/ui/stories/molecules/quick-nav.tsx` replaces named `black` and
`white` values and the `#000` icon literal with the corresponding
`theme.colors` tokens. Its fixed-position wrapper moves from an inline style to
its component `StyleSheet`.

`packages/ui/stories/molecules/quick-nav.stories.tsx`:

- opts into autodocs;
- supplies visible callback actions for the default story; and
- participates in the focused interaction-test contract.

Its MDX describes the monotone palette contract.

### Account Avatar Story Fixture

The avatar fixture in
`packages/ui/stories/screens/account-screen.stories.tsx` replaces its `#333`
border with the nearest existing grey theme token. This changes only the story
fixture; the injected avatar-slot production contract remains unchanged.

### Background Story Fixture

`packages/ui/stories/atoms/background.stories.tsx` replaces its white text and
translucent black panel literals with existing monotone theme tokens.

The fallback gradient literals in
`packages/ui/stories/atoms/background.tsx` remain intentional domain imagery.
This checkpoint also preserves tarot card colors and the use of
`theme.colors.secondary` in card-deck presentation.

## Storybook Coverage Contract

Add a dependency-free `check-story-coverage` script with an explicit manifest
of the remediated UI surface. Each manifest entry identifies its component,
story, MDX documentation, and required named story exports rather than relying
on filename conventions alone.

The explicit paths accommodate intentional names such as
`forgot-password-form.tsx`, `forgot-password.stories.tsx`, and
`forgot-password-form.mdx`.

The manifest covers:

- atoms: `Button`, `Input`, `FeedbackText`;
- molecules: `InputField`, `ScreenState`, `ReadingListCard`, and `QuickNav`;
- organisms: `LoginForm`, `SignupForm`, `ForgotPasswordForm`,
  `ReadingHistoryList`, `NewReadingForm`, and `UserAccount`; and
- screens: Account, Cognito sign-in, auth callback, sign-out, logout callback,
  new reading, reading history, single-card reading, and single-card result.

For every entry, the guard verifies:

1. the declared component, story, and MDX files exist;
2. all required named story exports exist; and
3. the story opts into autodocs.

The manifest remains deliberately explicit. Adding a component elsewhere does
not automatically impose this checkpoint's story contract, while removing or
renaming a remediated variant requires an intentional manifest update.

## Minimal Interaction Tests

Behavior tests live in Storybook story `play` functions or co-located
Storybook test stories, not in production components. They use the existing
Storybook testing APIs and mock callbacks.

The minimum behavior matrix is:

| Surface | Assertion |
| --- | --- |
| `Button` | An enabled button invokes its callback once; a disabled button does not invoke it. |
| `Input` | Entering text updates the field and invokes the change callback. |
| `FeedbackText` | The selected message is present; no synthetic interaction is added to a non-interactive atom. |
| `ScreenState` | Its configured action invokes the supplied callback. |
| `QuickNav` | The speed dial opens, an action invokes its callback, and the dial can close. |
| Account and Cognito | Representative primary actions invoke the callbacks supplied by their stories. |
| New reading | The representative form or screen action invokes its submit/navigation callback. |
| Reading history | Selecting a representative reading invokes its callback. |
| Single-card result | Representative navigation or repeat-reading action invokes its callback. |

Tests assert public behavior and accessible labels or roles. They do not assert
internal style objects, component nesting, animations, or implementation-only
state. Existing QuickNav behavior coverage may be consolidated into its
co-located story instead of duplicated.

Static variants without meaningful interaction remain visual stories. They do
not receive artificial click tests merely to increase test count.

## Source Guards

`check-theme-colors` expands to include the cleaned QuickNav component and the
Account and Background story fixtures. It rejects direct non-domain color
literals in those targets while preserving the documented gradient and tarot
visual exceptions.

`check-story-coverage` becomes a package script alongside
`check-theme-colors` and `check-ui-atoms`. The final validation commands run all
three guards before compilation and Storybook.

The existing `check-ui-atoms` contract remains responsible for preventing
custom controls and feedback styles from returning to the migrated component
trees.

## Browser Smoke Verification

After the static Storybook build succeeds, launch the Storybook development
server and inspect representative stories in a real browser.

The smoke set includes:

- Button;
- Input;
- FeedbackText;
- ScreenState;
- QuickNav;
- Account and Cognito states;
- new-reading and reading-history states; and
- single-card reading/result states.

The browser pass verifies:

1. each representative story loads without an error overlay;
2. the story renders its expected visible state;
3. QuickNav opens and closes and exposes its actions;
4. at least its representative action can be invoked; and
5. the browser console contains no unexpected errors attributable to these
   stories.

Story identifiers are resolved from the running Storybook index rather than
hard-coded from assumptions. The browser smoke is representative; the
dependency-free manifest and Storybook build provide exhaustive structural
coverage.

## Verification Sequence

Run the checkpoint verification in this order:

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

Then launch Storybook, complete the browser smoke set, inspect the browser
console, and stop the development server.

The implementation checkpoint remains uncommitted after automated and browser
verification. The user performs final manual validation and creates the
checkpoint commit.

## Documentation

Update `packages/ui/README.md` so its validation section:

- includes `check-story-coverage`;
- describes focused Storybook interaction tests and representative browser
  smoke verification; and
- records that background gradients and tarot/card visuals are intentional
  domain exceptions while ordinary controls and text use theme tokens.

The implementation plan for this design is linked from the repository root
README after planning is complete.

## Acceptance Criteria

The checkpoint is complete when:

- the three remaining audited non-domain color-literal sites use theme tokens;
- the coverage manifest passes for every remediated component and required
  variant;
- the minimal interaction matrix passes through Storybook;
- theme and atom guards pass;
- UI types, the static Storybook build, repository lint, and diff checks pass;
- representative browser stories render and QuickNav interaction succeeds
  without unexpected console errors; and
- the UI README accurately describes the resulting validation contract and
  documented visual exceptions.
