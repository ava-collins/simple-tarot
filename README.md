# Simple Tarot Project Spec

## Overview

Simple Tarot is a rebuild of my older React Native
[mobile app](https://github.com/avacollins/tarot-ix) that aims to enrich
readings by using highly customized AI generated content.

### Backend

The rebuild is organized around three backend surfaces.

1. `apps/graph-api` preserves the graph-backed tarot content API built on
   Neo4j.

2. `apps/api` is the REST API for generated readings. It validates reading
   requests, builds deterministic prompts, and can either return local
   placeholder responses or call Amazon Bedrock Knowledge Bases through
   Bedrock Agent Runtime `RetrieveAndGenerate`.

3. `apps/infra` provisions AWS infrastructure with CDK, including Cognito auth
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

A yarn workspace monorepository to manage the mobile tarot application, graph
API, AWS infrastructure, and shared React Native component libraries.

`apps/graph-api` is an Apollo graph server built on top of Node/Express server
connected to a Neo4j database, providing the core API for the client
application.

`apps/api` is an Express REST API for generated tarot readings. It exposes
`GET /health` and `POST /readings`, includes a local development mode, and can
call Bedrock Knowledge Bases in Bedrock runtime mode.

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

`packages/hooks` is a shared package written in React Native using Apollo Client
for data fetching, application state management and caching.

`packages/cards` is a shared React Native package for generated tarot card SVG
components and the `useSvgCards` hook. It generates card face components from
raw SVG files with SVGR and keeps those generated files out of git.

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

👉🏽 Check out

- [@simpletarot/hooks](./packages/hooks/README.md)

- [@simpletarot/cards](./docs/cards_package.md)

- [Monorepository orientation](./docs/yarn_workspace_dependency_goals.md)

- [Semantic Release Commit Messages](./docs/semantic_release_commit_messages.md)

- [Neo4j Database Backup](./docs/neo4j_database_backup.md)

- [Cognito Expo Config Contract](./docs/cognito_expo_config_contract.md)

- [Bedrock RAG API Integration](./docs/bedrock_rag_api_integration.md)

- [Bedrock Corpus Operations](./docs/bedrock_corpus_operations.md)

- [REST API App](./apps/api/README.md)

- [Infrastructure App](./apps/infra/README.md)

- [Bedrock RAG API MVP Plan](./docs/superpowers/plans/2026-06-26-bedrock-rag-api-mvp-stages.md)

# Copyright

The [Rider Waite](https://sacred-texts.com/tarot/faq.htm#uscopyright) cards used
in this application are in the public domain; svg pictorial keys were obtained
under [Creative Commons](https://creativecommons.org/publicdomain/zero/1.0/)
open source licensing.

The code in this repository is not open for personal use and not for
distributing.
