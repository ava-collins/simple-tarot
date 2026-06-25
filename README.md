# Simple Tarot Project Spec

## Overview

Simple Tarot is a rebuild of my older React Native
[mobile app](https://github.com/avacollins/tarot-ix) that aims to enrich
readings by using highly customized AI generated content.

### Backend

The backend is an Express v5 REST API backed by AWS Bedrock. Each reading
request retrieves relevant context from a Bedrock Knowledge Base (RAG) built
from the tarot corpus, then generates per-card interpretations via Claude Haiku
and a full-spread synthesis via Claude Sonnet.

### UI

Live Component Reference:
[Storybook UI Component Library](https://ava-collins.github.io/simple-tarot/)

## Contents

A yarn workspace monorepository to manage the mobile tarot application, reading
API, AWS infrastructure, and shared React Native component libraries.

`apps/graph-api` is an Express v5 REST API that generates AI-powered tarot
readings using AWS Bedrock Knowledge Base retrieval and Claude model invocation.

`apps/tarot` is a React Native mobile app that uses shared components from the
hooks and ui packages and the Expo framework for application configuration,
building, testing, and deployment.

`apps/infra` is an AWS CDK v2 TypeScript app. It provisions Cognito auth
infrastructure and the Bedrock Knowledge Base stack (AOSS vector store, S3
corpus bucket, IAM roles).

`docs` are a collection of documents that facilitate the planning and execution
of the project as a whole, used to provide context over time.

`packages/hooks` is a shared package written in React Native using Apollo Client
for auth state management and account screens.

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

- [Cognito Expo Config Contract](./docs/cognito_expo_config_contract.md)

- [Infrastructure App](./apps/infra/README.md)

- [Planning Docs](./docs/planning/index.md)


 # Copyright

The [Rider Waite](https://sacred-texts.com/tarot/faq.htm#uscopyright) cards used
in this application are in the public domain; svg pictorial keys were obtained
under [Creative Commons](https://creativecommons.org/publicdomain/zero/1.0/)
open source licensing.

The code in this repository is not open for personal use and not for
distributing.
