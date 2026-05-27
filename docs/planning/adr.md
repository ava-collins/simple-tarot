# ADR1: Mobile First Universal Rendering

## Status

Accepted

## Context

The user facing system is a mobile app, while the content development and administration system is a web app. In order to maintain the most parity between the two systems the UI components and screens must be shared on both platforms. 

## Decision

React Native and React Native for web will be used to create shared component code. Expo file based routing and Next.js file based routing will be used to organize application code separate from shared component code. Yarn workspaces will be used to maintain code dependencies across all systems.

## Consequences

- Performance may suffer on both mobile and web due to the transpiling of JavaScript at runtime
- Monorepositories require skilled management to avoid issues with maintainability and scalability in the future

---

# ADR2: File Based Routing

## Status

Accepted

## Context

Maintaining a shared component library is good for application components, divergent organizational structures between apps incur increased cognitive load during development. Having parity between the two routing implementations would reduce mental mapping resulting in higher code quality.

## Decision

Use the latest Expo router with file based routing that is compatible with Next file based router in order to organize both application code structures and routing capabilities as similarly as possible. 

## Consequences

- Updating existing application code organization to file based routing rules. 
- Less configuration code in order to implement routing and deep linking on mobile apps.

---

---

# ADR3: Application State Management 

## Status

Accepted

## Context

Both apps will need to employ apollo client for data fetching from core-api as well as application state management and caching.

## Decision

Apollo Client in both apps for state management and cache.

## Consequences

- Possibility of performance reduction due to poorly configured application code.

# ADR4: Neo4J Graph DB

## Status

Proposed

## Context

The existing application is using Firestore for document storage. This storage system is not scalable enough for the future plans of the application. A relational database is also not sufficient due to the overhead it requires to model data. A Graph DB will be used but the exact engine has not yet been decided. Neo4J has many features that are focused on machine learning which makes it an attractive choice. 

## Decision

Migrating data to Neo4J

## Consequences

- Neo4J is a new platform and will require time to ramp up
- Neo4J provides many data adapters for uses with Python and Graph API
- Neo4J is deployable on AWS

---

# ADR5: AWS Bedrock

## Status

Proposed

## Context

Application needs to choose a platform to host and train LLM for use with code content. Lamba functions easily connect to Bedrock and AWS offers a large foundation model catalog. 

## Decision

Move ahead with Graph DB phase one with the objective in mind that it will be deployed onto AWS to be used with Bedrock.

## Consequences

- Totally unknown at this point what other options may arise so this is long term proposal subject to change

---

# ADR6: Expo Application Service 

## Status

Accepted

## Context

Mobile apps require a lengthy set of steps in order to publish apps on a store for testing during development. Expo Application Service provides mobile distribution as a service during development and beyond. 

## Decision

Build on EAS

## Consequences

- Ease of development, testing and sharing mobile app
- Can be extended for app store release when desired

---

# ADR7: Docker container for local web application

## Status

Proposed

## Context

The administration web app will only ever be required to be run by one person and it can be 100% local. No need to deploy online. The future complexity of the app and number of containers will require a local development environment that can be run via configuration as close to parity as it would in the cloud.

## Decision

Make the web app a Docker container.

## Consequences

- Docker configuration files will need to be maintained

---

# ADR8: Design Tools 

## Status

Proposed

## Context

The existing designs are the screens from the prototype app that has no official design mockups. New screens and improvements to existing screens require a tool for creating mockups. Industry standards use Figma, but as sole contributor to the project I prefer a simpler tool such as Canva.

## Decision

Copying application elements into Canva for further design

## Consequences

- Organize designs and application flow using non industry standard tool
- Subscription fee is required.

---
