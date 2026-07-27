# UI Monochrome Palette Design

**Status:** Approved for implementation planning

**Date:** 2026-07-27

## Goal

Replace the beige and brown color literals introduced by the newer reading,
history, and result UI with the existing black, white, and grey theme tokens.
Preserve the existing semantic error, success, and warning colors.

## Scope

This design covers the first checkpoint of the broader UI design-system
remediation:

1. replace beige and brown literals with existing theme tokens;
2. generalize button, input, and feedback atoms;
3. refactor reading, history, and result trees to compose those atoms;
4. extract repeated screen-state composition; and
5. complete Storybook, type, build, and lint verification.

Only item 1 is authorized by this design. Later checkpoints require their own
approved component interfaces before implementation.

## Palette Contract

Neutral presentation must use `theme.colors` rather than raw values from
`colors.ts` or color literals in components:

| Role | Theme token |
| --- | --- |
| Page background | `theme.colors.grey0` |
| Elevated, card, and input surface | `theme.colors.white` |
| Primary text | `theme.colors.primary` |
| Primary action background | `theme.colors.black` |
| Text on a primary action | `theme.colors.white` |
| Body text | `theme.colors.grey5` |
| Muted text and placeholders | `theme.colors.grey4` |
| Neutral borders | `theme.colors.greyOutline` |

Disabled and pressed states continue to use opacity over the applicable theme
token. They do not introduce separate color literals.

Status colors retain their existing semantic meaning:

- errors use `theme.colors.error`;
- success uses `theme.colors.success`; and
- warnings use `theme.colors.warning`.

No new palette values or theme aliases are introduced in this checkpoint.
Semantic aliases for generalized atoms belong to the atom-tokenization
checkpoint.

## Component Scope

The implementation updates the neutral colors in:

- `packages/ui/stories/screens/new-reading-screen.tsx`;
- `packages/ui/stories/screens/single-card-reading-screen.tsx`;
- `packages/ui/stories/screens/single-card-result-screen.tsx`;
- `packages/ui/stories/organisms/new-reading-form.tsx`; and
- `packages/ui/stories/molecules/reading-list-card.tsx`.

The existing uncommitted changes in `single-card-result-screen.tsx` are user
work. They must be preserved and folded into the completed mapping without
overwriting unrelated edits.

This checkpoint does not replace `Pressable`, `TextInput`, or feedback text
with shared atoms. Those composition changes belong to later checkpoints.
Layout, typography, component props, callbacks, and state behavior remain
unchanged.

## Storybook and Documentation

Every changed component retains its co-located Storybook story and MDX
documentation. Because this checkpoint changes appearance without adding
states or props, existing stories are updated only where needed to document or
demonstrate the monochrome contract. No new interaction behavior is added.

`packages/ui/README.md` will record that presentation components consume
neutral and status colors through `theme.colors`, and that component-level
color literals are not part of the UI contract.

## Verification

A source-level palette guard will enumerate the targeted component files and
fail when a hexadecimal, `rgb(...)`, `rgba(...)`, or named neutral/error color
literal appears in them. The guard will be run before implementation to prove
that it detects the current violations, then run after implementation to prove
the targeted files are clean.

Automated verification for the checkpoint is:

```sh
yarn workspace @simpletarot/ui build-types
yarn workspace @simpletarot/ui build-storybook
yarn lint
git diff --check
```

The UI package does not currently have a component unit-test suite. The
source-level guard supplies the regression check for this token-only change,
while Storybook supplies visual inspection.

## Manual Acceptance

In Storybook, inspect these screen states at the iPhone 14 Pro viewport:

- New Reading: signed out, empty form, generating, error, and latest result;
- Single Card Reading: signed out, generating, error, and default;
- Single Card Result: default, reversed, and long text; and
- Reading History: populated, empty, loading, and error.

Confirm that:

- beige and brown presentation has been replaced by black, white, and grey;
- error content still uses the semantic error color;
- borders, inputs, and cards remain visually distinguishable;
- disabled and pressed affordances remain visible; and
- layout, scrolling, card orientation, copy, and navigation affordances have
  not changed.

After automated and manual verification, the checkpoint remains uncommitted
until the user validates it and creates the checkpoint commit.
