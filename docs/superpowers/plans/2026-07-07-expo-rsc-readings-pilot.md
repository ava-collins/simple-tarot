# Expo RSC Readings Pilot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Introduce React Server Components safely in the Expo tarot app by moving the authenticated readings API orchestration behind Expo Server Functions while keeping native auth, navigation, and form state client-side.

**Architecture:** Use Expo Router's current beta RSC support in Server Function mode first, not full route-level Server Component mode. The mobile app keeps `AuthProvider`, `Stack`, `SecureStore`, form inputs, refresh controls, and navigation in Client Components, while server-only modules centralize calls to the existing Express readings API. This gives the app a small RSC integration surface that can later grow to GraphQL-backed card/spread content.

**Tech Stack:** Expo SDK 57, Expo Router, React 19, React Native 0.86, TypeScript, Vitest, existing Express readings API in `apps/api`, existing Cognito access tokens from `apps/tarot/src/auth`.

## Global Constraints

- Expo RSC is beta and subject to breaking changes; do not enable full `reactServerComponentRoutes` in the first implementation.
- Keep `apps/tarot/src/app/_layout.tsx` as a Client Component because it uses `Stack`, `ThemeProvider`, `AuthProvider`, and `useColorScheme`.
- Keep Cognito password auth, sign-out browser flow, token persistence, and session restoration client-side because they use native/browser APIs and `expo-secure-store`.
- Server Functions accept only serializable arguments and return serializable values.
- Server-only code must not import React hooks, Expo native modules, `expo-router` navigation hooks, `SecureStore`, or React Native APIs that are unsupported in server bundles.
- Use `process.env.EXPO_OS` instead of `Platform.OS` inside server-bundled code.
- Configure `web.output` as `"single"` while using Expo RSC developer-preview behavior.
- Do not remove the existing Express `apps/api` Lambda/API Gateway deployment; RSC should wrap or consume it first.
- Prefer tests around the contract boundary before wiring routes.

---

## Existing API Inspection

### Best RSC candidate: readings REST API

**Current implementation:**
- Client API wrapper: `apps/tarot/src/api/tarot-api.ts`
- Client hook: `apps/tarot/src/readings/use-reading-history.ts`
- Routes that call the hook: `apps/tarot/src/app/readings/index.tsx`, `apps/tarot/src/app/readings/new.tsx`
- Backend: `apps/api/src/routes/readings.ts`

**Why it fits RSC:**
- It already has a clean request/response contract.
- The mobile client currently owns API URL handling, JSON diagnostics, request construction, refresh after create, and error state.
- The backend call is a good server-boundary candidate because it can eventually hide infrastructure URLs and consolidate logging/retry behavior.
- It can be piloted with Server Functions without changing the Express API, Bedrock integration, or DynamoDB persistence.

**What should stay client-side:**
- Access-token ownership remains in `AuthProvider`.
- The `TextInput`, button disabled state, pull-to-refresh gesture, route redirects, and local latest-reading preview remain Client Component concerns.

### Secondary RSC candidate: graph/card/spread content API

**Current implementation:**
- GraphQL backend: `apps/graph-api/src/index.ts`, `apps/graph-api/src/schema.graphql`, `apps/graph-api/src/resolvers.ts`
- Apollo example/client: `packages/ui/stories/organisms/display-card-names.tsx`, `packages/ui/stories/templates/mobile-apollo-client.ts`

**Why it can benefit later:**
- Card names, spread definitions, and card-position meanings are read-heavy and do not need direct native APIs.
- A Server Function could fetch from Neo4j GraphQL and return serialized card/spread data or streamed UI.

**Why it should not be first:**
- The production mobile routes inspected here are centered on readings and auth.
- The GraphQL consumer appears mostly in Storybook/shared UI examples, not the active mobile reading screens.

### Poor RSC candidate: Cognito password auth and token storage

**Current implementation:**
- Cognito API calls: `apps/tarot/src/auth/cognito-password-auth.ts`
- Session/context: `apps/tarot/src/auth/auth-context.tsx`
- Secure storage: `apps/tarot/src/auth/token-storage.ts`

**Why not first:**
- Auth depends on native secure storage, interactive browser sign-out, and app-local session restoration.
- Moving sign-in server-side would require a broader auth/session architecture decision and does not directly optimize the existing readings API path.

## File Structure

- Modify `apps/tarot/package.json`: add the RSC dependency and any scripts needed for RSC verification.
- Modify `apps/tarot/app.json`: enable Server Functions and set web output to `"single"`.
- Modify `apps/tarot/expo-env.d.ts`: include React canary types for RSC where Expo requires them.
- Create `apps/tarot/src/readings/reading-contracts.ts`: shared serializable types for readings used by client and server action code.
- Modify `apps/tarot/src/api/tarot-api.ts`: re-export or consume shared reading contracts and keep pure fetch behavior reusable from server code.
- Create `apps/tarot/src/readings/server-actions.ts`: `'use server'` functions for listing readings and creating the one-card test reading through the existing API.
- Create `apps/tarot/src/readings/use-rsc-reading-history.ts`: Client Component hook that calls Server Functions while preserving the old hook API shape.
- Modify `apps/tarot/src/app/readings/index.tsx`: use the RSC-backed hook.
- Modify `apps/tarot/src/app/readings/new.tsx`: use the RSC-backed hook.
- Create `apps/tarot/src/readings/server-actions.test.ts`: tests for serialized request construction and response/error mapping.
- Create or modify `apps/tarot/src/readings/use-rsc-reading-history.test.tsx`: tests for hook behavior, loading state, generation, refresh, and unauthenticated behavior.
- Modify `apps/tarot/src/readings/use-reading-history.ts`: keep as compatibility fallback or rename only after the RSC hook is stable.

---

### Task 1: Enable Expo Server Functions

**Files:**
- Modify: `apps/tarot/package.json`
- Modify: `apps/tarot/app.json`
- Modify: `apps/tarot/expo-env.d.ts`

**Interfaces:**
- Consumes: Expo Router app with `main: "expo-router/entry"`.
- Produces: Project config capable of compiling Expo Server Functions without enabling full route-level RSC.

- [ ] **Step 1: Add RSC dependency**

Run:

```bash
yarn workspace tarot add react-server-dom-webpack
```

Expected: `apps/tarot/package.json` includes `react-server-dom-webpack`, and `yarn.lock` changes.

- [ ] **Step 2: Enable Server Functions in app config**

Change `apps/tarot/app.json` so the relevant sections are:

```json
{
  "expo": {
    "web": {
      "output": "single",
      "favicon": "./assets/images/favicon.png"
    },
    "experiments": {
      "typedRoutes": true,
      "reactCompiler": true,
      "reactServerFunctions": true
    }
  }
}
```

Expected: `reactServerComponentRoutes` is not present.

- [ ] **Step 3: Add React canary reference**

At the top of `apps/tarot/expo-env.d.ts`, add:

```ts
/// <reference types="react/canary" />
```

Expected: TypeScript recognizes async server action usage without per-route reference comments.

- [ ] **Step 4: Verify config build**

Run:

```bash
yarn workspace tarot build-types
```

Expected: PASS with no TypeScript errors.

- [ ] **Step 5: Commit**

```bash
git add apps/tarot/package.json apps/tarot/app.json apps/tarot/expo-env.d.ts yarn.lock
git commit -m "feat(tarot): enable expo server functions"
```

---

### Task 2: Extract Shared Reading Contracts

**Files:**
- Create: `apps/tarot/src/readings/reading-contracts.ts`
- Modify: `apps/tarot/src/api/tarot-api.ts`
- Modify: `apps/tarot/src/api/tarot-api.test.ts`

**Interfaces:**
- Consumes: Existing reading types from `apps/tarot/src/api/tarot-api.ts`.
- Produces: `ReadingItem`, `ReadingRequest`, `ReadingCitation`, `ReadingPositionResponse`, `ReadingResponse`, `ReadingHistoryItem`, and `ReadingHistoryResponse` from `@/readings/reading-contracts`.

- [ ] **Step 1: Create shared contract module**

Create `apps/tarot/src/readings/reading-contracts.ts`:

```ts
export type ReadingItem = {
    cardIndex: number;
    cardName: string;
    position: string;
    reversed: boolean;
};

export type ReadingRequest = {
    spread: string;
    items: ReadingItem[];
    question?: string;
};

export type ReadingCitation = {
    sourceId: string;
    text: string;
    metadata: Record<string, unknown>;
};

export type ReadingPositionResponse = ReadingItem & {
    text: string;
};

export type ReadingResponse = {
    readingId: string;
    spread: string;
    summary: string;
    positions: ReadingPositionResponse[];
    citations: ReadingCitation[];
    metadata: {
        mode: 'local' | 'bedrock';
        itemCount: number;
        modelId?: string;
    };
};

export type ReadingHistoryItem = {
    createdAt: string;
    metadata: ReadingResponse['metadata'];
    question?: string;
    readingId: string;
    spread: string;
    summary: string;
};

export type ReadingHistoryResponse = {
    readings: ReadingHistoryItem[];
};
```

- [ ] **Step 2: Re-export contracts from API module**

In `apps/tarot/src/api/tarot-api.ts`, replace local reading type declarations with:

```ts
export type {
    ReadingCitation,
    ReadingHistoryItem,
    ReadingHistoryResponse,
    ReadingItem,
    ReadingPositionResponse,
    ReadingRequest,
    ReadingResponse
} from '@/readings/reading-contracts';

import type {
    ReadingHistoryResponse,
    ReadingRequest,
    ReadingResponse
} from '@/readings/reading-contracts';
```

Keep the existing `TarotApiConfig`, `TarotApiClient`, `getTarotApiConfig`, and `createTarotApiClient` implementations.

- [ ] **Step 3: Verify existing API tests still pass**

Run:

```bash
yarn workspace tarot test apps/tarot/src/api/tarot-api.test.ts
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/tarot/src/readings/reading-contracts.ts apps/tarot/src/api/tarot-api.ts apps/tarot/src/api/tarot-api.test.ts
git commit -m "refactor(tarot): share reading API contracts"
```

---

### Task 3: Add Server Functions for Readings

**Files:**
- Create: `apps/tarot/src/readings/server-actions.ts`
- Create: `apps/tarot/src/readings/server-actions.test.ts`

**Interfaces:**
- Consumes: `createTarotApiClient`, `getTarotApiConfig`, `ReadingHistoryResponse`, `ReadingResponse`.
- Produces:
  - `listReadingsOnServer(accessToken: string): Promise<ReadingHistoryResponse>`
  - `createOneCardReadingOnServer(input: CreateOneCardReadingInput): Promise<ReadingResponse>`

- [ ] **Step 1: Write failing tests**

Create `apps/tarot/src/readings/server-actions.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/api/tarot-api', () => ({
    createTarotApiClient: vi.fn(),
    getTarotApiConfig: vi.fn(() => ({
        baseUrl: 'https://api.example.com'
    }))
}));

import {
    createOneCardReadingOnServer,
    listReadingsOnServer
} from './server-actions';
import { createTarotApiClient } from '@/api/tarot-api';

const createClientMock = vi.mocked(createTarotApiClient);

describe('reading server actions', () => {
    beforeEach(() => {
        createClientMock.mockReset();
    });

    it('lists readings through the existing API client with the access token', async () => {
        const response = { readings: [] };
        const listReadings = vi.fn().mockResolvedValue(response);
        createClientMock.mockReturnValue({
            createReading: vi.fn(),
            listReadings
        });

        await expect(listReadingsOnServer('access-token')).resolves.toEqual(response);

        expect(createClientMock).toHaveBeenCalledWith({
            accessToken: 'access-token',
            baseUrl: 'https://api.example.com'
        });
        expect(listReadings).toHaveBeenCalledOnce();
    });

    it('creates the canonical one-card reading request through the existing API client', async () => {
        const response = {
            citations: [],
            metadata: { itemCount: 1, mode: 'local' as const },
            positions: [],
            readingId: 'reading-1',
            spread: 'single_card',
            summary: 'A clear beginning.'
        };
        const createReading = vi.fn().mockResolvedValue(response);
        createClientMock.mockReturnValue({
            createReading,
            listReadings: vi.fn()
        });

        await expect(
            createOneCardReadingOnServer({
                accessToken: 'access-token',
                question: '  What should I notice today?  '
            })
        ).resolves.toEqual(response);

        expect(createReading).toHaveBeenCalledWith({
            spread: 'single_card',
            question: 'What should I notice today?',
            items: [
                {
                    cardIndex: 0,
                    cardName: 'The Fool',
                    position: 'guidance',
                    reversed: false
                }
            ]
        });
    });

    it('omits a blank question from the request payload', async () => {
        const createReading = vi.fn().mockResolvedValue({
            citations: [],
            metadata: { itemCount: 1, mode: 'local' as const },
            positions: [],
            readingId: 'reading-1',
            spread: 'single_card',
            summary: 'A clear beginning.'
        });
        createClientMock.mockReturnValue({
            createReading,
            listReadings: vi.fn()
        });

        await createOneCardReadingOnServer({
            accessToken: 'access-token',
            question: '   '
        });

        expect(createReading).toHaveBeenCalledWith({
            spread: 'single_card',
            items: [
                {
                    cardIndex: 0,
                    cardName: 'The Fool',
                    position: 'guidance',
                    reversed: false
                }
            ]
        });
    });
});
```

- [ ] **Step 2: Run tests to verify failure**

Run:

```bash
yarn workspace tarot test apps/tarot/src/readings/server-actions.test.ts
```

Expected: FAIL because `apps/tarot/src/readings/server-actions.ts` does not exist.

- [ ] **Step 3: Implement server actions**

Create `apps/tarot/src/readings/server-actions.ts`:

```ts
'use server';

import 'server-only';

import {
    createTarotApiClient,
    getTarotApiConfig
} from '@/api/tarot-api';
import type {
    ReadingHistoryResponse,
    ReadingRequest,
    ReadingResponse
} from './reading-contracts';

export type CreateOneCardReadingInput = {
    accessToken: string;
    question?: string;
};

const createServerClient = (accessToken: string) =>
    createTarotApiClient({
        ...getTarotApiConfig(),
        accessToken
    });

const oneCardReadingRequest = (question?: string): ReadingRequest => {
    const trimmedQuestion = question?.trim();

    return {
        spread: 'single_card',
        ...(trimmedQuestion ? { question: trimmedQuestion } : {}),
        items: [
            {
                cardIndex: 0,
                cardName: 'The Fool',
                position: 'guidance',
                reversed: false
            }
        ]
    };
};

export async function listReadingsOnServer(
    accessToken: string
): Promise<ReadingHistoryResponse> {
    return createServerClient(accessToken).listReadings();
}

export async function createOneCardReadingOnServer({
    accessToken,
    question
}: CreateOneCardReadingInput): Promise<ReadingResponse> {
    return createServerClient(accessToken).createReading(
        oneCardReadingRequest(question)
    );
}
```

- [ ] **Step 4: Run tests to verify pass**

Run:

```bash
yarn workspace tarot test apps/tarot/src/readings/server-actions.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/tarot/src/readings/server-actions.ts apps/tarot/src/readings/server-actions.test.ts
git commit -m "feat(tarot): add reading server functions"
```

---

### Task 4: Add RSC-Backed Reading Hook

**Files:**
- Create: `apps/tarot/src/readings/use-rsc-reading-history.ts`
- Create: `apps/tarot/src/readings/use-rsc-reading-history.test.tsx`

**Interfaces:**
- Consumes:
  - `listReadings?: (accessToken: string) => Promise<ReadingHistoryResponse>`
  - `createOneCardReading?: (input: CreateOneCardReadingInput) => Promise<ReadingResponse>`
- Produces: `useRscReadingHistory(options): UseRscReadingHistoryResult`, matching the current `useReadingHistory` result shape.

- [ ] **Step 1: Write failing hook tests**

Create `apps/tarot/src/readings/use-rsc-reading-history.test.tsx` by copying the structure of `apps/tarot/src/readings/use-reading-history.test.tsx`, then change the probe import and injected operations:

```ts
import TestRenderer, { act } from 'react-test-renderer';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
    useRscReadingHistory,
    type UseRscReadingHistoryResult
} from './use-rsc-reading-history';
import type {
    ReadingHistoryResponse,
    ReadingResponse
} from './reading-contracts';

const historyResponse: ReadingHistoryResponse = {
    readings: [
        {
            createdAt: '2026-07-02T14:00:00.000Z',
            metadata: {
                itemCount: 1,
                mode: 'local',
                modelId: 'local-test-variant-1'
            },
            question: 'What should I notice today?',
            readingId: 'local-single_card-0',
            spread: 'single_card',
            summary: 'Local test reading variant 1: one clear card anchors the moment.'
        }
    ]
};

const readingResponse: ReadingResponse = {
    citations: [],
    metadata: {
        itemCount: 1,
        mode: 'local',
        modelId: 'local-test-variant-1'
    },
    positions: [],
    readingId: 'local-single_card-0',
    spread: 'single_card',
    summary: 'Local test reading variant 1: one clear card anchors the moment.'
};

function HookProbe({
    accessToken,
    createOneCardReading,
    listReadings,
    onRender
}: {
    accessToken: string | null;
    createOneCardReading: (input: {
        accessToken: string;
        question?: string;
    }) => Promise<ReadingResponse>;
    listReadings: (accessToken: string) => Promise<ReadingHistoryResponse>;
    onRender: (result: UseRscReadingHistoryResult) => void;
}) {
    onRender(
        useRscReadingHistory({
            accessToken,
            createOneCardReading,
            listReadings
        })
    );

    return null;
}

describe('useRscReadingHistory', () => {
    beforeEach(() => {
        (
            globalThis as typeof globalThis & {
                IS_REACT_ACT_ENVIRONMENT: boolean;
            }
        ).IS_REACT_ACT_ENVIRONMENT = true;
        const consoleError = console.error;

        vi.spyOn(console, 'error').mockImplementation((message?: unknown, ...args) => {
            const text = typeof message === 'string' ? message : '';

            if (
                text.includes('react-test-renderer is deprecated') ||
                text.includes('The current testing environment is not configured to support act')
            ) {
                return;
            }

            consoleError(message, ...args);
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('loads successful readings for signed-in users', async () => {
        const listReadings = vi.fn().mockResolvedValue(historyResponse);
        const createOneCardReading = vi.fn().mockResolvedValue(readingResponse);
        let result: UseRscReadingHistoryResult | undefined;

        await act(async () => {
            TestRenderer.create(
                <HookProbe
                    accessToken="access-token"
                    createOneCardReading={createOneCardReading}
                    listReadings={listReadings}
                    onRender={nextResult => {
                        result = nextResult;
                    }}
                />
            );
        });

        expect(listReadings).toHaveBeenCalledWith('access-token');
        expect(result?.readings).toEqual(historyResponse.readings);
        expect(result?.error).toBeNull();
    });

    it('generates a reading through the server function and refreshes history', async () => {
        const listReadings = vi.fn().mockResolvedValue(historyResponse);
        const createOneCardReading = vi.fn().mockResolvedValue(readingResponse);
        let result: UseRscReadingHistoryResult | undefined;

        await act(async () => {
            TestRenderer.create(
                <HookProbe
                    accessToken="access-token"
                    createOneCardReading={createOneCardReading}
                    listReadings={listReadings}
                    onRender={nextResult => {
                        result = nextResult;
                    }}
                />
            );
        });

        await act(async () => {
            await result?.createTestReading('What should I notice today?');
        });

        expect(createOneCardReading).toHaveBeenCalledWith({
            accessToken: 'access-token',
            question: 'What should I notice today?'
        });
        expect(listReadings).toHaveBeenCalledTimes(2);
        expect(result?.latestReading).toEqual(readingResponse);
    });

    it('does not call server functions without an access token', async () => {
        const listReadings = vi.fn().mockResolvedValue(historyResponse);
        const createOneCardReading = vi.fn().mockResolvedValue(readingResponse);

        await act(async () => {
            TestRenderer.create(
                <HookProbe
                    accessToken={null}
                    createOneCardReading={createOneCardReading}
                    listReadings={listReadings}
                    onRender={() => undefined}
                />
            );
        });

        expect(listReadings).not.toHaveBeenCalled();
        expect(createOneCardReading).not.toHaveBeenCalled();
    });
});
```

- [ ] **Step 2: Run tests to verify failure**

Run:

```bash
yarn workspace tarot test apps/tarot/src/readings/use-rsc-reading-history.test.tsx
```

Expected: FAIL because `use-rsc-reading-history.ts` does not exist.

- [ ] **Step 3: Implement RSC-backed hook**

Create `apps/tarot/src/readings/use-rsc-reading-history.ts`:

```ts
'use client';

import { useCallback, useEffect, useState } from 'react';

import {
    createOneCardReadingOnServer,
    listReadingsOnServer,
    type CreateOneCardReadingInput
} from './server-actions';
import type {
    ReadingHistoryItem,
    ReadingHistoryResponse,
    ReadingResponse
} from './reading-contracts';

type UseRscReadingHistoryOptions = {
    accessToken: string | null | undefined;
    createOneCardReading?: (
        input: CreateOneCardReadingInput
    ) => Promise<ReadingResponse>;
    listReadings?: (accessToken: string) => Promise<ReadingHistoryResponse>;
};

export type UseRscReadingHistoryResult = {
    createTestReading: (question?: string) => Promise<ReadingResponse | null>;
    error: string | null;
    isGenerating: boolean;
    isLoading: boolean;
    latestReading: ReadingResponse | null;
    readings: ReadingHistoryItem[];
    refresh: () => Promise<void>;
};

const getErrorMessage = (error: unknown, fallback: string) =>
    error instanceof Error ? error.message : fallback;

export function useRscReadingHistory({
    accessToken,
    createOneCardReading = createOneCardReadingOnServer,
    listReadings = listReadingsOnServer
}: UseRscReadingHistoryOptions): UseRscReadingHistoryResult {
    const [error, setError] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [latestReading, setLatestReading] = useState<ReadingResponse | null>(null);
    const [readings, setReadings] = useState<ReadingHistoryItem[]>([]);

    const refresh = useCallback(async () => {
        if (!accessToken) {
            setReadings([]);

            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await listReadings(accessToken);

            setReadings(response.readings);
        } catch (refreshError) {
            setError(
                getErrorMessage(refreshError, 'Unable to load reading history.')
            );
        } finally {
            setIsLoading(false);
        }
    }, [accessToken, listReadings]);

    const createTestReading = useCallback(
        async (question?: string) => {
            if (!accessToken) {
                return null;
            }

            setIsGenerating(true);
            setError(null);

            try {
                const reading = await createOneCardReading({
                    accessToken,
                    question
                });

                setLatestReading(reading);
                await refresh();

                return reading;
            } catch (generationError) {
                setError(
                    getErrorMessage(generationError, 'Unable to generate reading.')
                );

                return null;
            } finally {
                setIsGenerating(false);
            }
        },
        [accessToken, createOneCardReading, refresh]
    );

    useEffect(() => {
        void refresh();
    }, [refresh]);

    return {
        createTestReading,
        error,
        isGenerating,
        isLoading,
        latestReading,
        readings,
        refresh
    };
}
```

- [ ] **Step 4: Run hook tests**

Run:

```bash
yarn workspace tarot test apps/tarot/src/readings/use-rsc-reading-history.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/tarot/src/readings/use-rsc-reading-history.ts apps/tarot/src/readings/use-rsc-reading-history.test.tsx
git commit -m "feat(tarot): add rsc-backed reading hook"
```

---

### Task 5: Wire Reading Routes to RSC Hook

**Files:**
- Modify: `apps/tarot/src/app/readings/index.tsx`
- Modify: `apps/tarot/src/app/readings/new.tsx`

**Interfaces:**
- Consumes: `useRscReadingHistory({ accessToken })`.
- Produces: Existing screens backed by Server Functions, with no visual or route behavior changes.

- [ ] **Step 1: Update imports**

In both reading route files, replace:

```ts
import { useReadingHistory } from '@/readings/use-reading-history';
```

with:

```ts
import { useRscReadingHistory } from '@/readings/use-rsc-reading-history';
```

- [ ] **Step 2: Update hook calls**

In both reading route files, replace:

```ts
useReadingHistory({
    accessToken: tokens?.accessToken
});
```

with:

```ts
useRscReadingHistory({
    accessToken: tokens?.accessToken
});
```

- [ ] **Step 3: Verify route typecheck**

Run:

```bash
yarn workspace tarot build-types
```

Expected: PASS.

- [ ] **Step 4: Verify reading hook and server action tests**

Run:

```bash
yarn workspace tarot test apps/tarot/src/readings/server-actions.test.ts apps/tarot/src/readings/use-rsc-reading-history.test.tsx apps/tarot/src/api/tarot-api.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/tarot/src/app/readings/index.tsx apps/tarot/src/app/readings/new.tsx
git commit -m "feat(tarot): use server functions for readings"
```

---

### Task 6: Manual RSC Verification

**Files:**
- Modify only if verification exposes a concrete bug.

**Interfaces:**
- Consumes: Running `apps/api` and `apps/tarot`.
- Produces: Verified local RSC behavior for authenticated reading history and generation.

- [ ] **Step 1: Start the REST API**

Run:

```bash
yarn api:dev
```

Expected: API server starts on the configured local port.

- [ ] **Step 2: Start the Expo app**

Run:

```bash
yarn workspace tarot start
```

Expected: Expo starts without RSC bundling errors.

- [ ] **Step 3: Verify signed-out behavior**

Open the app and navigate to `/readings` and `/readings/new`.

Expected: Both screens show the existing sign-in prompts and do not call the readings API.

- [ ] **Step 4: Verify signed-in history**

Sign in with a test account and open `/readings`.

Expected: History loads through the RSC server action and shows the same list as before.

- [ ] **Step 5: Verify reading generation**

Open `/readings/new`, enter `What should I notice today?`, and generate a reading.

Expected: A reading appears, the input clears, and history refreshes.

- [ ] **Step 6: Verify native and web bundling boundaries**

Run:

```bash
yarn workspace tarot build-types
yarn workspace tarot test
```

Expected: PASS.

- [ ] **Step 7: Commit verification fixes**

If fixes were needed:

```bash
git add apps/tarot
git commit -m "fix(tarot): stabilize reading server functions"
```

If no fixes were needed, do not create an empty commit.

---

### Task 7: Document Rollout and Follow-up Candidates

**Files:**
- Create: `docs/rsc-readings-pilot.md`
- Modify: `CLAUDE.md`

**Interfaces:**
- Consumes: Verified implementation.
- Produces: Operational notes for RSC beta status, limitations, and next candidates.

- [ ] **Step 1: Create rollout doc**

Create `docs/rsc-readings-pilot.md`:

```md
# RSC Readings Pilot

The tarot mobile app uses Expo Server Functions for the authenticated readings flow.

## Scope

- `apps/tarot/src/readings/server-actions.ts` runs on the server and calls the existing readings REST API.
- `apps/tarot/src/readings/use-rsc-reading-history.ts` remains a Client Component hook for native screens.
- Cognito auth, token storage, navigation, and form state remain client-side.

## Why This Path

Expo RSC support is beta, so this pilot avoids full route-level Server Components and keeps the existing Express API deployment intact. The readings flow is the best first candidate because it already has serializable request and response contracts.

## Known Limitations

- Full route-level RSC is not enabled.
- EAS Update support for Server Components is limited by Expo's current beta status.
- Production native server deployment needs an explicit EAS Hosting or custom server decision before release.

## Next Candidates

1. Fetch card and spread metadata from `apps/graph-api` in a Server Function.
2. Build a server-rendered reading result preview once the reading UI stabilizes.
3. Revisit auth only if the app adopts a server-managed session model.
```

- [ ] **Step 2: Update repo guidance**

In `CLAUDE.md`, update the mobile app architecture note from SDK 56 to SDK 57 and add:

```md
- RSC pilot: readings use Expo Server Functions; keep auth, SecureStore, navigation, and form state client-side.
```

- [ ] **Step 3: Verify docs and code**

Run:

```bash
yarn workspace tarot build-types
yarn workspace tarot test
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add docs/rsc-readings-pilot.md CLAUDE.md
git commit -m "docs(tarot): document rsc readings pilot"
```

---

## Rollback Plan

If Expo RSC bundling breaks native development or deployment, revert only the route imports and leave the server-action files in place for later:

```ts
import { useReadingHistory } from '@/readings/use-reading-history';
```

Then run:

```bash
yarn workspace tarot build-types
yarn workspace tarot test
```

The old `useReadingHistory` hook and `apps/tarot/src/api/tarot-api.ts` client should remain available until the pilot has shipped successfully.

## Final Verification

Run:

```bash
yarn lint
yarn workspace tarot build-types
yarn workspace tarot test
yarn workspace api test
```

Expected:
- Lint passes.
- Tarot TypeScript passes.
- Tarot Vitest suite passes.
- API tests pass, confirming the existing readings backend was not regressed.

## Self-Review

Spec coverage:
- Existing API implementations were inspected and ranked.
- RSC implementation is scoped to the best current API candidate.
- Auth and GraphQL candidates are explicitly categorized.
- The plan includes configuration, server functions, client hook wiring, tests, manual verification, docs, and rollback.

Placeholder scan:
- No placeholder markers or unspecified "handle errors" steps remain.

Type consistency:
- `ReadingHistoryResponse`, `ReadingResponse`, `CreateOneCardReadingInput`, `listReadingsOnServer`, `createOneCardReadingOnServer`, and `useRscReadingHistory` signatures are defined before they are consumed.
