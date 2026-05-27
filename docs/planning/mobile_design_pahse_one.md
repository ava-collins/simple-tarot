# Simple Tarot Mobile App Design Doc Phase One

## 1. Overview

This document outlines the high-level architecture design for Simple Tarot's user-facing mobile application.

Simple Tarot aims to rebuild its current prototype application in order to incorporate generative AI into the backend to create more engaging content for the end user over time. 

This design document addresses the architectural requirements, provides a high-level design, considers alternatives, and outlines a timeline for implementation of the first phase of the rebuild which is focused on laying the foundation of the system as a whole.

## 2. Context

Simple Tarot's prototype application has defined the overall application functionality but the code organization does not lend itself to expansion.

The end goal is to rebuild the system backend to support phase two LLM integrations.

Technical goals for phase one are to design a new architecture that is scalable, modular, and maintainable, allowing new features to built up from the existing core over time. 

![System Context Phase One](../assets/mobile_system_context_p1.png)


## 3. Goals and Non-Goals

### Goals

- **Scalability**: Design an architecture that can support a growing set of use cases for AGI
- **Modularity**: Ensure the codebase is modular to allow rapid iterations of different core areas autonomously
- **Maintainability**: Automated code quality tools for enforcing code styles i.e. TS build, ESLint, Conventional Commits, etc.

### Non-Goals

- **UI Design**: This project focuses on the application code organization and backend architecture at this time
- **Admin Web App Development**: The scope is limited to the mobile application, the admin app will have it's own design document
- **AGI**: Phase two will have it's own design document

## 4. High Level Design

The mobile application rebuild will continue to be a yarn workspace monorepository with all components documented using Storybook UI. Existing code base will be refactored to support a universal application render on both mobile and web. 


Phase One will include 
- Restructure of mobile routing using Expo file based router
- Migration of NoSQL database to Graph DB
- UI packages to adhere to atomic design principles where ui is built up from atoms, molecules, organisms, templates and screens

### Container Diagrams


![Core API](../assets/core_api_system.png)

![UI Library](../assets/component_library.png)

![File Based Routing](../assets/file_based_routing.png)

### Graph Schema

![Graph Schema](../assets/graph-schema.png)

### Architectural Style

- **Component-Based Architecture**: Utilize Storybook UI to create a component library using React Native
- **Monorepo**: Develop our frontend apps and packages in a monorepo to speed up development and remove friction when sharing code
- **TypeScript**: Use TypeScript for type safety and better developer experience
- **Graph API**: Use GraphQL library to query DB via node server

### Key Components

1. **Expo Routing Module**: Initial Expo setup with file based routing implemented

2. **UI Module**: The core user interface library for both mobile and web applications

3. **Hooks Module**: Universal data providers for the UI using apollo/client for application state management

4. **Neo4J Module**: Graph DB and API server

5. **Next Web Module**: Ensure setup includes a functional template repository

### Technology Stack

- **Frontend**: React Native, TypeScript, Apollo Client Storybook UI, Next
- **Backend**: Node/Express, Neo4J, Apollo Server
- **Deployment**: Docker, AWS, Expo

## 5. Alternatives Considered

1. **MemGraph DB**: Prefer Neo4J documentation
2. **Auroa DB**: Paid product not necessary
3. **Redux**: Use of redux is redundant with apollo/client and considered an anti-pattern if used together as they are both tracking state there is a risks of syncing issues, use of apollo/client is the source of truth and provides local state management via caching and local variables

## 6. Timeline

### Phase 1: Discovery and Planning (May 2025 - June 2025)

- Finalize requirements and gather detailed specifications
- Design the architecture and create detailed technical documentation

### Phase 2: Initial Development (June 2025 - July 2025)

- [x] Set up yarn workspace and application file based routing
- [ ] Implement UI packages in Storybook
- [ ] Migrate data and client libraries to use Apollo client for state management
- [ ] Implement UI screens into application code

### Phase 4: Testing and Deployment (August 2025)

- [ ] Perform comprehensive end-to-end testing
- [ ] Deploy Graph DB to AWS
- [ ] Deploy App to EAS

## 7. Risks and Open Questions

### Risks

- **Time**: Finding a fulltime job would affect the output of this project 

- **Money**: Hosting on AWS may be too expensive to maintain

### Open Questions

- **Test**: Storybook UI for testing UI components, TBD for Next and Node

- **Versioning**: Leaning towards some form of Conventional Commits for monorepo overall, with EAS for mobile app build increments

- **Profile Enhancement**: Should change email function be added now or later when it presents a need
