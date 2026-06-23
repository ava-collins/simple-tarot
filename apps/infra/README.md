# Simple Tarot Infrastructure

This workspace contains the AWS CDK v2 app for Simple Tarot infrastructure.

## App Structure

- `bin/simple-tarot-infra.ts` is the CDK entrypoint.
- `lib/config.ts` loads deployment configuration from `apps/infra/.env`.
- `lib/cognito-stack.ts` defines the Cognito user pool, public OAuth app
  client, hosted domain, and Expo-facing CloudFormation outputs.
- `test/cognito-stack.test.ts` contains CDK assertion tests for the stack
  contract.

## Cognito Stack

The current CDK app synthesizes one Cognito stack for the configured Simple
Tarot environment. The stack name follows:

```text
SimpleTarotCognito-<environment>
```

The stack creates:

- a Cognito user pool for email sign-in and self sign-up
- a public app client for Expo/mobile OAuth authorization-code flow
- a hosted Cognito domain
- CloudFormation outputs that map to Expo `EXPO_PUBLIC_*` values

The app client does not create a client secret. Expo receives public
identifiers and URLs only.

`dev` uses destroy removal policy for iteration. `prod` uses retain removal
policy plus Cognito deletion protection, but production deployment settings
should be reviewed before first deployment.

## Environment Configuration

Deployment-specific values are intentionally kept out of committed source and
are loaded from `apps/infra/.env`.

Create the local env file from the example:

```sh
cp apps/infra/.env.example apps/infra/.env
```

Then fill in every value in `apps/infra/.env` before running CDK commands. The
real `.env` file is ignored by git.

The example file lists required variable names only:

- `SIMPLE_TAROT_ENV`
- `SIMPLE_TAROT_AWS_REGION`
- `SIMPLE_TAROT_MOBILE_CALLBACK_URL`
- `SIMPLE_TAROT_MOBILE_LOGOUT_URL`
- `SIMPLE_TAROT_WEB_CALLBACK_URL`
- `SIMPLE_TAROT_WEB_LOGOUT_URL`
- `SIMPLE_TAROT_COGNITO_DOMAIN_PREFIX`

Do not commit real environment values.

## Expo Contract

The Expo-facing public output contract is documented in
`docs/cognito_expo_config_contract.md`.

After deployment, sync the CDK outputs into:

- `apps/tarot/.env.local` for local development
- EAS environment variables for preview/testing builds

Use `apps/tarot/.env.local.example` as the local template. The real
`.env.local` file is ignored by git.

## Commands

```sh
yarn workspace infra build
yarn workspace infra test
yarn workspace infra cdk synth
```

`yarn workspace infra cdk synth` requires a populated `apps/infra/.env`.
