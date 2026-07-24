# Navigation Fob Design

## Goal

Make the `QuickNav` speed-dial component (the "navigation fob") available on every main-app
screen of `apps/tarot`, wired to real navigation, while keeping `packages/ui` presentational per
`AGENTS.md`.

## Current state

`packages/ui/stories/molecules/quick-nav.tsx` is a Storybook-only prototype (`Molecules/Dev/`
category):

- Its three `SpeedDial.Action` handlers (`openProfile`, `goToHistory`, `startNewReading`) are
  no-ops that only close the dial.
- An unused `goToHome` handler exists but maps to no action and no route.
- It is not exported from `packages/ui/index.tsx`.
- Its outer `View` (`position: absolute`, `top/right/bottom/left: 0`) has no `pointerEvents`
  setting. `SpeedDial` itself already sets `pointerEvents="box-none"` internally, but this outer
  wrapper does not, so it intercepts touches over the entire screen even while the dial is closed.

## Design

### `packages/ui`

- `quick-nav.tsx`: add optional callback props `onProfilePress?`, `onReadingHistoryPress?`,
  `onNewReadingPress?` (matching the `onXPress?: () => void` convention already used by
  `AccountScreenProps`). Each `SpeedDial.Action`'s `onPress` calls the corresponding prop (if
  provided), then closes the dial. Remove the dead `goToHome` handler. Add
  `pointerEvents="box-none"` to the outer `View`. Export `QuickNavProps`.
- `quick-nav.mdx`: update the Props table to document the three callbacks; correct the overview
  text, which currently claims a "home" destination that doesn't exist.
- `quick-nav.stories.tsx` and `tests/quick-nav.stories.tsx`: pass no-op callbacks so stories keep
  compiling against the now-typed props. Rename the Storybook title from `Molecules/Dev/QuickNav`
  to `Molecules/QuickNav`, since it is graduating out of the dev-only category.
- `index.tsx`: export `QuickNav` and `QuickNavProps`.

### `apps/tarot`

- `src/app/_layout.tsx`: import `usePathname` and `useRouter` from `expo-router` and `QuickNav`
  from `@simpletarot/ui`. Render `<QuickNav />` as a sibling after `<Stack>`, inside
  `AuthProvider`, gated on `!pathname.startsWith('/auth')` so it is hidden during sign-in,
  sign-up, callback, logout, and sign-out, and shown on every other route (`/account`,
  `/readings`, `/readings/new`, `/readings/single-card`, `/readings/single-card/result`).
- Wire callbacks the same way `account.tsx` wires `AccountScreen`:
  - `onProfilePress` → `router.push('/account' as Href)`
  - `onReadingHistoryPress` → `router.push('/readings' as Href)`
  - `onNewReadingPress` → `router.push('/readings/single-card' as Href)`

### Testing

- Extend the existing Storybook interaction test
  (`packages/ui/stories/tests/quick-nav.stories.tsx`) to click each `SpeedDial.Action` and assert
  its callback fired. This is `packages/ui`'s test mechanism, since the package has no vitest
  suite.
- `apps/tarot`'s `_layout.tsx` change is route composition/wiring rather than logic, so it is
  covered by the Storybook interaction test plus manual verification (see below) rather than a
  new vitest test.

## Verification

- `packages/ui` has no CLI-driven test suite and no Storybook test-runner addon configured
  (confirmed in `.storybook/main.ts`); the extended `QuickNavOpenTest` interaction test is
  verified by running `yarn workspace @simpletarot/ui storybook` and exercising the story's
  Interactions panel, not by an automated CLI gate.
- `yarn build` (lint + type-build across workspaces) must pass — this typechecks the new
  `QuickNavProps` usage in both `packages/ui` and `apps/tarot`.
- Manual verification in the iOS simulator: confirm the fob renders on `/account` and `/readings`
  screens, is hidden on `/auth/sign-in`, and that each action navigates to its target route. Also
  confirm touches on screen content still work while the fob is present and closed (regression
  check for the `pointerEvents` fix).

No deployment or AWS mutation is part of this checkpoint.
