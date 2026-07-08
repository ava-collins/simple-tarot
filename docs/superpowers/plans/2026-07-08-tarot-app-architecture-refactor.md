# Tarot App Architecture Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the recent tarot app RSC readings and avatar additions so reusable data-fetching lives in `@simpletarot/hooks`, reusable presentation lives in `@simpletarot/ui`, and `apps/tarot` remains a thin Expo Router composition layer.

**Architecture:** `packages/hooks` owns serializable API contracts, API clients, reusable state/resource hooks, and shared constants. `packages/ui` owns atoms, molecules, organisms, and mobile screen components wrapped in the existing `MobileView` template. `apps/tarot` owns Expo Router routes, Cognito auth/token access, Expo Server Function wrappers, and navigation callbacks only.

**Tech Stack:** Expo SDK 57, Expo Router Server Functions, React 19, React Native 0.86, TypeScript, Vitest, `@storybook/react-native-web-vite`, existing Express readings and avatars API.

## Global Constraints

-   Presentation and data fetching are strictly separated between `packages/hooks` and `packages/ui`; UI components must not call `fetch`, import app server actions, or read Expo environment variables.
-   Tarot app routes should consume full screen UI components from `@simpletarot/ui` whenever a matching screen exists.
-   Screens in `packages/ui` are mobile screens and must use the existing `MobileView` template until a future template refactor changes that convention.
-   Prefer smaller focused abstractions; each new function or component should have one primary responsibility and deterministic output for the same input.
-   Reuse of common code becomes a shared utility only after a value or function is needed in more than one place.
-   No magic strings for reusable values; gather values used in more than one place in the nearest constants module, and export package-level constants that cross app/package boundaries.
-   Prefer environment variables for infrastructure and secret values; Expo public, non-secret values must use `EXPO_PUBLIC_*`.
-   React code should prefer React 19 `use()` with Suspense/error boundaries for render-time Promise reads instead of `useEffect` + `useState` fetch loops where the flow can be modeled as a Promise resource.
-   The Avatar RSC component must not completely replace the legacy avatar component; keep the legacy REST/mock avatar path available for same-day rollback.
-   Every changed or new UI component requires functional `.stories.tsx` coverage and `.mdx` docs beside the component.
-   Add a manual verification pause after every task; do not proceed to the next task until the user confirms the app behavior.

---

## Code Analysis Summary

The RSC pilot works end to end, but several recent additions conflict with the target architecture:

-   `apps/tarot/src/app/readings/index.tsx` and `apps/tarot/src/app/readings/new.tsx` render complete mobile screens inline with local styles, copy, and layout. These should move to `packages/ui/stories/screens` and be consumed by the routes as screen components.
-   `apps/tarot/src/readings/use-rsc-reading-history.ts` and `apps/tarot/src/avatars/use-rsc-avatar-image.ts` hold reusable data/state logic in the Expo app. The hooks package already owns reusable form and avatar hooks, so these should move or be reshaped into `packages/hooks`.
-   `apps/tarot/src/readings/reading-contracts.ts`, `apps/tarot/src/avatars/avatar-contracts.ts`, `apps/tarot/src/api/tarot-api.ts`, and `apps/tarot/src/avatars/avatar-api.ts` define reusable API contracts/clients inside the app. These are web/mobile shared concerns and should live in `packages/hooks`.
-   `apps/tarot/src/avatars/rsc-avatar-image.tsx` duplicates avatar presentation with `@rneui/themed` instead of adapting the existing `packages/ui/stories/atoms/avatar-image.tsx` presentation path. Keep an interchangeable RSC-backed adapter, but centralize the visual atom in `packages/ui`.
-   `packages/ui/stories/screens/account-screen.tsx` already uses `MobileView` and supports `avatarSlot`; that is the right interchange point for the RSC-backed avatar and the legacy fallback.
-   Existing docs describe the RSC pilot as app-local. They need an architecture pass that documents the new package boundaries and rollback points so future users and agents do not follow stale guidance.

## Target File Structure

-   Create `packages/hooks/src/constants/tarot-api.ts`: shared API environment key names and endpoint path constants.
-   Create `packages/hooks/src/common/api-response.ts`: shared JSON response parsing helpers used by readings and avatars.
-   Create `packages/hooks/src/readings/reading-contracts.ts`: move reading contract types out of `apps/tarot`.
-   Create `packages/hooks/src/readings/reading-api-client.ts`: move the reusable readings REST client out of `apps/tarot`.
-   Create `packages/hooks/src/readings/reading-requests.ts`: shared one-card reading request builder and reusable card/spread constants.
-   Create `packages/hooks/src/readings/use-rsc-reading-history.ts`: move the RSC-backed reading hook/resource logic out of `apps/tarot`.
-   Create `packages/hooks/src/avatars/avatar-contracts.ts`: move avatar contract types out of `apps/tarot`.
-   Create `packages/hooks/src/avatars/avatar-api-client.ts`: move the reusable avatars REST client out of `apps/tarot`.
-   Create `packages/hooks/src/avatars/use-rsc-avatar-image.ts`: move the RSC avatar state/resource hook out of `apps/tarot`.
-   Modify `packages/hooks/index.tsx`: export the new contracts, clients, constants, and hooks.
-   Modify `apps/tarot/src/api/tarot-api.ts`: shrink to a compatibility re-export or remove after app imports are migrated.
-   Modify `apps/tarot/src/avatars/avatar-api.ts` and `apps/tarot/src/avatars/avatar-contracts.ts`: shrink to compatibility re-exports or remove after app imports are migrated.
-   Modify `apps/tarot/src/readings/reading-contracts.ts`: shrink to a compatibility re-export or remove after app imports are migrated.
-   Modify `apps/tarot/src/readings/server-actions.ts`: keep as a thin Expo `'use server'` wrapper around `@simpletarot/hooks` clients/builders.
-   Modify `apps/tarot/src/avatars/server-actions.ts`: keep as a thin Expo `'use server'` wrapper around `@simpletarot/hooks` clients.
-   Modify `apps/tarot/src/readings/use-rsc-reading-history.ts` and `apps/tarot/src/avatars/use-rsc-avatar-image.ts`: replace with compatibility re-exports during migration, then delete after imports are updated.
-   Create `packages/ui/stories/atoms/avatar-display.tsx`, `.stories.tsx`, and `.mdx`: presentational avatar atom that accepts image URI and interaction callbacks.
-   Modify `packages/ui/stories/atoms/avatar-image.tsx`, `.stories.tsx`, and `.mdx`: preserve the legacy REST-backed avatar as a rollback-compatible wrapper around `AvatarDisplay`.
-   Create `packages/ui/stories/molecules/reading-list-card.tsx`, `.stories.tsx`, and `.mdx`: reusable reading summary card.
-   Create `packages/ui/stories/organisms/reading-history-list.tsx`, `.stories.tsx`, and `.mdx`: list/empty/error/refresh presentation.
-   Create `packages/ui/stories/organisms/new-reading-form.tsx`, `.stories.tsx`, and `.mdx`: question input, submit state, latest result presentation.
-   Create `packages/ui/stories/screens/reading-history-screen.tsx`, `.stories.tsx`, and `.mdx`: full mobile history screen wrapped in `MobileView`.
-   Create `packages/ui/stories/screens/new-reading-screen.tsx`, `.stories.tsx`, and `.mdx`: full mobile new-reading screen wrapped in `MobileView`.
-   Modify `packages/ui/index.tsx`: export the new screen components and types.
-   Modify `apps/tarot/src/app/readings/index.tsx`: consume `ReadingHistoryScreen`.
-   Modify `apps/tarot/src/app/readings/new.tsx`: consume `NewReadingScreen`.
-   Modify `apps/tarot/src/avatars/rsc-avatar-image.tsx`: render `AvatarDisplay` with data from the hooks package.
-   Modify `README.md`, `apps/tarot/README.md`, `packages/hooks/README.md`, `packages/ui/README.md`, and `docs/rsc-readings-and-avatars-pilot.md`: document package boundaries, screen ownership, hook ownership, Server Function wrappers, and rollback.

---

### Task 1: Move Shared API Contracts, Constants, and Clients to `@simpletarot/hooks`

**Files:**

-   Create: `packages/hooks/src/constants/tarot-api.ts`
-   Create: `packages/hooks/src/common/api-response.ts`
-   Create: `packages/hooks/src/readings/reading-contracts.ts`
-   Create: `packages/hooks/src/readings/reading-api-client.ts`
-   Create: `packages/hooks/src/readings/reading-requests.ts`
-   Create: `packages/hooks/src/avatars/avatar-contracts.ts`
-   Create: `packages/hooks/src/avatars/avatar-api-client.ts`
-   Modify: `packages/hooks/index.tsx`
-   Modify tests: move/adapt `apps/tarot/src/api/tarot-api.test.ts` and `apps/tarot/src/avatars/avatar-api.test.ts` into `packages/hooks/src/readings/reading-api-client.test.ts` and `packages/hooks/src/avatars/avatar-api-client.test.ts`
-   Modify compatibility imports in `apps/tarot/src/api/tarot-api.ts`, `apps/tarot/src/readings/reading-contracts.ts`, `apps/tarot/src/avatars/avatar-api.ts`, and `apps/tarot/src/avatars/avatar-contracts.ts`

**Interfaces:**

-   Consumes: current app-local contracts and REST clients.
-   Produces:

    -   `TAROT_API_ENV_KEYS`, `READINGS_ENDPOINT_PATH`, `AVATARS_ENDPOINT_PATH`
    -   `createTarotApiClient(options: { accessToken: string; baseUrl: string })`
    -   `createAvatarApiClient(options: { accessToken?: string; baseUrl: string })`
    -   `createOneCardReadingRequest(question?: string): ReadingRequest`
    -   exported reading and avatar contract types from `@simpletarot/hooks`

-   [ ] **Step 1: Add shared constants**

Create `packages/hooks/src/constants/tarot-api.ts`:

```ts
export const TAROT_API_ENV_KEYS = {
    apiUrl: 'EXPO_PUBLIC_TAROT_API_URL'
} as const;

export const READINGS_ENDPOINT_PATH = '/readings';
export const AVATARS_ENDPOINT_PATH = '/avatars';
export const JSON_CONTENT_TYPE = 'application/json';
```

-   [ ] **Step 2: Add shared JSON parsing helper**

Create `packages/hooks/src/common/api-response.ts`:

```ts
export type RequestMetadata = {
    method: 'GET' | 'POST';
    url: string;
    logPrefix: string;
};

const previewBody = (body: string) => body.slice(0, 240);

const contentTypeFor = (response: Response) => response.headers.get('content-type') ?? '';

export async function parseJsonResponse<T>(
    response: Response,
    request: RequestMetadata
): Promise<T> {
    const contentType = contentTypeFor(response);
    const textBody = await response.text();

    if (!contentType.toLowerCase().includes('application/json')) {
        console.warn(`${request.logPrefix} non-json response`, {
            bodyPreview: previewBody(textBody),
            contentType,
            method: request.method,
            status: response.status,
            url: request.url
        });

        throw new Error(
            `API returned ${contentType || 'non-JSON content'} for ${request.method} ${
                request.url
            } with status ${response.status}.`
        );
    }

    const body = textBody ? JSON.parse(textBody) : null;

    if (!response.ok) {
        const message =
            body &&
            typeof body === 'object' &&
            'message' in body &&
            typeof body.message === 'string'
                ? body.message
                : `Request failed with status ${response.status}.`;

        throw new Error(message);
    }

    return body as T;
}

export const trimTrailingSlashes = (value: string) => value.replace(/\/+$/, '');
```

-   [ ] **Step 3: Move reading and avatar contracts**

Move the existing type definitions from:

-   `apps/tarot/src/readings/reading-contracts.ts` to `packages/hooks/src/readings/reading-contracts.ts`
-   `apps/tarot/src/avatars/avatar-contracts.ts` to `packages/hooks/src/avatars/avatar-contracts.ts`

Leave app-local files as temporary re-exports:

```ts
export type {
    ReadingCitation,
    ReadingHistoryItem,
    ReadingHistoryResponse,
    ReadingItem,
    ReadingPositionResponse,
    ReadingRequest,
    ReadingResponse
} from '@simpletarot/hooks';
```

```ts
export type { AvatarsResponse } from '@simpletarot/hooks';
```

-   [ ] **Step 4: Move API clients**

Move `createTarotApiClient` and `createAvatarApiClient` into the hooks package. The app-local files should temporarily re-export the shared versions and keep `getTarotApiConfig` / `getAvatarApiConfig` app-local because they read Expo environment variables.

-   [ ] **Step 5: Extract the one-card reading request builder**

Create `packages/hooks/src/readings/reading-requests.ts`:

```ts
import type { ReadingRequest } from './reading-contracts';

export const SINGLE_CARD_SPREAD = 'single_card';
export const GUIDANCE_POSITION = 'guidance';
export const TEST_READING_CARD = {
    cardIndex: 0,
    cardName: 'The Fool',
    position: GUIDANCE_POSITION,
    reversed: false
} as const;

export function createOneCardReadingRequest(question?: string): ReadingRequest {
    const trimmedQuestion = question?.trim();

    return {
        spread: SINGLE_CARD_SPREAD,
        ...(trimmedQuestion ? { question: trimmedQuestion } : {}),
        items: [TEST_READING_CARD]
    };
}
```

-   [ ] **Step 6: Update package exports**

Add exports in `packages/hooks/index.tsx`:

```ts
export * from './src/constants/tarot-api';
export * from './src/readings/reading-contracts';
export * from './src/readings/reading-api-client';
export * from './src/readings/reading-requests';
export * from './src/avatars/avatar-contracts';
export * from './src/avatars/avatar-api-client';
```

-   [ ] **Step 7: Run verification**

Run:

```sh
yarn workspace @simpletarot/hooks build-types
yarn workspace @simpletarot/hooks test
yarn workspace tarot build-types
yarn workspace tarot test
```

Expected: all commands pass.

-   [ ] **Manual verification pause**

Stop and ask the user to verify: sign in, generate a reading, view history, and view account avatar behavior in the tarot app. Proceed only after the user confirms.

---

### Task 2: Move RSC-Backed Hook Logic Out of `apps/tarot`

**Files:**

-   Create: `packages/hooks/src/readings/use-rsc-reading-history.ts`
-   Create: `packages/hooks/src/avatars/use-rsc-avatar-image.ts`
-   Modify: `packages/hooks/index.tsx`
-   Modify: `apps/tarot/src/readings/server-actions.ts`
-   Modify: `apps/tarot/src/avatars/server-actions.ts`
-   Modify: `apps/tarot/src/readings/use-rsc-reading-history.ts`
-   Modify: `apps/tarot/src/avatars/use-rsc-avatar-image.ts`
-   Move/adapt tests: `apps/tarot/src/readings/use-rsc-reading-history.test.tsx` and `apps/tarot/src/avatars/use-rsc-avatar-image.test.tsx` into `packages/hooks`

**Interfaces:**

-   Consumes: thin Expo Server Functions from `apps/tarot`.
-   Produces:

    -   `useRscReadingHistory(options)` from `@simpletarot/hooks`
    -   `useRscAvatarImage(options)` from `@simpletarot/hooks`
    -   app-local files become temporary re-exports to reduce migration blast radius.

-   [ ] **Step 1: Move hook implementations**

Move the current hook bodies from app-local files into the hooks package. Keep dependency injection for server functions:

```ts
type UseRscReadingHistoryOptions = {
    accessToken: string | null | undefined;
    createOneCardReading: (input: CreateOneCardReadingInput) => Promise<ReadingResponse>;
    listReadings: (accessToken: string) => Promise<ReadingHistoryResponse>;
};
```

```ts
type UseRscAvatarImageOptions = {
    accessToken: string | null | undefined;
    listAvatarThumbnails: (accessToken: string) => Promise<AvatarsResponse>;
    random?: () => number;
    saved?: string;
};
```

Do not import app server actions from the hooks package.

-   [ ] **Step 2: Keep app server actions thin**

Update `apps/tarot/src/readings/server-actions.ts` so it imports shared clients and request builders:

```ts
'use server';

import 'server-only';

import {
    createOneCardReadingRequest,
    createTarotApiClient,
    type ReadingHistoryResponse,
    type ReadingResponse
} from '@simpletarot/hooks';

import { getTarotApiConfig } from '@/api/tarot-api';
```

The only app-specific responsibility should be reading `EXPO_PUBLIC_TAROT_API_URL` through `getTarotApiConfig` and creating the server-bound client.

-   [ ] **Step 3: Add React 19 resource follow-up**

Add a small exported completed adapter in the hooks package that can be used in a later route-level RSC pass without changing UI props:

```ts
export type ReadingHistoryResource = Promise<ReadingHistoryResponse>;

export function createReadingHistoryResource(
    accessToken: string,
    listReadings: (accessToken: string) => Promise<ReadingHistoryResponse>
): ReadingHistoryResource {
    return listReadings(accessToken);
}
```

This keeps the current Server Function flow stable while creating a clean place for React 19 `use(resource)` adoption in a Suspense boundary. Do not force route-level RSC in this task.

-   [ ] **Step 4: Update app-local compatibility exports**

Replace `apps/tarot/src/readings/use-rsc-reading-history.ts` and `apps/tarot/src/avatars/use-rsc-avatar-image.ts` with re-exports:

```ts
export {
    useRscReadingHistory,
    type UseRscReadingHistoryResult
} from '@simpletarot/hooks';
```

```ts
export { useRscAvatarImage, type UseRscAvatarImageResult } from '@simpletarot/hooks';
```

-   [ ] **Step 5: Run verification**

Run:

```sh
yarn workspace @simpletarot/hooks build-types
yarn workspace @simpletarot/hooks test
yarn workspace tarot build-types
yarn workspace tarot test
```

Expected: all commands pass.

-   [ ] **Manual verification pause**

Stop and ask the user to verify: readings still generate through Server Functions, history refresh works, and account avatar still loads/cycles. Proceed only after confirmation.

---

### Task 3: Centralize Avatar Presentation While Preserving Legacy Rollback

**Files:**

-   Create: `packages/ui/stories/atoms/avatar-display.tsx`
-   Create: `packages/ui/stories/atoms/avatar-display.stories.tsx`
-   Create: `packages/ui/stories/atoms/avatar-display.mdx`
-   Modify: `packages/ui/stories/atoms/avatar-image.tsx`
-   Modify: `packages/ui/stories/atoms/avatar-image.stories.tsx`
-   Modify: `packages/ui/stories/atoms/avatar-image.mdx`
-   Modify: `packages/ui/index.tsx`
-   Modify: `apps/tarot/src/avatars/rsc-avatar-image.tsx`

**Interfaces:**

-   Consumes: `avatarImage`, `getNewAvatarImage`, and `saveAvatarImage` from hooks.
-   Produces:

    -   `AvatarDisplay` presentational atom with no fetching.
    -   Legacy `AvatarImage` remains as REST/mock wrapper for rollback.
    -   `RscAvatarImage` becomes an app adapter that composes hooks data with `AvatarDisplay`.

-   [ ] **Step 1: Create presentational avatar atom**

Create `packages/ui/stories/atoms/avatar-display.tsx`:

```tsx
import Avatar from '@rneui/themed/dist/Avatar';

export type AvatarDisplayProps = {
    imageUri: string | undefined;
    onPress?: () => void;
    onLongPress?: () => void;
    size?: number | 'small' | 'medium' | 'large' | 'xlarge';
};

export default function AvatarDisplay({
    imageUri,
    onLongPress,
    onPress,
    size = 'xlarge'
}: AvatarDisplayProps) {
    return (
        <Avatar
            size={size}
            rounded
            source={imageUri ? { uri: imageUri } : undefined}
            containerStyle={{ margin: 10, borderColor: 'black', borderWidth: 1 }}
            onPress={onPress}
            onLongPress={onLongPress}
        />
    );
}
```

-   [ ] **Step 2: Update legacy avatar wrapper**

Change `packages/ui/stories/atoms/avatar-image.tsx` so it renders `AvatarDisplay` and keeps `useAvatarImage(apiBaseUrl)` as the rollback path.

-   [ ] **Step 3: Update RSC avatar adapter**

Change `apps/tarot/src/avatars/rsc-avatar-image.tsx`:

```tsx
'use client';

import { useRscAvatarImage } from '@simpletarot/hooks';
import { AvatarDisplay } from '@simpletarot/ui';
```

Render `AvatarDisplay` with the RSC hook output. Do not import `@rneui/themed` directly in `apps/tarot`.

-   [ ] **Step 4: Add stories and MDX**

Add stories for:

-   default avatar image
-   custom numeric size
-   press/long-press callbacks
-   legacy `AvatarImage` REST/mock path

Use the existing `avatarImagesMock` MSW setup for the legacy wrapper story.

-   [ ] **Step 5: Run verification**

Run:

```sh
yarn workspace @simpletarot/ui build-types
yarn workspace @simpletarot/hooks build-types
yarn workspace tarot build-types
```

Expected: all commands pass.

-   [ ] **Manual verification pause**

Stop and ask the user to verify: account avatar displays, tapping cycles images, long press behavior remains unchanged, and the Storybook avatar stories render. Proceed only after confirmation.

---

### Task 4: Extract Reading Presentation Into UI Atoms, Organisms, and Screens

**Files:**

-   Create: `packages/ui/stories/molecules/reading-list-card.tsx`
-   Create: `packages/ui/stories/molecules/reading-list-card.stories.tsx`
-   Create: `packages/ui/stories/molecules/reading-list-card.mdx`
-   Create: `packages/ui/stories/organisms/reading-history-list.tsx`
-   Create: `packages/ui/stories/organisms/reading-history-list.stories.tsx`
-   Create: `packages/ui/stories/organisms/reading-history-list.mdx`
-   Create: `packages/ui/stories/organisms/new-reading-form.tsx`
-   Create: `packages/ui/stories/organisms/new-reading-form.stories.tsx`
-   Create: `packages/ui/stories/organisms/new-reading-form.mdx`
-   Create: `packages/ui/stories/screens/reading-history-screen.tsx`
-   Create: `packages/ui/stories/screens/reading-history-screen.stories.tsx`
-   Create: `packages/ui/stories/screens/reading-history-screen.mdx`
-   Create: `packages/ui/stories/screens/new-reading-screen.tsx`
-   Create: `packages/ui/stories/screens/new-reading-screen.stories.tsx`
-   Create: `packages/ui/stories/screens/new-reading-screen.mdx`
-   Modify: `packages/ui/index.tsx`

**Interfaces:**

-   Consumes: reading contract types from `@simpletarot/hooks`.
-   Produces:

    -   `ReadingHistoryScreen`
    -   `NewReadingScreen`
    -   smaller presentational subcomponents with no route, auth, fetch, or environment knowledge.

-   [ ] **Step 1: Create `ReadingListCard` molecule**

Props:

```ts
export type ReadingListCardProps = {
    createdAtLabel: string;
    question: string;
    spread: string;
    summary: string;
};
```

This component renders one saved reading card. It does not format dates.

-   [ ] **Step 2: Create `ReadingHistoryList` organism**

Props:

```ts
export type ReadingHistoryListProps = {
    emptyMessage: string;
    isLoading: boolean;
    onCreateReadingPress: () => void;
    onRefresh: () => void;
    readings: Array<{
        createdAtLabel: string;
        key: string;
        question: string;
        spread: string;
        summary: string;
    }>;
};
```

This organism owns `ScrollView`, `RefreshControl`, empty state, and the repeated `ReadingListCard` rows.

-   [ ] **Step 3: Create `NewReadingForm` organism**

Props:

```ts
export type NewReadingFormProps = {
    error?: string | null;
    isGenerating: boolean;
    latestReading?: {
        positions: Array<{
            cardIndex: number;
            cardName: string;
            position: string;
            text: string;
        }>;
        summary: string;
    } | null;
    onBackPress: () => void;
    onGeneratePress: (question: string) => Promise<void> | void;
    onHistoryPress: () => void;
};
```

This organism may own the local `question` text input state because it is form presentation state, not data fetching.

-   [ ] **Step 4: Create `ReadingHistoryScreen`**

Wrap in `MobileView`. Props:

```ts
export type ReadingHistoryScreenProps = {
    error?: string | null;
    isAuthLoading: boolean;
    isLoading: boolean;
    isSignedIn: boolean;
    onCreateReadingPress: () => void;
    onRefresh: () => void;
    onSignInPress: () => void;
    readings: ReadingHistoryListProps['readings'];
};
```

-   [ ] **Step 5: Create `NewReadingScreen`**

Wrap in `MobileView`. Props:

```ts
export type NewReadingScreenProps = {
    error?: string | null;
    isAuthLoading: boolean;
    isGenerating: boolean;
    isSignedIn: boolean;
    latestReading: NewReadingFormProps['latestReading'];
    onBackPress: () => void;
    onGeneratePress: (question: string) => Promise<void> | void;
    onHistoryPress: () => void;
    onSignInPress: () => void;
};
```

-   [ ] **Step 6: Add stories and MDX for every new component**

Stories must cover:

-   signed-out screen
-   auth-loading screen
-   empty history
-   populated history
-   history error
-   new-reading empty form
-   new-reading generating state
-   new-reading latest result
-   new-reading error

-   [ ] **Step 7: Export new UI components**

Add exports in `packages/ui/index.tsx` for the new screens and public prop types.

-   [ ] **Step 8: Run verification**

Run:

```sh
yarn workspace @simpletarot/ui build-types
```

Expected: UI package type build passes.

-   [ ] **Manual verification pause**

Stop and ask the user to verify Storybook for the new reading screens and forms. Proceed only after confirmation.

---

### Task 5: Make Tarot Routes Thin Consumers of Full Screen Components

**Files:**

-   Modify: `apps/tarot/src/app/readings/index.tsx`
-   Modify: `apps/tarot/src/app/readings/new.tsx`
-   Modify: `apps/tarot/src/app/account.tsx` only if imports need cleanup after avatar extraction
-   Modify tests: `apps/tarot/src/readings/use-rsc-reading-history.test.tsx` only if it remains as a compatibility test; otherwise remove after hooks package coverage exists

**Interfaces:**

-   Consumes: `ReadingHistoryScreen`, `NewReadingScreen`, and hooks from packages.
-   Produces: Expo routes that only compose auth, navigation, data hooks, and screen props.

-   [ ] **Step 1: Replace inline history screen**

`apps/tarot/src/app/readings/index.tsx` should import:

```ts
import { useRscReadingHistory } from '@simpletarot/hooks';
import { ReadingHistoryScreen } from '@simpletarot/ui';
```

Keep only:

-   `useAuth()`
-   `useRouter()`
-   date formatting for route-specific labels, or move date formatting to a package utility if reused elsewhere
-   screen prop mapping

-   [ ] **Step 2: Replace inline new-reading screen**

`apps/tarot/src/app/readings/new.tsx` should import:

```ts
import { useRscReadingHistory } from '@simpletarot/hooks';
import { NewReadingScreen } from '@simpletarot/ui';
```

Keep only:

-   `useAuth()`
-   `useRouter()`
-   `createTestReading(question)` callback
-   screen prop mapping

-   [ ] **Step 3: Remove duplicated styles and magic copy from app routes**

After route migration, the readings routes should have no `StyleSheet.create`, no `TextInput`, no `Pressable`, and no hard-coded screen copy except route labels that are not reused. Reusable screen strings belong in the UI component or a UI constants module.

-   [ ] **Step 4: Run verification**

Run:

```sh
yarn workspace @simpletarot/ui build-types
yarn workspace @simpletarot/hooks build-types
yarn workspace tarot build-types
yarn workspace tarot test
```

Expected: all commands pass.

-   [ ] **Manual verification pause**

Stop and ask the user to verify in the tarot app: signed-out readings redirect prompt, history list, pull-to-refresh, new reading generation, latest reading preview, back/history navigation, and account avatar. Proceed only after confirmation.

---

### Task 6: Adopt React 19 Promise Resources Where Stable

**Files:**

-   Modify: `packages/hooks/src/readings/use-rsc-reading-history.ts`
-   Modify: `packages/hooks/src/avatars/use-rsc-avatar-image.ts`
-   Add or modify tests in `packages/hooks/src/readings` and `packages/hooks/src/avatars`
-   Modify: `apps/tarot/src/app/readings/index.tsx` if it can pass an initial resource safely
-   Modify: `apps/tarot/src/avatars/rsc-avatar-image.tsx` if avatar thumbnails can use an initial resource safely

**Interfaces:**

-   Consumes: existing Server Function Promise-returning APIs.
-   Produces: a Suspense-compatible initial load path without forcing full route-level RSC or removing event-driven refresh/create flows.

-   [ ] **Step 1: Audit current fetch triggers**

Confirm which current loads are render-time data reads and which are event-driven:

-   History initial list load: candidate for `use(resource)` behind Suspense.
-   Avatar initial thumbnail load: candidate for `use(resource)` behind Suspense.
-   Pull-to-refresh: remains event-driven.
-   Generate reading: remains event-driven.
-   Auth session restoration: remains client state because it uses SecureStore/browser/native APIs.

-   [ ] **Step 2: Add resource-aware hook overloads**

Add optional `initialReadingsResource?: Promise<ReadingHistoryResponse>` and `initialAvatarsResource?: Promise<AvatarsResponse>` inputs. Where present, unwrap with React 19 `use()` inside the hook or a small package-level adapter; where absent, keep the current stable event-driven path.

Do not create a new Promise on every render. A route may pass a memoized or server-created Promise, but the hook must not call a Server Function directly during render without a stable resource.

-   [ ] **Step 3: Add Suspense and error-boundary tests**

Tests should verify:

-   pending resource suspends
-   fulfilled resource seeds initial data
-   rejected resource bubbles to an error boundary
-   manual refresh still works after the initial resource resolves

-   [ ] **Step 4: Wire only the safe initial resources**

If Expo Server Function behavior is stable in this repo, wire initial resources in the tarot route adapters. If not, leave the resource APIs exported and document that full use awaits route-level RSC/server-created Promise support.

-   [ ] **Step 5: Run verification**

Run:

```sh
yarn workspace @simpletarot/hooks build-types
yarn workspace @simpletarot/hooks test
yarn workspace tarot build-types
yarn workspace tarot test
```

Expected: all commands pass.

-   [ ] **Manual verification pause**

Stop and ask the user to verify loading states, error states where possible, history refresh, and avatar cycling. Proceed only after confirmation.

---

### Task 7: Documentation and Agent Guidance Pass

**Files:**

-   Modify: `README.md`
-   Modify: `apps/tarot/README.md`
-   Modify: `packages/hooks/README.md`
-   Modify: `packages/ui/README.md`
-   Modify: `docs/rsc-readings-and-avatars-pilot.md`
-   Modify: `apps/tarot/AGENTS.md` and `apps/tarot/CLAUDE.md` if they mention app-local ownership that is no longer true

**Interfaces:**

-   Consumes: final package boundaries from Tasks 1-6.
-   Produces: durable architecture documentation that future users and agents can follow without reading historical plan files.

-   [ ] **Step 1: Update root README architecture index**

Document:

-   `packages/hooks` owns reusable hooks, API clients, contracts, constants, and resource helpers.
-   `packages/ui` owns atoms/molecules/organisms/screens and Storybook docs.
-   `apps/tarot` owns Expo Router routes, auth/session integration, navigation, and Server Function wrappers.

-   [ ] **Step 2: Update tarot app README**

Clarify:

-   routes consume full screen components from `@simpletarot/ui`
-   app-local Server Functions wrap shared hooks clients
-   Expo public config remains `EXPO_PUBLIC_TAROT_API_URL`
-   legacy avatar rollback remains available through the UI atom and hooks fallback

-   [ ] **Step 3: Update hooks README**

List new exported modules:

-   reading contracts and client
-   avatar contracts and client
-   RSC-backed hooks/resource helpers
-   constants

-   [ ] **Step 4: Update UI README**

Document the component layering convention:

-   atoms are visual primitives
-   molecules combine atoms into focused rows/cards
-   organisms own compound sections/forms/lists
-   screens are mobile screens and must use `MobileView`
-   every component needs `.stories.tsx` and `.mdx`

-   [ ] **Step 5: Update RSC pilot doc**

Replace app-local ownership language with package-boundary language and keep rollback guidance explicit:

-   RSC server actions remain in app
-   data clients and hooks live in hooks
-   screen presentation lives in UI
-   legacy avatar component remains available for rollback

-   [ ] **Step 6: Validate docs**

Run:

```sh
rg -n "apps/tarot/src/readings/use-rsc-reading-history|apps/tarot/src/avatars/use-rsc-avatar-image|app-local hook|stale" README.md apps docs packages .agents
git diff --check
```

Expected: no stale architecture claims and no whitespace errors.

-   [ ] **Manual verification pause**

Stop and ask the user to review the docs for architecture clarity before any final cleanup or commits.

---

### Task 8: Remove Temporary Compatibility Shims After Verification

**Files:**

-   Delete or simplify: `apps/tarot/src/api/tarot-api.ts`
-   Delete or simplify: `apps/tarot/src/readings/reading-contracts.ts`
-   Delete or simplify: `apps/tarot/src/readings/use-rsc-reading-history.ts`
-   Delete or simplify: `apps/tarot/src/avatars/avatar-api.ts`
-   Delete or simplify: `apps/tarot/src/avatars/avatar-contracts.ts`
-   Delete or simplify: `apps/tarot/src/avatars/use-rsc-avatar-image.ts`
-   Update imports in app tests and source files

**Interfaces:**

-   Consumes: completed app imports from package exports.
-   Produces: no misleading app-local copies of reusable hooks/contracts/clients.

-   [ ] **Step 1: Search for app-local imports**

Run:

```sh
rg -n "@/api/tarot-api|@/readings/reading-contracts|@/readings/use-rsc-reading-history|@/avatars/avatar-api|@/avatars/avatar-contracts|@/avatars/use-rsc-avatar-image" apps/tarot packages
```

Expected: only server-action environment helpers remain app-local, or no matches if helpers were renamed.

-   [ ] **Step 2: Remove shims that no longer have imports**

Delete only files with zero imports. If a file still owns app-only environment reading, rename it to make that responsibility explicit, such as `apps/tarot/src/config/tarot-api-config.ts`.

-   [ ] **Step 3: Run full package verification**

Run:

```sh
yarn workspace @simpletarot/hooks build-types
yarn workspace @simpletarot/hooks test
yarn workspace @simpletarot/ui build-types
yarn workspace tarot build-types
yarn workspace tarot test
git diff --check
```

Expected: all commands pass.

-   [ ] **Manual verification pause**

Stop and ask the user for final manual verification across account, avatar, reading history, and new reading generation before merge/commit cleanup.

---

## Self-Review

Spec coverage: This plan covers moving reusable data fetching and contracts from `apps/tarot` to `packages/hooks`, moving presentation and full mobile screens to `packages/ui`, preserving `MobileView` screen wrapping, keeping the RSC avatar interchangeable with the legacy avatar, adding stories and MDX for all UI changes, avoiding reusable magic strings through constants, documenting Expo public environment values, planning a React 19 `use()` resource path, and adding manual user verification pauses between implementation tasks.

Placeholder scan: No task relies on placeholder language. Every task names concrete files, interfaces, verification commands, and expected manual validation.

Type consistency: Shared reading/avatar contracts originate in `@simpletarot/hooks`; UI screens consume typed view models rather than API clients; app routes compose auth/navigation/server actions and pass props to UI screens.
