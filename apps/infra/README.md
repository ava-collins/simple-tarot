# Simple Tarot Infrastructure

This workspace contains the AWS CDK v2 app for Simple Tarot infrastructure.

## Cognito MVP

The current CDK app synthesizes a Cognito stack for the configured Simple Tarot
environment. Deployment-specific values are intentionally kept out of committed
source and are loaded from `apps/infra/.env`.

Create the local env file from the example:

```sh
cp apps/infra/.env.example apps/infra/.env
```

Then fill in every value in `apps/infra/.env` before running CDK commands. The
real `.env` file is ignored by git.

`dev` uses destroy removal policy for iteration. `prod` is already modeled as a
supported environment and uses retain removal policy plus Cognito deletion
protection, but production deployment settings should be reviewed before first
deployment.

## Commands

```sh
yarn workspace infra test
yarn workspace infra cdk synth
```
