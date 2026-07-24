# Navigation Fob Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the `QuickNav` speed-dial component available on every main-app screen of `apps/tarot`, wired to real navigation, while keeping `packages/ui` presentational.

**Architecture:** `QuickNav` (in `packages/ui`) graduates from a Storybook-only prototype to a real presentational component that accepts navigation callback props instead of performing navigation itself. `apps/tarot`'s root layout (`_layout.tsx`) owns an `expo-router` `useRouter()` instance, renders `QuickNav` as a sibling above the `Stack`, wires its callbacks to `router.push`, and hides it on auth-flow routes via `usePathname()`.

**Tech Stack:** Expo Router, React Native, `@rneui/themed` `SpeedDial`, Storybook (React Native Web + Vite), TypeScript project references (`tsc -b`).

## Global Constraints

- `packages/ui` must stay presentational: no navigation/router imports, no env vars, no app-specific data fetching (`AGENTS.md`).
- Navigation callback props follow the existing `onXPress?: () => void` optional-callback convention used by `AccountScreenProps` (`packages/ui/stories/screens/account-screen.tsx:18-21`).
- `packages/ui` has no CLI-driven test suite (`CLAUDE.md`) and no Storybook test-runner addon (`packages/ui/.storybook/main.ts`) — the type checker (`tsc -b` via `build-types`) is the only automated gate for this package; interaction tests are verified manually in the Storybook UI.
- Route wiring in `apps/tarot` must follow the pattern already established in `apps/tarot/src/app/account.tsx`: the route/layout component owns `useRouter()` and passes `router.push('/path' as Href)` callbacks into the presentational component.

---

### Task 1: Graduate `QuickNav` to a real, documented, exported component

**Files:**
- Modify: `packages/ui/stories/molecules/quick-nav.tsx`
- Modify: `packages/ui/stories/molecules/quick-nav.mdx`
- Modify: `packages/ui/stories/molecules/quick-nav.stories.tsx`
- Modify: `packages/ui/stories/tests/quick-nav.stories.tsx`
- Modify: `packages/ui/index.tsx`

**Interfaces:**
- Consumes: `@rneui/themed/dist/SpeedDial` (`SpeedDial`, `SpeedDial.Action`) — unchanged, already imported.
- Produces: `QuickNav` component and `QuickNavProps` type, exported from `@simpletarot/ui`:
  ```ts
  export interface QuickNavProps {
      onNewReadingPress?: () => void;
      onProfilePress?: () => void;
      onReadingHistoryPress?: () => void;
  }
  ```
  Task 2 imports `QuickNav` and passes these three callbacks.

- [ ] **Step 1: Update the interaction test to pass callback props and assert they fire (write the failing check first)**

Replace the full contents of `packages/ui/stories/tests/quick-nav.stories.tsx`:

```tsx
import { Meta, StoryObj } from '@storybook/react-native-web-vite';
import QuickNav from '../molecules/quick-nav';
import React from 'react';

import { forceReloadDecorator } from './force-reload-decorator';
import { expect, fireEvent, screen, within, waitFor } from 'storybook/test';

const meta: Meta<typeof QuickNav> = {
    title: 'Molecules/QuickNav',
    component: QuickNav,
    decorators: [forceReloadDecorator]
} satisfies Meta<typeof QuickNav>;

export default meta;

type Story = StoryObj<typeof QuickNav>;

const openDial = async (canvas: ReturnType<typeof within>) => {
    const toggleButton = canvas.getByTestId('quick-nav-toggle');
    fireEvent.click(toggleButton);
    fireEvent.animationEnd(toggleButton);
    await waitFor(() => expect(canvas.getByTestId('quick-nav-profile-action')).toBeVisible());
};

export const QuickNavOpenTest: Story = {
    play: async ({ mount, step }) => {
        const pressed: string[] = [];

        await mount(
            <QuickNav
                onNewReadingPress={() => pressed.push('new-reading')}
                onProfilePress={() => pressed.push('profile')}
                onReadingHistoryPress={() => pressed.push('history')}
            />
        );
        await new Promise(resolve => setTimeout(resolve, 1000));

        const canvas = within(screen.getByTestId('quick-nav-container'));

        await step('Click open button', async () => {
            const toggleButton = canvas.getByTestId('quick-nav-toggle');
            expect(toggleButton).toBeVisible();
            fireEvent.click(toggleButton);
            fireEvent.animationEnd(toggleButton);
        });

        await step('Check if quick nav is open', async () => {
            await waitFor(() =>
                expect(canvas.getByTestId('quick-nav-profile-action')).toBeVisible()
            );
            await waitFor(() =>
                expect(canvas.getByTestId('quick-nav-history-action')).toBeVisible()
            );
            await waitFor(() =>
                expect(canvas.getByTestId('quick-nav-new-reading-action')).toBeVisible()
            );
        });

        await step('Pressing Profile calls onProfilePress and closes the dial', async () => {
            fireEvent.click(canvas.getByTestId('quick-nav-profile-action'));
            await waitFor(() => expect(pressed).toEqual(['profile']));
            await waitFor(() =>
                expect(canvas.queryByTestId('quick-nav-profile-action')).not.toBeVisible()
            );
        });

        await step('Pressing History calls onReadingHistoryPress and closes the dial', async () => {
            await openDial(canvas);
            fireEvent.click(canvas.getByTestId('quick-nav-history-action'));
            await waitFor(() => expect(pressed).toEqual(['profile', 'history']));
            await waitFor(() =>
                expect(canvas.queryByTestId('quick-nav-history-action')).not.toBeVisible()
            );
        });

        await step(
            'Pressing New Reading calls onNewReadingPress and closes the dial',
            async () => {
                await openDial(canvas);
                fireEvent.click(canvas.getByTestId('quick-nav-new-reading-action'));
                await waitFor(() => expect(pressed).toEqual(['profile', 'history', 'new-reading']));
                await waitFor(() =>
                    expect(canvas.queryByTestId('quick-nav-new-reading-action')).not.toBeVisible()
                );
            }
        );

        await step('Check if quick nav is closed', async () => {
            await waitFor(() =>
                expect(canvas.queryByTestId('quick-nav-profile-action')).not.toBeVisible()
            );
            await waitFor(() =>
                expect(canvas.queryByTestId('quick-nav-history-action')).not.toBeVisible()
            );
            await waitFor(() =>
                expect(
                    canvas.queryByTestId('quick-nav-new-reading-action')
                ).not.toBeVisible()
            );
        });
    }
};
```

- [ ] **Step 2: Run the type checker to confirm this fails against the current component**

Run: `yarn workspace @simpletarot/ui build-types`
Expected: FAIL, with TypeScript errors on the three `on*Press` attributes in `tests/quick-nav.stories.tsx`, e.g. `Property 'onProfilePress' does not exist on type 'IntrinsicAttributes'.` — because `QuickNav` currently takes no props.

- [ ] **Step 3: Implement the component changes**

Replace the full contents of `packages/ui/stories/molecules/quick-nav.tsx`:

```tsx
import React, { useState } from 'react';

import SpeedDial from '@rneui/themed/dist/SpeedDial';
import { View } from 'react-native';

export interface QuickNavProps {
    onNewReadingPress?: () => void;
    onProfilePress?: () => void;
    onReadingHistoryPress?: () => void;
}

const QuickNav: React.FC<QuickNavProps> = ({
    onNewReadingPress,
    onProfilePress,
    onReadingHistoryPress
}) => {
    const [open, setOpen] = useState(false);

    const openProfile = () => {
        setOpen(false);
        onProfilePress?.();
    };

    const goToHistory = () => {
        setOpen(false);
        onReadingHistoryPress?.();
    };

    const startNewReading = () => {
        setOpen(false);
        onNewReadingPress?.();
    };

    return (
        <View
            testID="quick-nav-container"
            pointerEvents="box-none"
            style={{
                position: 'absolute',
                top: 0,
                right: 0,
                bottom: 0,
                left: 0
            }}>
            <SpeedDial
                color={open ? 'white' : 'black'}
                isOpen={open}
                icon={{ name: 'navigation', color: 'white' }}
                openIcon={{ name: 'close', color: 'black' }}
                onOpen={() => setOpen(true)}
                onClose={() => setOpen(false)}
                testID="quick-nav-toggle">
                <SpeedDial.Action
                    color="white"
                    icon={{
                        type: 'material-community',
                        name: 'account-outline',
                        color: '#000'
                    }}
                    title="Profile"
                    onPress={openProfile}
                    testID="quick-nav-profile-action"
                />

                <SpeedDial.Action
                    color="white"
                    icon={{ name: 'history', color: '#000' }}
                    title="History"
                    onPress={goToHistory}
                    testID="quick-nav-history-action"
                />
                <SpeedDial.Action
                    color="white"
                    icon={{
                        type: 'material-community',
                        name: 'cards-outline',
                        color: '#000'
                    }}
                    title="New Reading"
                    onPress={startNewReading}
                    testID="quick-nav-new-reading-action"
                />
            </SpeedDial>
        </View>
    );
};

export default QuickNav;
```

Note the two changes beyond adding props: the dead `goToHome` handler is gone (it never mapped to a route or a dial action), and the outer `View` now has `pointerEvents="box-none"` — without it, this full-screen absolutely-positioned wrapper intercepts touches meant for the screen behind it even while the dial is closed, since `SpeedDial` itself already sets `pointerEvents="box-none"` internally but this wrapper didn't.

- [ ] **Step 4: Run the type checker to confirm it now passes**

Run: `yarn workspace @simpletarot/ui build-types`
Expected: PASS (no output, exit code 0).

- [ ] **Step 5: Update the component docs**

Replace the full contents of `packages/ui/stories/molecules/quick-nav.mdx`:

```mdx
import { Canvas, Meta } from '@storybook/addon-docs/blocks';
import * as QuickNav from './quick-nav.stories';

<Meta of={QuickNav.default} />

# QuickNav Component
## Overview
The QuickNav component provides a floating action button that opens a speed dial menu with
options for navigating to the profile, reading history, and new reading screens. QuickNav does
not perform navigation itself — it calls the callback prop for whichever action was pressed, and
the consumer decides what that means.

## Props

| Prop | Type | Description |
|---|---|---|
| `onProfilePress` | `() => void` | Called when the Profile action is pressed. |
| `onReadingHistoryPress` | `() => void` | Called when the History action is pressed. |
| `onNewReadingPress` | `() => void` | Called when the New Reading action is pressed. |

## State
- `open`: Boolean state to track if the speed dial is open or closed.

## Interaction Tests
### QuickNavOpenTest
- Verify that the speed dial opens when button is pressed.
- Verify that the speed dial actions are visible.
- Verify that pressing each action calls its corresponding callback prop and closes the dial.
- Verify that the speed dial actions are not visible when closed.
```

- [ ] **Step 6: Rename the default story out of the Dev category**

In `packages/ui/stories/molecules/quick-nav.stories.tsx`, change line 6 from:

```tsx
        title: 'Molecules/Dev/QuickNav',
```

to:

```tsx
        title: 'Molecules/QuickNav',
```

Leave the rest of that file unchanged (`Default: Story = {}` still renders correctly since all `QuickNavProps` fields are optional).

- [ ] **Step 7: Export `QuickNav` from the package**

In `packages/ui/index.tsx`, add these two lines after the existing `export * from './stories/atoms/form-error-text';` line (line 6):

```tsx
export { default as QuickNav } from './stories/molecules/quick-nav';
export type { QuickNavProps } from './stories/molecules/quick-nav';
```

- [ ] **Step 8: Run the full workspace build to confirm nothing else broke**

Run: `yarn build`
Expected: PASS — lint and `build-types` succeed across all workspaces.

- [ ] **Step 9: Manually verify the interaction test in Storybook**

Run: `yarn workspace @simpletarot/ui storybook`

In the browser, open **Molecules → QuickNav → Interactions**, select the `QuickNavOpenTest` story, and open its Interactions panel. Confirm every step shows green/passed, including the three new "Pressing X calls..." steps.

- [ ] **Step 10: Commit**

```bash
git add packages/ui/stories/molecules/quick-nav.tsx packages/ui/stories/molecules/quick-nav.mdx packages/ui/stories/molecules/quick-nav.stories.tsx packages/ui/stories/tests/quick-nav.stories.tsx packages/ui/index.tsx
git commit -m "feat(ui): wire QuickNav navigation callbacks and export it"
```

---

### Task 2: Wire `QuickNav` into the mobile app's root layout

**Files:**
- Modify: `apps/tarot/src/app/_layout.tsx`

**Interfaces:**
- Consumes: `QuickNav` and `QuickNavProps` from `@simpletarot/ui` (Task 1). `usePathname`, `useRouter`, and `type Href` from `expo-router` (already used the same way in `apps/tarot/src/app/account.tsx:2,15,19-20`).
- Produces: nothing consumed by later tasks — this is the final integration point.

- [ ] **Step 1: Wire QuickNav into the layout**

Replace the full contents of `apps/tarot/src/app/_layout.tsx`:

```tsx
import { QuickNav } from '@simpletarot/ui';
import {
    DarkTheme,
    DefaultTheme,
    Stack,
    ThemeProvider,
    usePathname,
    useRouter,
    type Href
} from 'expo-router';
import { useColorScheme } from 'react-native';

import { AuthProvider } from '@/auth/auth-context';

export default function TabLayout() {
    const colorScheme = useColorScheme();
    const pathname = usePathname();
    const router = useRouter();
    const showQuickNav = !pathname.startsWith('/auth');

    return (
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <AuthProvider>
                <Stack initialRouteName="account" screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="account" />
                    <Stack.Screen name="auth/sign-in" />
                    <Stack.Screen name="auth/sign-up" />
                    <Stack.Screen name="auth/callback" />
                    <Stack.Screen name="auth/logout" />
                    <Stack.Screen name="auth/sign-out" />
                    <Stack.Screen name="readings/index" />
                    <Stack.Screen name="readings/new" />
                    <Stack.Screen name="readings/single-card/index" />
                    <Stack.Screen name="readings/single-card/result" />
                    <Stack.Screen name="index" />
                </Stack>
                {showQuickNav && (
                    <QuickNav
                        onNewReadingPress={() => router.push('/readings/single-card' as Href)}
                        onProfilePress={() => router.push('/account' as Href)}
                        onReadingHistoryPress={() => router.push('/readings' as Href)}
                    />
                )}
            </AuthProvider>
        </ThemeProvider>
    );
}
```

- [ ] **Step 2: Run the full workspace build**

Run: `yarn build`
Expected: PASS — lint and `build-types` succeed across all workspaces, including `apps/tarot`.

- [ ] **Step 3: Commit**

```bash
git add apps/tarot/src/app/_layout.tsx
git commit -m "feat(tarot): show QuickNav on all non-auth screens"
```

- [ ] **Step 4: Manual verification (stop here for user sign-off)**

Run: `yarn ios` (or `yarn workspace tarot start` and open in a simulator/device).

Check, in the running app:
1. The fob is visible on `/account` and `/readings` (navigate there via existing in-app links).
2. The fob is hidden on `/auth/sign-in` (trigger sign-in from the account screen).
3. Tapping the fob opens the speed dial showing Profile / History / New Reading actions.
4. Tapping **Profile** navigates to `/account`.
5. Tapping **History** navigates to `/readings`.
6. Tapping **New Reading** navigates to `/readings/single-card`.
7. While the fob is present and *closed*, taps on ordinary screen content (e.g. buttons on the account screen) still work — this is the regression check for the `pointerEvents="box-none"` fix in Task 1.

This is the final checkpoint. Do not commit further or continue past this point until the user confirms manual verification and authorizes it.

---
