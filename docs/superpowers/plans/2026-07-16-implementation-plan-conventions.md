# Simple Tarot Implementation-Plan Conventions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add repository-wide agent instructions that make every future Simple Tarot implementation plan preserve package boundaries, React 19 patterns, incremental verification gates, and documentation accuracy.

**Architecture:** A new root `AGENTS.md` is the canonical cross-agent policy. The existing root `CLAUDE.md` imports it with `@AGENTS.md`, while narrower child instructions such as `apps/tarot/AGENTS.md` remain responsible for platform-specific details.

**Tech Stack:** Markdown agent instructions, Codex `AGENTS.md`, Claude Code instruction imports, Git.

## Global Constraints

- Preserve all unrelated staged and working-tree changes; commit only `AGENTS.md` and `CLAUDE.md`.
- Keep `packages/hooks` responsible for reusable data fetching and non-visual orchestration.
- Keep `packages/ui` presentational and composable from atoms through mobile screens.
- Use `EXPO_PUBLIC_*` only for intentionally public, non-secret Expo values.
- Prefer React 19 `use()`, Suspense, and Error Boundaries over new effect-driven fetch loops when a Promise resource fits.
- Require manual user verification only between coherent major checkpoints, after automated verification completes.
- Include documentation accuracy in every future implementation plan.

---

## Target File Structure

- Create `AGENTS.md`: canonical repository-wide implementation-planning policy.
- Modify `CLAUDE.md`: import the canonical policy without duplicating its contents.
- Preserve `apps/tarot/AGENTS.md`: narrower Expo SDK 57 instructions continue to apply inside the mobile app.

### Task 1: Add the Repository-Wide Planning Policy

**Files:**

- Create: `AGENTS.md`
- Modify: `CLAUDE.md`
- Verify only: `apps/tarot/AGENTS.md`

**Interfaces:**

- Consumes: the approved design in `docs/superpowers/specs/2026-07-16-implementation-plan-conventions-design.md`.
- Produces: root agent instructions automatically applicable to future plan creation and imported by Claude Code.

- [ ] **Step 1: Create the canonical root policy**

Create `AGENTS.md` with this complete content:

```markdown
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
```

- [ ] **Step 2: Import the policy for Claude Code**

Append this line to the end of root `CLAUDE.md`, separated from the preceding content by one blank line:

```markdown
@AGENTS.md
```

Do not copy the policy body into `CLAUDE.md`; `AGENTS.md` remains the single source of truth.

- [ ] **Step 3: Verify instruction scope and consistency**

Run:

```sh
test "$(tail -n 1 CLAUDE.md)" = '@AGENTS.md'
rg -n "packages/hooks|packages/ui|MobileView|EXPO_PUBLIC|React 19|major checkpoints|Documentation" AGENTS.md
rg -n "Expo SDK 57|versioned docs" apps/tarot/AGENTS.md
! rg -n "T[B]D|T[O]DO|F[I]XME" AGENTS.md CLAUDE.md
git diff --check -- AGENTS.md CLAUDE.md
```

Expected:

- the `test` command exits zero
- every root planning-policy topic has a match
- the child mobile instruction still contains Expo SDK 57 guidance
- the unfinished-marker scan returns no matches
- `git diff --check` exits zero

- [ ] **Step 4: Inspect the exact change set**

Run:

```sh
git diff -- AGENTS.md CLAUDE.md
git status --short
```

Expected: the diff contains only the new root policy and the `@AGENTS.md` import. Existing unrelated staged README changes may remain in `git status` but must not enter this task's commit.

- [ ] **Step 5: Commit only the policy files**

Run:

```sh
git add AGENTS.md CLAUDE.md
git diff --cached --check
git commit --only AGENTS.md CLAUDE.md -m "docs: add implementation plan conventions"
```

Expected: the commit contains only `AGENTS.md` and `CLAUDE.md`; unrelated staged changes remain staged and uncommitted.

- [ ] **Manual verification pause — checkpoint 1**

Stop and ask the user to review `AGENTS.md` and confirm that the package boundaries, React 19 policy, major-checkpoint gate, and documentation pass reflect the intended planning rules. Do not begin another implementation checkpoint until the user explicitly authorizes it.
