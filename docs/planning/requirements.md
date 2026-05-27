# Architectural Requirements

This is a living document with the architectural requirements of Simple Tarot


## Business Goals

| Stakeholder                 | Goal                                                                                         | Context                                                                                              |
| --------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Myself                      | Integrate an LLM into the app                                        | Simple Tarot needs to be more robust in content |
| User experience             | Improve content                                                      | The new backend should provide a more meaningful experience to users |
| User experience             | Improve designs                                                      | The timeline and notes features need to be redesigned |
| Developer experience        | The app should be fully documented                                   | The documentation should be created as if it were a team of developers |

## Contraints

| Constraint                                                              | Context                                                                                                                              |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| [Technical] Authentication and Analytics must be deployed on Firebase   | Existing services on Firebase remain in place |
| [Technical] Graph DB must be deployable on AWS                          | The new features rely on AWS for LLM using Bedrock |

## Quality Attributes

| Quality Attribute | Scenario                                                                                                      | Priority |
| ----------------- | ------------------------------------------------------------------------------------------------------------- | -------- |
| Performance       | A user on a mobile device with a 4G connection can load the app in 5 seconds or less                         | High     |
| Scalability       | The codebase should be modularized to allow for expansion of new features in the future                      | High     |
| Maintainability   | Analytics and crash reports should be accessible on front page of admin application                           | Low      |
| Deployability     | Release notes, versions and changelogs should be automated from code commits                                  | Low      |

## Influential Functional Requirements

#### User Experience

- Mobile first design, universal render for web

    - Components will be created using React Native and React Native for web
    - Storybook UI for React Native will be used to design components and screensfor both web and mobile

#### Developer Experience

- Code quality, versioning and deployment will all be automated

    - Yarn workspace will be used to maintain all application code
    - Expo file based routing will be used to maintain a Next like directory structure to be used for routing on both web and mobile
    - ESLint, Prettier and TypeScript will be used to maintain code standards on each commit
    - Semver with Conventional Commits will be used to automatically generate versioning and changelogs on each release
    - EAS will be used for mobile app deployment in Alpha and Beta stages of the app
    - Docker will be used as main deployment for admin application to be run and developed locally

#### Authentication

- Users can create an account using email, phone number, or anonymously
    - Firebase used to manage authentication
    - Anonymous users still gain an account with fictitious user name, they cannot change passwords
- Users can authenticate using their created account credentials
- Authenticated users can update their profile information
- Authenticated users can reset their passwords if forgotten
- Admins can trigger password reset email 

#### Readings

- Users can get one new reading a day

- Users can save their readings and add notes
    - If storage costs become a concern new readings will be saved as old ones are deleted first in first out
        - Possible to add a fee for prolific users in order to maintain their history online

#### History

- Users can revisit past readings and notes

#### Admin Experience

- Application and backend services can be launched from Docker container
    - Use Docker compose to run application and dependencies locally

- Access to Graph DB
    - Data bindings to production data

- Access to analytics and crash reports
    - A screen with the essentials embedded preferred over a link to firebase dashboard

- Access to shared component library and UI documentation
    - UI packages in Yarn workspace

- Ability to trigger Lambda
    - Shared hooks


## Other Influencers

- Currently there is only one person working on the project
- The developer will leverage UI frameworks and design templates to complete missing UI 
- The developer has experience working with React, React Native, Expo, Next.js, TypeScript, Firebase, Apollo Graph DB, AWS Lambda, Apple Store and Google Play
- The LLM creation is new to the developer, implemenation choices are expected evolve as knowledge is gained
