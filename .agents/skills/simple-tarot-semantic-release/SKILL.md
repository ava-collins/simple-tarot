---
name: simple-tarot-semantic-release
description: Use when changing, debugging, or explaining Simple Tarot semantic-release, semantic-release-monorepo, Conventional Commits, release workflows, package changelogs, package versioning, release scripts, or release dry-runs.
---

# Simple Tarot Semantic Release

## Goal

Preserve reliable package-scoped releases in this Yarn 4 monorepo. Treat the
root release config, leaf package configs, workspace scripts, and GitHub Action
as one release system.

## Current Shape

Root workspace:

- `package.json` owns the release dependencies and the root helper scripts.
- `.releaserc.json` is valid for root-level semantic-release checks and must not
  use unavailable template variables in `tagFormat`.
- `tagFormat` templates receive `version`; do not use `${npm_package_name}`.

Leaf workspaces:

- `apps/api`
- `apps/tarot`
- `packages/cards`
- `packages/hooks`
- `packages/ui`

Each leaf workspace has its own `.releaserc.json` and a `semantic-release`
script that calls the root-installed binary:

```sh
node ../../node_modules/semantic-release/bin/semantic-release.js
```

The GitHub workflow runs the root `release` script after install and build.

## Commands

Use these root commands:

```sh
yarn release:dry-run
yarn release
```

The intended workspace command shape is:

```sh
yarn workspaces foreach -A --exclude simpletarot run semantic-release -e semantic-release-monorepo --dry-run
```

Do not replace this with `exec semantic-release` unless every leaf workspace has
semantic-release available in its own binary context. In this repo, the release
binary is installed at the root.

## Monorepo Behavior

`semantic-release-monorepo` must be applied with `-e semantic-release-monorepo`
or `extends`; it is not a plugin.

It filters commits by files touched under each package path. Commit scopes help
humans, but package release selection is path-based.

It also provides package-scoped tag formatting for leaf package runs. Avoid
adding package-name template variables to leaf `tagFormat` unless you have
verified semantic-release receives those variables during verification.

## Commit Messages

This repo uses Conventional Commits:

```text
fix(ui): align card title spacing
feat(tarot): add daily reading spread
feat(hooks)!: change reading lookup API
```

Default release impact:

- `fix`: patch
- `feat`: minor
- `!` or `BREAKING CHANGE:`: major
- `docs`, `test`, `chore`, `refactor`, `build`, `ci`: no release by default

Human-facing guidance lives in `docs/semantic_release_commit_messages.md`.

## Common Failures

`ReferenceError: npm_package_name is not defined` means a `tagFormat` is using a
template variable semantic-release did not provide. semantic-release verifies
`tagFormat` by compiling it with only a fake `version`.

`command not found: semantic-release` from a leaf workspace means Yarn is trying
to resolve the binary inside that workspace. Use the leaf `semantic-release`
script or the root `yarn release:dry-run` helper.

`git ls-remote` failures during a dry-run can be network, DNS, SSH, or token
access problems. If the command is sandboxed and network fails, rerun with
approval before changing release configuration.

`This test run was triggered on the branch <name>, while semantic-release is
configured to only publish from main` is expected on non-`main` branches.

## Validation

After release config or script changes, run:

```sh
yarn release:dry-run
```

If the dry-run reaches each leaf workspace and only reports the non-`main`
branch message, command resolution and config loading are healthy.

When editing commit-message docs, check they stay aligned with the configured
`@semantic-release/commit-analyzer` Conventional Commits preset.

