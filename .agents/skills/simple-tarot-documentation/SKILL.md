---
name: simple-tarot-documentation
description: Use when adding, moving, or reviewing Simple Tarot documentation, README links, docs index entries, app README cross-links, or agent-facing documentation conventions.
---

# Simple Tarot Documentation

## Goal

Keep project documentation discoverable from the root README and mirrored into
the app or package README where a future reader naturally enters the repo.

## Link Structure

- `README.md` is the canonical human docs index. Add new durable docs there
  under the closest section: Apps, Shared Packages, Architecture, Operations,
  Developer Workflow, or Planning.
- Cross-cutting architecture docs belong under `README.md#architecture`, then
  should be linked from the affected app README sections.
- App-specific implementation notes belong in that app's README. Link outward
  to the deeper `docs/` file instead of duplicating long explanations.
- Operations runbooks belong under `README.md#operations`.
- Historical implementation plans stay under `README.md#planning`; do not use
  plan files as the main handoff for completed architecture.
- Keep `CLAUDE.md`, app `AGENTS.md`, and local skills aligned when docs encode
  agent-facing conventions such as Expo SDK versions or documentation linking
  rules.

## Current RSC Pilot Pattern

`docs/rsc-readings-and-avatars-pilot.md` is a cross-cutting architecture doc.
It should be reachable from:

- `README.md#architecture`
- `apps/tarot/README.md#rsc-pilot`
- `apps/api/README.md#endpoints`
- `apps/infra/README.md#expo-contract`

The root entry should mention the app/API/infra branches so a reader can move
from the high-level index into the affected surfaces.

## Validation

After documentation link changes:

```sh
rg -n "new-doc-name|stale-version|old-heading" README.md apps docs .agents
git diff --check
```

For docs-only changes, code tests are usually unnecessary unless the touched doc
or plan explicitly asks for them.
