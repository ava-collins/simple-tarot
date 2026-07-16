# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Root workspace

```sh
yarn lint               # lint all apps and packages
yarn lint:fix           # lint with auto-fix
yarn build              # lint + build types for all workspaces
yarn storybook          # run Storybook for packages/ui
yarn knip               # dead code analysis
```

### REST API (`apps/api`)

```sh
yarn api:dev            # nodemon dev server (default: port 4100)
yarn api:build          # compile TypeScript
```

### Mobile app (`apps/tarot`)

```sh
yarn ios                # run on iOS simulator (expo run:ios)
yarn workspace tarot start  # Expo dev server
yarn workspace tarot test   # vitest
```

### Infrastructure (`apps/infra`)

```sh
yarn workspace infra cdk synth   # requires apps/infra/.env to be populated
yarn workspace infra test        # CDK assertion tests (Jest)
yarn workspace infra build-types # compile TypeScript
```

### Running tests

```sh
yarn test                     # all workspaces with test suites
yarn workspace <name> test    # single workspace, e.g. yarn workspace @simpletarot/hooks test
```

`packages/ui` has no test suite and is excluded from `yarn test`.

## Environment files

Each app has an `.env.example` — copy and fill before running locally:

- `apps/api/.env` — auth mode, Bedrock credentials, DynamoDB table name, S3 log bucket
- `apps/infra/.env` — CDK deployment config (env name, region, Cognito/Bedrock values)
- `apps/tarot/.env.local` — Expo public vars: API URL, Cognito endpoints

None of these files are committed to git.

## Architecture

### Monorepo layout

Yarn 4 workspace monorepo. Three shared packages consumed by the mobile app:

| Package | Purpose |
|---|---|
| `packages/hooks` | Account auth form hooks (`useLoginForm`, `useSignupForm`, `useForgotPasswordForm`), `useInstructions`, `useAvatarImage` |
| `packages/cards` | Tarot card SVG components generated via SVGR |
| `packages/ui` | Storybook-driven React Native component library |

### Data flow

```
apps/tarot (Expo SDK 57, expo-router)
  └── REST → apps/api (Express 5)
               ├── local mode  → placeholder reading response
               └── bedrock mode → Bedrock Agent Runtime RetrieveAndGenerate
                                   ↑ Bedrock Knowledge Base (S3 Vectors)
               └── DynamoDB   → reading history persistence (authenticated)
               └── GET /avatars → SerpAPI Google Images
```

### `apps/api` — REST reading API

- **Two runtime modes** controlled by `BEDROCK_RUNTIME_MODE` env var:
  - `local` (default): returns deterministic placeholder readings — no AWS calls
  - `bedrock`: calls Bedrock Agent Runtime `RetrieveAndGenerate` against the Knowledge Base
- **Auth**: Cognito JWT tokens validated with `jose`. Mode controlled by `API_AUTH_MODE` (`disabled` | `cognito`). Unauthenticated reads are still permitted; persistence requires auth.
- **Persistence**: Authenticated readings are saved to DynamoDB. Table uses composite `pk`/`sk` keys for user profile, successful readings, and failed attempts.
- **Lambda compatibility**: `src/lambda.ts` wraps the Express app with `@codegenie/serverless-express` for the CDK API stack deployment.

### `apps/infra` — AWS CDK v2

Four stacks deployed per environment (`SIMPLE_TAROT_ENV`):

| Stack | Key resources |
|---|---|
| `SimpleTarotCognito-<env>` | Cognito user pool, public OAuth app client, hosted domain |
| `SimpleTarotBedrockRag-<env>` | S3 corpus bucket, S3 Vectors vector store, Bedrock Knowledge Base |
| `SimpleTarotUserData-<env>` | DynamoDB user-data table, S3 API log bucket |
| `SimpleTarotApi-<env>` | Lambda (Node 22), API Gateway HTTP API, Cognito JWT authorizer |

CloudFormation outputs from infra stacks feed directly into `apps/api` env vars. The mapping is documented in `apps/infra/README.md` under "API Contract".

### `apps/tarot` — Expo mobile app

- Expo SDK 57, expo-router for file-based navigation
- Auth via `AuthProvider` in `src/app/_layout.tsx` wrapping a Cognito OAuth flow (`expo-auth-session`, `expo-web-browser`)
- RSC pilot: readings and avatars use Expo Server Functions; keep auth, SecureStore, navigation, form state, and avatar display/randomization client-side.
- **Always check versioned Expo docs at `https://docs.expo.dev/versions/v57.0.0/` before writing Expo-specific code** (APIs change significantly between SDK versions)

## Commit conventions

Conventional commits enforced by commitlint. Semantic release runs per workspace to derive semver from commit messages. Use `fix:`, `feat:`, `chore:`, `docs:` prefixes.

@AGENTS.md
