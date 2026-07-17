# Simple Tarot Project Spec

## Overview

Simple Tarot is a React Native app that gives simple tarot
readings using highly customized AI generated content.

### Backend

The backend is organized around two surfaces.

1. `apps/api` is the REST API for generated readings. It validates reading
   requests, builds deterministic prompts, and can either return local
   placeholder responses or call Amazon Bedrock Knowledge Bases through
   Bedrock Agent Runtime `RetrieveAndGenerate`.

2. `apps/infra` provisions AWS infrastructure with CDK, including Cognito auth
   and the Bedrock RAG stack for generated tarot readings.

The current Bedrock path uses private corpus artifacts in S3, an Amazon Bedrock Knowledge Base,
and an Amazon S3 Vectors vector store. Corpus sources, transformation code, relationship rules,
and generated artifacts are maintained outside this public repository.

### UI

Live Component Reference
[Storybook UI Component Library](https://ava-collins.github.io/simple-tarot/)

## Contents

A yarn workspace monorepository to manage the mobile tarot application,
AWS infrastructure, and shared React Native component libraries.

`apps/api` is an Express REST API for generated tarot readings. It exposes
`GET /health`, `GET /avatars`, `POST /readings`, and `GET /readings`. It
validates Cognito JWT tokens to support authenticated reading persistence to
DynamoDB and reading history retrieval. It includes a local development mode
and can call Bedrock Knowledge Bases in Bedrock runtime mode.

`apps/tarot` is the Expo Router React Native mobile app. It owns app routing,
auth/session integration, navigation, Expo public config, and thin Server
Function wrappers around shared package code.

`apps/infra` is an AWS CDK v2 TypeScript app. It owns the Cognito auth
infrastructure for Simple Tarot and the Bedrock RAG stack. Dev and prod are
isolated by explicit CDK environment selection and distinct resources.
Dev is deployed as the pre-production/test environment; infrastructure changes are
reviewed through an explicit CDK diff before deployment. Prod is defined but not
deployed. The Bedrock stack creates the S3 corpus bucket,
an S3 Vectors vector bucket and index, Bedrock Knowledge Base, S3 data
source, IAM role, and CloudFormation outputs that hand off deployment values
to the API and corpus operations.

`docs` are a collection of documents that facilitate the planning and execution
of the project as a whole.

`packages/hooks` owns reusable API contracts, API clients, request builders,
resource helpers, constants, and hooks. Its root export is server-safe; React
hooks are exported from `@simpletarot/hooks/client`.

`packages/cards` is a shared React Native package for generated tarot card SVG
components and the `useSvgCards` hook. It generates card React components from
raw SVG files using SVGR tool.

`packages/ui` owns the Storybook-driven React Native presentation layer:
atoms, molecules, organisms, and mobile screen components consumed by the app.

## Github Actions

[Build and Deploy](https://github.com/avacollins/simple-tarot/actions/workflows/sb.yml)
builds static storybook and deploys to
[github pages](<(https://avacollins.github.io/simple-tarot)>).

[Release](https://github.com/avacollins/simple-tarot/actions/workflows/semantic-release.yml)
Runs [semantic-release](https://github.com/semantic-release/semantic-release)
and
[conventional commits](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-changelog-conventionalcommits)
analyzer to generate notes and semver increments to each package via git commit
messages.

## Docs

### Apps

|                                          |                                                                           |
| ---------------------------------------- | ------------------------------------------------------------------------- |
| [Tarot App](./apps/tarot/README.md)      | Expo SDK 57 app — routes, auth/session, navigation, Server Functions      |
| [REST API](./apps/api/README.md)         | Reading generation — endpoints, auth modes, Bedrock config, avatar images |
| [Infrastructure](./apps/infra/README.md) | CDK stacks — explicit dev/prod selection and distinct resources          |

### Shared Packages

|                                                  |                                                                             |
| ------------------------------------------------ | --------------------------------------------------------------------------- |
| [@simpletarot/hooks](./packages/hooks/README.md) | Server-safe API clients/contracts/resources and client React hooks          |
| [@simpletarot/cards](./packages/cards/README.md) | SVGR card component generation and `useSvgCards` hook                       |
| [@simpletarot/ui](./packages/ui/README.md)       | Storybook-driven React Native component library — screens, organisms, atoms |

### Architecture

-   [RSC Readings and Avatars Pilot](./docs/rsc-readings-and-avatars-pilot.md) — package boundaries for Expo Server Function wrappers, shared reading/avatar clients and hooks, UI screens, and rollback; linked from [Tarot App](./apps/tarot/README.md#rsc-pilot), [REST API](./apps/api/README.md#endpoints), and [Infrastructure](./apps/infra/README.md#expo-contract)
-   [Bedrock RAG API Integration](./docs/bedrock_rag_api_integration.md) — end-to-end flow from mobile request to Bedrock Knowledge Base retrieval, module map, and CloudFormation output wiring
-   [Private Corpus Artifact Boundary](./docs/private-corpus-artifact-boundary.md) — public ownership and compatibility contract for approved opaque corpus artifacts without private source, compiler, or rule details
-   [User Reading Persistence](./docs/user_reading_persistence.md) — DynamoDB single-table design, auth flow, S3 log structure, and AWS CLI inspection commands; see [Cognito → Expo Config Contract](./docs/cognito_expo_config_contract.md) for the auth identity source
-   [Cognito → Expo Config Contract](./docs/cognito_expo_config_contract.md) — CDK output → `EXPO_PUBLIC_*` mapping and EAS delivery; used by [Infrastructure](./apps/infra/README.md#expo-contract) and [Tarot App](./apps/tarot/README.md)

### Operations

-   [Bedrock Corpus Operations](./docs/bedrock_corpus_operations.md) — public infrastructure boundary for the development selective data source; private activation and completed ingestion are prerequisites for useful [REST API](./apps/api/README.md#bedrock-mode) retrieval in `BEDROCK_RUNTIME_MODE=bedrock`
-   [Infrastructure Operations](./apps/infra/README.md#commands) — explicit CDK dev/prod environment selection, deployment, validation, and rollback

### Developer Workflow

-   [Monorepository Orientation](./docs/yarn_workspace_dependency_goals.md) — workspace dependency rules, `workspace:*` protocol, peer/dev/runtime split
-   [Commit Messages & Releases](./docs/semantic_release_commit_messages.md) — conventional commit format, type → semver mapping, valid scopes


# Copyright

The [Rider Waite](https://sacred-texts.com/tarot/faq.htm#uscopyright) cards used
in this application are in the public domain; svg pictorial keys were obtained
under [Creative Commons](https://creativecommons.org/publicdomain/zero/1.0/)
open source licensing.

The code in this repository is not open for personal use and not for
distributing.
