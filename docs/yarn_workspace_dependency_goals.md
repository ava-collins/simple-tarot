# Yarn Workspace Dependency Goals

## Overview

Simple Tarot uses Yarn 4 workspaces to keep the mobile app, REST API, AWS
infrastructure, shared hooks, and shared UI package in one repository without
hiding package ownership. Each workspace should declare the packages it imports,
even when another workspace already brings those packages into the root install.

The goal is to make every workspace understandable, testable, and portable on
its own terms.

## Workspace Map

- `apps/tarot` is the Expo React Native mobile application.
- `apps/api` is the Express REST API for generated tarot readings and avatar images.
- `apps/infra` is the AWS CDK v2 TypeScript app. It currently owns the Cognito
  auth stack and its Expo-facing public output contract.
- `packages/hooks` contains shared React hooks, state, data access helpers, and
  shared application types.
- `packages/ui` contains shared React Native UI components and Storybook.

## Core Rules

Every workspace owns its direct imports.

If code in a workspace imports a package by name, that package must appear in
that workspace's `package.json` as a dependency, peer dependency, or dev
dependency. Do not rely on hoisting from another app.

Use the workspace protocol for local packages.

Local package references should use `workspace:*` so Yarn always links the local
workspace intentionally.

Libraries should peer their host runtime.

Shared packages such as `@simpletarot/hooks` and `@simpletarot/ui` should list
React, React Native, React Native Web, and UI runtime requirements as
`peerDependencies` when consumers must provide the runtime instance. They should
also list the same packages in `devDependencies` when needed for local builds,
tests, or Storybook.

Apps should provide concrete runtime versions.

Applications such as `tarot` should list the concrete packages they run with in
`dependencies`. Apps are the runtime providers for library peers.

Infrastructure workspaces should declare CDK and deployment helpers directly.

`apps/infra` owns its AWS CDK dependencies and environment-loading dependency.
It should not rely on another workspace for packages it imports in stack,
configuration, or test code.

Do not create package cycles.

`@simpletarot/ui` may depend on `@simpletarot/hooks`, but hooks must not depend
on UI. Shared non-visual types should live in hooks or another small shared
package, not in UI.

## Dependency Types

Use `dependencies` for packages needed at runtime by that workspace.

Use `devDependencies` for build tools, test tools, Storybook, TypeScript,
linting, and local-only providers needed to exercise a library workspace.

Use `peerDependencies` for runtime packages that must be supplied by the
consumer, especially React, React DOM, React Native, React Native Web, RNEUI,
Expo modules, and native/web UI dependencies.

Use both `peerDependencies` and `devDependencies` for shared library packages
when the package requires a consumer-provided runtime but also needs that
runtime locally for type-checking, tests, or Storybook.

## Universal UI Goals

React Native component code should be shared between mobile and web where it is
worth the complexity.

The mobile app uses Expo as the runtime.

RNEUI packages should be aligned as a pair. `@rneui/themed` has an exact peer on
`@rneui/base`, so update both together.

## Validation Commands

Use these commands after dependency changes:

```sh
yarn install --immutable --mode=skip-build
yarn workspaces list --json
yarn explain peer-requirements
yarn workspace @simpletarot/ui build-types
yarn workspace @simpletarot/hooks build-types
yarn workspace tarot build-types
yarn workspace infra test
yarn workspace infra cdk synth
```

Use targeted commands when changing only one workspace. Use the full set before
larger dependency or architecture changes.

## Expected Warning Posture

The desired long-term state is that Yarn install warnings are either eliminated
or documented as intentional upstream optional peers.

Warnings from first-party workspaces should be treated as real work:

- Missing direct imports should be added to the owning workspace.
- Local workspace dependencies should use `workspace:*`.
- Peer ranges should match the versions provided by consuming apps.
- Type package versions should align with their runtime packages.

Warnings from third-party packages may be acceptable when they refer to optional
features that Simple Tarot does not use, but they should be reviewed before
being ignored.

## Current Direction

The dependency architecture should move toward explicit ownership:

- `packages/hooks` owns shared non-visual types and hook logic.
- `packages/ui` owns visual components and Storybook.
- `apps/tarot` provides Expo and mobile runtime dependencies.
- `apps/api` provides server runtime dependencies for the REST API.
- `apps/infra` provides AWS CDK infrastructure, including the Cognito user pool,
  public OAuth app client, hosted domain, and Expo public config outputs.

This keeps the monorepo flexible without turning the root install into a hidden
dependency bucket.
