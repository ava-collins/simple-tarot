# Infrastructure Environment Stages Design

## Goal

Keep the existing `dev` deployment as Simple Tarot's isolated pre-production
environment and establish a separate `prod` environment before implementing the
security-audit hardenings. Both environments use the same AWS account, but they
must not share application identities, data, runtime resources, resource names,
or deployment-role sessions.

## Current State

The CDK app currently creates four stacks for one environment per invocation:

- Cognito
- user data and API logs
- Bedrock, OpenSearch Serverless, and the corpus bucket
- API Gateway and Lambda

Configuration accepts `dev` or `prod`, and most physical names already include
the environment. Only `dev` has been deployed. Its resources and data must not
be renamed, replaced, or recreated as part of this project. No production
infrastructure exists yet.

## Decisions

- Continue using one AWS account.
- Treat the existing `dev` deployment as the test environment; do not add a
  separately named `test` environment.
- Introduce a CDK `SimpleTarotStage` boundary now.
- Defer an automated deployment pipeline until the security hardening and
  production promotion requirements are stable.
- Require explicit environment selection for every synth, diff, and deploy.
- Preserve all existing `dev` CloudFormation stack names and physical resource
  names.
- Create production as new `-prod` stacks and resources.
- Use distinct operator deployment roles for dev and prod.
- Keep the existing account-level CDK bootstrap resources as shared deployment
  tooling. Application resources, application data, Cognito identities, and
  deployment-role sessions remain isolated.
- Keep Bedrock runtime activation disabled in production until the applicable
  security-audit findings have been implemented and validated in dev.

## CDK Architecture

`SimpleTarotStage` owns one environment's Cognito, user-data, Bedrock RAG, and
API stacks. It receives one resolved `InfraConfig` and keeps the current
cross-stack references inside that environment boundary. The API stack may
consume only resources created by the same stage instance.

The CDK entrypoint requires `-c environment=dev` or
`-c environment=prod` and creates only the selected stage. There is no default
deployment environment. Selecting one stage per invocation makes accidental
cross-environment deployment less likely while retaining an explicit construct
that describes the complete environment topology.

Stage construct paths will qualify CDK artifact selectors, but the stacks keep
these explicit CloudFormation names:

| Resource group | Dev stack | Prod stack |
| --- | --- | --- |
| Cognito | `SimpleTarotCognito-dev` | `SimpleTarotCognito-prod` |
| User data | `SimpleTarotUserData-dev` | `SimpleTarotUserData-prod` |
| Bedrock RAG | `SimpleTarotBedrockRag-dev` | `SimpleTarotBedrockRag-prod` |
| API | `SimpleTarotApi-dev` | `SimpleTarotApi-prod` |

The stage applies these tags to all taggable resources:

- `Application=SimpleTarot`
- `Environment=dev|prod`
- `ManagedBy=CDK`

## Configuration Delivery

Infrastructure configuration is stored in separate ignored files:

- `apps/infra/.env.dev`
- `apps/infra/.env.prod`

Committed `.env.dev.example` and `.env.prod.example` files document the
required keys without containing deployed identifiers, account credentials, or
secrets. Configuration loading fails when the selected environment's file is
missing, when `SIMPLE_TAROT_ENV` does not match the selected CDK context, or
when a required value is absent.

CDK outputs are copied only to consumers for the same environment:

- dev outputs go to local or preview Expo and API configuration;
- prod outputs go to production EAS and API configuration.

No repository command automatically copies or promotes configuration from dev
to prod. Cognito pool IDs, client IDs, domains, API URLs, table names, bucket
names, and Bedrock/OpenSearch identifiers must never cross that boundary.

## Deployment Identity

An account-level deployment-access stack, separate from both application
stages, defines two assumable operator roles:

- `SimpleTarotDevDeployRole`
- `SimpleTarotProdDeployRole`

The role trust principals are explicit configuration supplied when the access
stack is deployed. The dev role is scoped to managing the `-dev` application
stacks. The prod role is scoped to managing the `-prod` application stacks and
uses the more restrictive trust policy available to the operator, including
MFA where supported by that identity path. Each role receives only the CDK
bootstrap and CloudFormation permissions required to deploy its own stacks.

The access stack requires an existing administrative identity for its initial
deployment and updates; neither environment deployment role may create or
broaden itself. The roles are deployment identities only. Their credentials
are never delivered to Lambda, Cognito clients, Expo configuration, or
application data operations.

Shared default CDK bootstrap resources are an explicit tooling exception. A
separate bootstrap qualifier per environment is deferred unless deployment
artifact isolation becomes a requirement.

## Resource And Data Isolation

Each environment owns independent instances of:

- Cognito user pool, app client, and hosted domain;
- DynamoDB user-data table;
- API-log S3 bucket;
- Bedrock corpus S3 bucket;
- OpenSearch Serverless policies, collection, and vector index;
- Bedrock knowledge base and data source;
- API Gateway HTTP API;
- Lambda function and execution role;
- CloudWatch log groups, metrics, and alarms.

No application stack may import, grant access to, or configure a runtime ARN,
name, URL, identity, or credential belonging to the other environment. Tests
assert environment-specific names and ensure each API stack refers only to
resources synthesized within its own stage.

Corpus upload and ingestion commands require an explicit environment. Dev and
prod corpus objects and ingestion jobs never share buckets, knowledge bases,
data sources, collections, or indexes.

## Lifecycle Policies

Dev remains optimized for safe iteration:

- destructive removal policies are allowed where already established;
- logs use shorter retention;
- S3 auto-deletion may be used where already supported;
- production deletion protection is not enabled.

Prod protects state and identities:

- Cognito deletion protection is enabled;
- Cognito, DynamoDB, and S3 resources use retain removal policies;
- DynamoDB point-in-time recovery is enabled;
- production logs use longer retention;
- a stack removal must not silently delete user data, logs, corpus content, or
  identity resources.

Application log groups and baseline API Gateway 5xx, Lambda error, and Lambda
throttle alarms use environment-specific names or CDK-generated physical
identities and tags. Their metric dimensions may reference only resources from
the same stage. Notification actions, security-specific thresholds, and
Bedrock cost controls are implemented in later audit-hardening stages without
changing the environment boundary.

## Delivery Stages And Validation Gates

Every implementation stage ends with a user validation gate. Work does not
continue until the user confirms the listed evidence.

### Stage 1: Stage Construct And Configuration Contract

- Add `SimpleTarotStage`.
- Require explicit environment selection.
- Add separate dev and prod configuration templates.
- Preserve current stack and physical resource names.
- Add unit and CDK assertion coverage.
- Run type-checking, tests, and deterministic synthesis locally.
- Make no AWS changes.

### Stage 2: Dev Compatibility Validation

- Synthesize the stage-qualified dev application with the existing dev values.
- Compare it with the deployed dev stacks using `cdk diff`.
- Explain every proposed mutation.
- Block progress on any unexpected replacement, deletion, or data-resource
  rename.
- Do not deploy until the user approves the diff.

### Stage 3: Deployment-Access Foundation

- Add and synthesize the account-level deployment-access stack.
- Review role trust and permissions before deployment.
- Deploy it with an existing administrative identity.
- Prove each role can inspect or operate on its own stack set and cannot operate
  on the other environment's stack set.

### Stage 4: Dev Stage Deployment

- Deploy the approved dev diff through `SimpleTarotDevDeployRole`.
- Run smoke checks.
- Run the Stage 0 two-user authorization harness against dev.
- Confirm existing dev identities and data remain accessible and isolated.

### Stage 5: Production Readiness And First Deployment

- Synthesize and review prod independently.
- Verify unique names, tags, retention and deletion protection, log
  destinations, and alarm references.
- Deploy only through `SimpleTarotProdDeployRole`.
- Keep Bedrock runtime activation disabled.
- Perform non-destructive Cognito and API smoke validation with dedicated
  production users.

## Rollback

- Revert structural CDK regressions by deploying the last known-good revision.
- Use CloudFormation rollback for failed updates.
- Never delete a production stack as a rollback mechanism.
- Retained production resources remain retained during stack rollback or
  removal.
- Treat DynamoDB point-in-time recovery as disaster recovery, not routine
  deployment rollback.
- Block any deployment that proposes replacement of a production Cognito user
  pool, DynamoDB table, or S3 bucket until that replacement receives separate
  review and approval.

## Testing

Local validation includes:

- configuration parser tests for explicit selection, mismatches, missing files,
  and missing values;
- stage synthesis tests for both environments;
- assertions for unchanged dev names and distinct prod names;
- assertions for dev and prod lifecycle policies;
- assertions that API references resolve to same-stage Cognito, DynamoDB, S3,
  Bedrock, and OpenSearch resources;
- assertions for environment tags, log resources, and alarm references;
- deployment-access policy tests that prevent cross-environment stack
  operations;
- existing infrastructure tests and TypeScript builds.

AWS validation includes dev and prod `cdk diff`, role-boundary checks, stack
output inspection, smoke requests, and the existing two-user authorization
harness in dev. Commands that mutate AWS state are presented separately and
run only after the preceding validation gate is approved.

## Acceptance Criteria

The environment project is complete when:

- existing dev resources remain intact and dev operates as the test
  environment;
- prod has unique stacks and no runtime reference to dev;
- dev and prod use separate Cognito identities, data stores, buckets, APIs,
  Lambdas, logs, alarms, and Bedrock/OpenSearch resources;
- production stateful resources have protective lifecycle policies;
- every deployment requires an explicit environment and the matching assumed
  role;
- cross-environment role operations fail;
- dev passes local tests, CDK assertions, smoke checks, and the two-user
  isolation harness;
- prod passes synthesis, policy assertions, and non-destructive smoke checks;
- deployment, configuration delivery, validation, and rollback commands are
  documented;
- no automated pipeline, queue, promotion workflow, or automatic production
  deployment is introduced.

## Out Of Scope

This project establishes environment boundaries. It does not implement the
individual findings in `docs/superpowers/security-audit-2026-07-14.md`.
Security hardenings will be developed and validated in dev before production
rollout. Separate AWS accounts, separate CDK bootstrap qualifiers, and an
automated deployment pipeline are also deferred.
