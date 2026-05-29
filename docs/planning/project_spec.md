# Simple Tarot Project Spec

## Overview

Simple Tarot is a tarot card reading app that is a rebuild of an
[existing application](https://github.com/avacollins/tarot-ix) in order to
expand content generation using an LLM.

## Software System

### System Context

#### System Users

- **User** — Users query the tarot cards and generate a reading, save readings
  and take notes

- **Admin System** — Admins manage and gain insights into usage and performance
  of the Simple Tarot application

#### External Systems

- **Cloud Services** — Firebase, Graph DB, Bedrock, Lambda, Expo

#### System Context Diagram

![System Context Diagram](../../assets/system_context.jpg)

### System Containers

- **User Facing Mobile App** — React Native for iOS and Android

- **Admin Only Web App** — React Native Web, Next, Storybook UI, Docker

- **Core API** — Neo4J Graph DB, Node Graph API server, LLM Foundation Model
  (undecided), Bedrock, Lambda

- **Shared Components** — Storybook UI to create universally rendered components
  and document their uses


#### Container Diagram

##### Mobile App

![Mobile App Diagram](../../assets/mobile_container.jpg)

##### Admin App

![Admin App Diagram](../../assets/admin_container.jpg)

##### Core API

![Core API Diagram](../../assets/api_container.jpg)

## Simple Tarot Mobile and Web Application

### UI Designs

[Existing mobile UI](../../assets/existing_ui.png)

- Will be leveraging existing application layouts for readings and profile

- History and notes screens need to be redesigned

- Storybook UI will be leveraged as component documentation

- Admin application needs full design


### Functional Requirements

#### User Experience

- Mobile first design, universal render for web

#### Authentication

- Users can create an account using email, phone number, or anonymously
- Users can authenticate using their created account credentials
- Authenticated users can update their profile information
- Registered users can reset their passwords if forgotten

#### Readings

- Users can get one new reading a day

- Users can save their readings and add notes

#### History

- Users can revisit past readings and notes

#### Admin Experience

- Application can be launched from a Docker container

- Access to Graph DB

- Access to analytics and crash reports

- Access to shared component library and UI documentation

- Ability to trigger Lambda


## Architectural Documents

👉🏽 Check out

- [requirements](./requirements.md)

- [architectural decisions](./adr.md)

- [domain model with class diagram](./domain_model.md)

- [sequence diagrams](./sequence_diagrams.md)

- [mobile design document phase one](./mobile_design_phase_one.md)

 # Copyright

The [Rider Waite](https://commons.wikimedia.org/wiki/File:Rider-Waite_Major_Arcana_full.png) cards used
in this application are in the public domain; SVG pictorial keys were obtained
under [Creative Commons](https://creativecommons.org/publicdomain/zero/1.0/)
open source licensing.

The code in this repository is open for personal use but not for distributing.
