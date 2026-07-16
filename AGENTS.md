# Simple Tarot Agent Instructions

## Implementation Plan Requirements

Apply these rules whenever creating or executing a Simple Tarot implementation plan.

### Package and Platform Boundaries

- Put reusable data fetching, resources, hooks, API clients, contracts, and non-visual orchestration in `packages/hooks`.
- Keep `packages/ui` presentational. It must not initiate network requests, import app server actions, read environment variables, or own app-specific data fetching.
- Keep apps such as `apps/tarot` as thin platform composition layers. Do not place reusable logic only in the mobile app when a future web app would need to reproduce it.

### UI Composition

- Compose UI from atoms to molecules to organisms to full screens.
- Treat screens as mobile screens at this stage and wrap them in the existing `MobileView` template.
- Keep shared data code independent of mobile-only presentation assumptions so future platform templates can reuse it.

### Code Design

- Prefer small, focused units with one primary responsibility.
- Prefer pure, deterministic behavior: the same input produces the same output. Isolate I/O, time, randomness, environment access, and mutable state at explicit boundaries.
- Extract common code after a second genuine use. Do not create speculative abstractions for a single call site.
- Move reusable strings to the nearest owning constants module. Use package-level constants when a value crosses package or app boundaries.

### Configuration

- Use environment variables for infrastructure configuration and secrets.
- Use `EXPO_PUBLIC_*` only for Expo values that are intentionally public and non-secret.
- Never expose credentials, tokens, or secrets through an Expo public variable.

### React 19 Data Consumption

- Prefer render-time Promise consumption with React 19 `use()`, Suspense fallbacks, and Error Boundaries when the flow can be modeled as a resource.
- Avoid new `useEffect` plus `useState` fetch loops when the React 19 resource pattern is suitable.
- Keep reusable fetching and resource creation in `packages/hooks`. Give `packages/ui` resolved data, status, resources, and callbacks through explicit interfaces.

### Checkpoints and Verification

- Divide implementation plans into small, coherent major checkpoints. Do not pause between internal test-writing, test-running, and implementation steps within one checkpoint.
- Within every checkpoint, specify exact files, interfaces, tests, implementation steps, and automated verification commands.
- End every checkpoint with concrete manual-verification instructions and an explicit stop.
- Do not begin the next checkpoint until the user verifies the result and explicitly authorizes continuation.

### Documentation

- Include a documentation checkpoint or explicit documentation work in the checkpoint that changes an architecture or operational contract.
- Update affected architecture docs, app/package READMEs, operations guidance, links, and agent instructions.
- Verify that documentation describes the resulting architecture and does not leave users or agents following stale paths.
