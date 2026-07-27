# Generic UI Atoms Design

**Status:** Approved for implementation planning

**Date:** 2026-07-27

## Goal

Replace the form-specific button, input, and error-text atoms with generic,
theme-owned design-system primitives that can be reused by authentication,
reading, history, and result interfaces without local visual reimplementation.

## Scope

This design covers checkpoint 2 of the UI design-system remediation:

1. the monochrome reading palette, completed in checkpoint 1;
2. generic button, input, and feedback atoms, covered here;
3. reading, history, and result composition using those atoms;
4. repeated screen-state composition; and
5. final Storybook and repository verification.

Checkpoint 2 replaces the existing atom names and migrates their current
authentication and account consumers. It prepares the atom interfaces needed
by checkpoint 3 but does not refactor reading, history, or result components
to consume them.

## Design Principles

- Atoms own visual design: colors, borders, type, sizes, pressed state, and
  disabled state.
- Consumers own layout around atoms rather than overriding atom colors or
  typography.
- Atom props describe intent through controlled variants instead of exposing
  arbitrary style objects.
- Neutral presentation uses the black, white, and grey tokens from
  `theme.colors`.
- Error, success, and warning feedback uses the existing semantic theme
  tokens.
- UI atoms remain presentational and do not import hooks, application routes,
  environment variables, or server actions.

## Button Atom

`packages/ui/stories/atoms/button.tsx` replaces `form-button.tsx`.

```ts
export type ButtonVariant = 'primary' | 'secondary' | 'muted';
export type ButtonSize = 'standard' | 'compact';

export interface ButtonProps {
    accessibilityLabel?: string;
    disabled?: boolean;
    label: string;
    onPress: () => void;
    size?: ButtonSize;
    variant?: ButtonVariant;
}
```

Defaults are `variant="primary"`, `size="standard"`, and `disabled={false}`.
The visible label is the fallback accessibility label.

Appearance:

| Variant | Background | Border | Text |
| --- | --- | --- | --- |
| `primary` | `theme.colors.black` | none | `theme.colors.white` |
| `secondary` | transparent | `theme.colors.greyOutline` | `theme.colors.primary` |
| `muted` | `theme.colors.grey3` | none | `theme.colors.white` |

`standard` buttons are 60 points high and stretch to the available parent
width. `compact` buttons are 44 points high and size to their label. Both use
internal horizontal padding, centered bold text, pressed opacity, and disabled
opacity. Loading copy remains caller-owned: existing consumers continue to
select a label and set `disabled`.

The atom does not accept `buttonStyle`, `titleStyle`, or arbitrary color
overrides. A consumer that needs surrounding spacing wraps the button in a
layout `View`.

## Input Atom

`packages/ui/stories/atoms/input.tsx` replaces `form-input.tsx`.

```ts
export interface InputProps {
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
```

Defaults are `disabled={false}`, `hasError={false}`,
`keyboardType="default"`, and `multiline={false}`. `textContentType` becomes
optional so the atom also supports non-credential content such as a tarot
question. Password masking remains derived from
`textContentType === "password"`.

The atom owns:

- primary text and label colors;
- white input surface;
- grey placeholder and neutral border colors;
- semantic error border color;
- standard single-line height;
- multiline minimum height and top-aligned text; and
- disabled presentation.

The atom does not accept a free-form text or container style override.

## FeedbackText Atom

`packages/ui/stories/atoms/feedback-text.tsx` replaces
`form-error-text.tsx`.

```ts
export type FeedbackTone = 'error' | 'success' | 'warning' | 'muted';

export interface FeedbackTextProps {
    children?: React.ReactNode;
    tone?: FeedbackTone;
}
```

The default tone is `error`. Tone mappings are:

| Tone | Theme token |
| --- | --- |
| `error` | `theme.colors.error` |
| `success` | `theme.colors.success` |
| `warning` | `theme.colors.warning` |
| `muted` | `theme.colors.grey5` |

The atom renders nothing when `children` is `null`, `undefined`, `false`, or
an empty string. It has no dependency on the hooks package or its `FormError`
type.

## InputField Molecule

`packages/ui/stories/molecules/input-field.tsx` replaces
`form-input-row.tsx`.

```ts
export interface InputFieldProps {
    feedback?: React.ReactNode;
    feedbackTone?: FeedbackTone;
    inputProps: InputProps;
}
```

`InputField` composes `Input` with an optional `FeedbackText`. Its default
feedback tone is `error`. Validation remains outside the UI package: auth
organisms receive `FormError[]` from hooks, select the applicable error, and
pass only its message and the `hasError` boolean into the molecule.

## Migration

The checkpoint deletes:

- `atoms/form-button.tsx` and its story;
- `atoms/form-input.tsx` and its story;
- `atoms/form-error-text.tsx` and its story; and
- `molecules/form-input-row.tsx`, its story, and its MDX page.

It creates co-located component, story, and MDX files for `Button`, `Input`,
`FeedbackText`, and `InputField`.

Current consumers migrate in the same checkpoint:

- `LoginForm`;
- `SignupForm`;
- `ForgotPasswordForm`; and
- `UserAccount`.

Authentication forms use primary standard buttons. `UserAccount` uses a
primary standard reset-password button and a muted standard logout button.
Organisms add layout wrappers where the removed `FormButton` margin previously
provided spacing.

`packages/ui/index.tsx` removes the `FormErrorText` export and exports
`Button`, `ButtonProps`, `ButtonVariant`, `ButtonSize`, `Input`, `InputProps`,
`FeedbackText`, `FeedbackTextProps`, and `FeedbackTone`. `InputField` remains
an internal molecule, matching the package convention that molecules compose
screens but are not public entry-point exports.

No compatibility wrappers or deprecated aliases remain.

## Storybook Contract

New atom stories demonstrate:

- `Button`: primary, secondary, muted, compact, and disabled;
- `Input`: standard, error, password, multiline, and disabled;
- `FeedbackText`: error, success, warning, muted, and empty; and
- `InputField`: default and error composition.

Every migrated organism keeps its co-located story and documentation aligned
with the generic atom names. No user-visible authentication states are
removed.

## Verification

A dependency-free source guard fails if:

- a legacy component file or import name remains;
- a targeted component imports an old atom or molecule;
- a new atom contains a hexadecimal, RGB, RGBA, or named color literal; or
- a new atom exposes the removed `buttonStyle` or `titleStyle` escape hatches.

The guard is run in a failing state before the migration and a passing state
afterward.

Automated verification is:

```sh
yarn workspace @simpletarot/ui check-ui-atoms
yarn workspace @simpletarot/ui build-types
yarn workspace @simpletarot/ui build-storybook
yarn lint
git diff --check
```

## Manual Acceptance

In Storybook, inspect every new atom state and the default, disabled/loading,
validation-error, verification, and account/logout states of the migrated
organisms and screens.

Confirm that:

- all button variants remain monochrome and visually distinct;
- compact buttons do not stretch while standard buttons do;
- disabled controls remain recognizable;
- input labels, placeholders, password masking, multiline layout, and error
  borders render correctly;
- feedback tones use the intended semantic or muted token;
- empty feedback consumes no visible space;
- auth form validation and loading labels behave as before; and
- no old `FormButton`, `FormInput`, `FormErrorText`, or `FormInputRow` surface
  remains in Storybook or package exports.

After automated and manual verification, changes remain uncommitted until the
user validates and creates the checkpoint commit.
