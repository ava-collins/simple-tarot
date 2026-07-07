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

The current Bedrock path uses RAG with normalized tarot corpus documents in S3,
an Amazon Bedrock Knowledge Base, and an OpenSearch Serverless vector store. If
retrieval and prompting are not sufficient, a later model customization phase
may prepare training data for Bedrock fine-tuning or another supported
customization method.

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

`apps/tarot` is a React Native mobile app uses shared components from hooks and
ui packages and Expo framework for application configuration, building, testing
and deployment.

`apps/infra` is an AWS CDK v2 TypeScript app. It owns the Cognito auth
infrastructure for Simple Tarot and the Bedrock RAG stack. The Bedrock stack
creates the S3 corpus bucket, OpenSearch Serverless vector search resources,
Bedrock Knowledge Base, S3 data source, IAM role, and CloudFormation outputs
that hand off deployment values to the API and corpus operations.

`docs` are a collection of documents that facilitate the planning and execution
of the project as a whole, used to provide context over time.

`packages/hooks` is a shared package providing account auth form hooks
(`useLoginForm`, `useSignupForm`, `useForgotPasswordForm`), reading hooks
(`useInstructions`), avatar image hooks (`useAvatarImage`), and shared form
validation utilities.

`packages/cards` is a shared React Native package for generated tarot card SVG
components and the `useSvgCards` hook. It generates card face components from
raw SVG files with SVGR.

`packages/ui` is a shared package written in React Native using Storybook UI for
building, documenting, testing and exporting UI components.

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

| | |
|---|---|
| [Tarot App](./apps/tarot/README.md) | Expo SDK 57 mobile app — auth flow, reading screens, history |
| [REST API](./apps/api/README.md) | Reading generation — endpoints, auth modes, Bedrock config, avatar images |
| [Infrastructure](./apps/infra/README.md) | CDK stacks — Cognito, Bedrock RAG, DynamoDB, API Gateway Lambda |

### Shared Packages

| | |
|---|---|
| [@simpletarot/hooks](./packages/hooks/README.md) | Auth form hooks, reading hooks, avatar image hook |
| [@simpletarot/cards](./docs/cards_package.md) | SVGR card component generation and `useSvgCards` hook |

### Architecture

- [Bedrock RAG API Integration](./docs/bedrock_rag_api_integration.md) — end-to-end flow from mobile request to Bedrock Knowledge Base retrieval, module map, and CloudFormation output wiring
- [User Reading Persistence](./docs/user_reading_persistence.md) — DynamoDB single-table design, auth flow, S3 log structure, and AWS CLI inspection commands; see [Cognito → Expo Config Contract](./docs/cognito_expo_config_contract.md) for the auth identity source
- [Cognito → Expo Config Contract](./docs/cognito_expo_config_contract.md) — CDK output → `EXPO_PUBLIC_*` mapping and EAS delivery; used by [Infrastructure](./apps/infra/README.md#expo-contract) and [Tarot App](./apps/tarot/README.md)

### Operations

- [Bedrock Corpus Operations](./docs/bedrock_corpus_operations.md) — normalize corpus, upload to S3, sync Knowledge Base ingestion; prerequisite for switching [REST API](./apps/api/README.md#bedrock-mode) to `BEDROCK_RUNTIME_MODE=bedrock`

### Developer Workflow

- [Monorepository Orientation](./docs/yarn_workspace_dependency_goals.md) — workspace dependency rules, `workspace:*` protocol, peer/dev/runtime split
- [Commit Messages & Releases](./docs/semantic_release_commit_messages.md) — conventional commit format, type → semver mapping, valid scopes

### Planning

- [Bedrock RAG API MVP Stages](./docs/superpowers/plans/2026-06-26-bedrock-rag-api-mvp-stages.md)
- [User Reading Persistence Stages](./docs/superpowers/plans/2026-07-02-user-reading-persistence.md)

# Copyright

The [Rider Waite](https://sacred-texts.com/tarot/faq.htm#uscopyright) cards used
in this application are in the public domain; svg pictorial keys were obtained
under [Creative Commons](https://creativecommons.org/publicdomain/zero/1.0/)
open source licensing.

The code in this repository is not open for personal use and not for
distributing.
