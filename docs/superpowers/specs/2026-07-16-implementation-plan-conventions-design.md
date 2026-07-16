# Simple Tarot Implementation-Plan Conventions — Design

## Status

Approved on 2026-07-16.

## Objective

Make repository-specific architecture and execution constraints apply to every future Simple
Tarot implementation plan, regardless of whether Codex, Claude Code, or another compatible agent
writes the plan.

## Placement

Create a root `AGENTS.md` as the canonical agent-facing policy and import it from the existing root
`CLAUDE.md` with `@AGENTS.md`.

This is preferred over a project skill because these are repository conventions, not a reusable
technique. It is preferred over updating only `CLAUDE.md` because the rules must also reach Codex
and other agents that honor `AGENTS.md`. Existing child instructions such as
`apps/tarot/AGENTS.md` remain responsible for narrower Expo-specific requirements.

## Required Planning Policy

Every implementation plan must encode the following constraints.

### Package and Platform Boundaries

- Put reusable data fetching, resources, hooks, API clients, contracts, and non-visual
  orchestration in `packages/hooks`.
- Keep `packages/ui` presentational. UI code must not initiate network requests, import app server
  actions, read environment variables, or own app-specific data fetching.
- Keep apps such as `apps/tarot` thin platform composition layers. Reusable logic must not live
  only in the mobile app when a future web app would need to reproduce it.

### UI Composition

- Build UI from atoms to molecules to organisms to full screens.
- Treat screens as mobile screens at this stage and wrap them in the existing `MobileView`
  template.
- Preserve the future option to introduce other platform templates without putting mobile-only
  fetching or presentation assumptions into shared data code.

### Code Design

- Prefer small, focused units with one primary responsibility.
- Prefer pure, deterministic behavior: the same input produces the same output. Isolate unavoidable
  I/O, time, randomness, environment access, and mutable state at explicit boundaries.
- Extract common code after a second genuine use. Do not create speculative abstractions for a
  single call site.
- Move reusable string values to the nearest owning constants module. Use a package-level constants
  module when a value crosses package or app boundaries.

### Configuration

- Use environment variables for infrastructure configuration and secrets.
- Use `EXPO_PUBLIC_*` only for Expo values that are intentionally public and non-secret.
- Never expose credentials, tokens, or other secrets through an Expo public variable.

### React 19 Data Consumption

- Prefer React 19 render-time Promise consumption with `use()`, Suspense fallbacks, and Error
  Boundaries when the flow can be modeled as a resource.
- Avoid `useEffect` plus `useState` fetch loops for new data-loading paths when the React 19
  resource pattern is suitable.
- Preserve the package boundary: reusable fetching/resource creation remains in `packages/hooks`;
  presentational `packages/ui` components receive resolved data, status, resources, and callbacks
  through explicit interfaces.

### Plan Shape and Execution Gates

- Divide implementation into small, coherent major checkpoints rather than pausing after every
  internal TDD checklist operation.
- Within each checkpoint, specify files, interfaces, tests, implementation work, and automated
  verification.
- End every checkpoint with concrete user manual-verification instructions and an explicit stop.
- Do not begin the next checkpoint until the user verifies the result and explicitly authorizes
  continuation.

### Documentation

- Include a documentation checkpoint or explicit documentation work in the relevant checkpoint.
- Update architecture docs, app/package READMEs, operations guidance, links, and agent instructions
  affected by the implementation.
- Verify that documentation describes the resulting architecture and does not leave users or
  agents following stale paths.

## Validation

After adding the policy:

- confirm the root `CLAUDE.md` imports `@AGENTS.md`
- confirm no child instruction contradicts the root package boundaries
- scan the new files for unfinished markers and duplicated rules
- run `git diff --check`
- inspect a representative future plan against every required policy section

## Non-Goals

- changing application code as part of this policy addition
- rewriting completed historical plans
- forcing manual pauses between individual test-writing, test-running, and implementation
  checklist lines inside one checkpoint
- moving Expo-version-specific guidance out of `apps/tarot/AGENTS.md`
