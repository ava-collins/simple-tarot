# Simple Tarot Project Spec

## Overview

Simple Tarot is a rebuild of my older React Native
[mobile app](https://github.com/avacollins/tarot-ix) that aims to enrich
readings by using highly customized AI generated content.

### Backend
The rebuild is planned in two phases.

1. Phase one migrates legacy tarot content into Neo4j as a graph database so the
   app can retrieve structured reading context.

2. Phase two will add AI-generated reading content using AWS Bedrock. The likely
   first approach will use RAG: retrieve relevant graph data and, if needed,
   vector-similar content, then pass that context into custom prompts for a
   Bedrock foundation model.

   If retrieval and prompting are not sufficient, a later model customization
   phase may prepare training data for Bedrock fine-tuning or another supported
   customization method.

### UI
Live Component Reference
[Storybook UI Component Library](https://ava-collins.github.io/simple-tarot/)

## Contents

A yarn workspace monorepository to manage the mobile tarot application, graph
API, and shared React Native component libraries.

`apps/graph-api` is an Apollo graph server built on top of Node/Express server
connected to a Neo4j database, providing the core API for the client
application.

`apps/tarot` is a React Native mobile app uses shared components from hooks and
ui packages and Expo framework for application configuration, building, testing
and deployment.

`docs` are a collection of documents that facilitate the planning and execution
of the project as a whole, used to provide context over time.

`packages/hooks` is a shared package written in React Native using Apollo Client
for data fetching, application state management and caching.

`packages/ui` is a shared package written in React Native using Storybook UI for
building, documenting, testing and exporting UI components.

## Github Actions

[Build and Deploy](https://github.com/avacollins/simple-tarot/actions/workflows/sb.yml)
builds static storybook and deploys to
[github pages]((https://avacollins.github.io/simple-tarot)).

[Release](https://github.com/avacollins/simple-tarot/actions/workflows/semantic-release.yml)
Runs [semantic-release](https://github.com/semantic-release/semantic-release)
and
[conventional commits](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-changelog-conventionalcommits)
analyzer to generate notes and semver increments to each package via git commit
messages.

## Docs

👉🏽 Check out
- [@simpletarot/hooks](./packages/hooks/README.md)

- [Monorepository orientation](./docs/yarn_workspace_dependency_goals.md)

- [Semantic Release Commit Messages](./docs/semantic_release_commit_messages.md)

- [Neo4j Database Backup](./docs/neo4j_database_backup.md)

- [Planning Docs](./docs/planning/index.md)


 # Copyright

The [Rider Waite](https://sacred-texts.com/tarot/faq.htm#uscopyright) cards used
in this application are in the public domain; svg pictorial keys were obtained
under [Creative Commons](https://creativecommons.org/publicdomain/zero/1.0/)
open source licensing.

The code in this repository is not open for personal use and not for
distributing.
