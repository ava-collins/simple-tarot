# Testing Simple Tarot

## Overview
Phase one testing will focus on the foundations of the system as it relates to the mobile application and the core api supporting it. The admin web application will be included in Phase Two development as well as any integrations related to LLM usage.

## Testing Context

- UI component library built with React Native
    -  Storybook React Native Web Framework on Vite
- Graph API
    - neo4j-forgery & AVA
- Hooks package that connect data providers to application state
    - React Testing Library

## Phase Two Considerations

Adding Observability instrumentation

- UI components
    - https://github.com/oblador/react-native-performance
    - 
- Graph API
    - https://docs.newrelic.com/docs/apm/agents/nodejs-agent/extend-your-instrumentation/apollo-server-plugin-nodejs/