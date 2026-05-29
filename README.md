# Simple Tarot Project Spec

## Overview

Simple Tarot is a rebuild of my older React Native
[mobile app](https://github.com/avacollins/tarot-ix) that aims to enrich
readings by using highly customized AI generated content.

### Backend
The rebuild is two phased,

1. The first phase is to replicate legacy database values to a vector database
   store. This will setup the customized content nodes which will facilitate the
   second phase model training.
                                                           
2. The second phase will integrate the vector relationships with a pretrained
   LLM using AWS Bedrock. Custom prompts will be created to generate text
   content for readings in the app.

### UI
Live Component Reference
[Storybook UI Component Library](https://ava-collins.github.io/simple-tarot/)

## Contents

A yarn workspace monorepository to manage shared React Native component
libraries used in both mobile tarot application and web admin application.

`apps/admin` is a Next web application using React Native Web shared components
from hooks and ui packages to debug tarot mobile app and admin the graph
database.

`apps/graph-api` is an Apollo graph server built on top of Node/Express server
connected to a Neo4j database, providing the core API for both client
applications.

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

- [Planning Docs](./docs/planning/index.md)


 # Copyright

The [Rider Waite](https://sacred-texts.com/tarot/faq.htm#uscopyright) cards used
in this application are in the public domain; svg pictorial keys were obtained
under [Creative Commons](https://creativecommons.org/publicdomain/zero/1.0/)
open source licensing.

The code in this repository is not open for personal use and not for
distributing.
