---
name: simple-tarot-workspace-dependencies
description: Use when changing Simple Tarot Yarn 4 workspace dependencies, package.json manifests, yarn.lock, peerDependencies/devDependencies, React Native Web admin setup, RNEUI package alignment, or first-party workspace links.
---

# Simple Tarot Workspace Dependencies

## Goal

Keep the Yarn 4 monorepo explicit: every workspace declares what it imports,
shared packages declare what consumers must provide, and local packages use
workspace links.

## Before Editing

Inspect the workspace and dependency graph:

```sh
yarn workspaces list --json
yarn explain peer-requirements
yarn why <package>
```

Search imports before deciding ownership:

```sh
rg "from ['\"]|require\\(['\"]|import\\(['\"]" apps packages -g '*.ts' -g '*.tsx' -g '*.js' -g '*.mjs'
```

If the latest package version matters, verify it:

```sh
yarn npm info <package>
```

If network is blocked, request approval instead of guessing.

## Dependency Rules

1. If a workspace imports a package by name, that workspace must declare it.
2. Use `workspace:*` for first-party workspace dependencies.
3. Apps use `dependencies` for concrete runtime providers.
4. Shared libraries use `peerDependencies` for host-provided runtimes.
5. Shared libraries also use `devDependencies` for local build, test, and Storybook providers.
6. Do not make `@simpletarot/hooks` depend on `@simpletarot/ui`.
7. Put shared non-visual types in `packages/hooks` or a future small shared package, not in UI.
8. Update exact peer pairs together, especially `@rneui/base` and `@rneui/themed`.
9. Prefer plain Next.js plus React Native Web for `apps/admin`; avoid `@expo/next-adapter` unless an Expo SDK requirement is explicit.
10. Do not suppress Yarn peer warnings until the workspace ownership question has been answered.

## Workspace Expectations

`apps/tarot` is the Expo React Native mobile app. It provides concrete runtime
versions for React, React Native, Expo, RNEUI, and mobile dependencies.
It consumes `@simpletarot/ui` through `workspace:*`.

`apps/api` is the REST API server package. Runtime imports belong in
`dependencies`; TypeScript, nodemon, and build tools belong in
`devDependencies`.

`packages/hooks` owns shared hook logic and non-visual application types. It
must not import `@simpletarot/ui`. React and React DOM should remain peers and
also exist as dev dependencies when local tests need them.

`packages/ui` owns visual components and Storybook. It may depend on
`@simpletarot/hooks`. Runtime requirements used by exported components should be
peers; Storybook, Babel, TypeScript, ESLint, React, and local render providers
should be dev dependencies.

## Validation

After manifest or lockfile changes:

```sh
yarn install --immutable --mode=skip-build
```

Run the smallest relevant workspace checks:

```sh
yarn workspace @simpletarot/ui build-types
yarn workspace @simpletarot/hooks build-types
yarn workspace tarot build-types
yarn workspace admin build-types
yarn workspace admin build
```

Report remaining warnings separately from the issue that was fixed.

## Warning Triage

Treat first-party missing peer warnings as actionable. Fix the workspace that
owns the import or the app that provides the runtime.

For third-party warnings, inspect the peer tree:

```sh
yarn explain peer-requirements <hash>
```

Do not add testing-only packages to production apps only to quiet warnings
unless the peer is actually required by a runtime path. Prefer documenting known
optional upstream peers or using package extensions later.
