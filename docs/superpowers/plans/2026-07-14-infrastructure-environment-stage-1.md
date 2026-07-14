# Infrastructure Environment Stage 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Introduce an explicit CDK environment stage and separate dev/prod configuration contracts without deploying or replacing any AWS resource.

**Architecture:** A new `SimpleTarotStage` owns the existing Cognito, user-data, Bedrock RAG, and API stacks for exactly one selected environment. The entrypoint requires `-c environment=dev|prod`, loads only `apps/infra/.env.<environment>`, and preserves every current CloudFormation stack name and application physical name.

**Tech Stack:** TypeScript 5.9, AWS CDK v2, Jest 30, dotenv, Yarn 4.

## Global Constraints

- Continue using one AWS account.
- Treat existing `dev` as the test environment; do not add `test`.
- Preserve all existing `dev` CloudFormation and physical resource names.
- Run no AWS-mutating command and no `cdk deploy` in Stage 1.
- Require explicit environment selection for synth, diff, and deploy.
- Keep `BEDROCK_RUNTIME_MODE=local`.
- Do not add a pipeline or change CDK bootstrap resources.
- Stop at the Stage 1 validation gate until the user confirms.

## File Structure

- Create `apps/infra/lib/simple-tarot-stage.ts` to compose the four stacks.
- Create `apps/infra/test/config.test.ts` for configuration behavior.
- Create `apps/infra/test/simple-tarot-stage.test.ts` for stage boundaries.
- Modify `apps/infra/lib/config.ts` for explicit selection and file loading.
- Modify `apps/infra/bin/simple-tarot-infra.ts` to create one selected stage.
- Modify existing infra tests to declare a matching `SIMPLE_TAROT_ENV`.
- Replace `.env.example` with `.env.dev.example` and `.env.prod.example`.
- Modify `.gitignore` so `.env.dev` and `.env.prod` are ignored.
- Modify `apps/infra/README.md` with migration and explicit commands.

---

### Task 1: Fail-Closed Environment Configuration

**Files:**
- Create: `apps/infra/test/config.test.ts`
- Modify: `apps/infra/lib/config.ts`
- Modify: `apps/infra/test/cognito-stack.test.ts`
- Modify: `apps/infra/test/user-data-stack.test.ts`
- Modify: `apps/infra/test/bedrock-rag-stack.test.ts`
- Modify: `apps/infra/test/api-stack.test.ts`

**Interfaces:**
- Consumes: CDK context key `environment` and `.env.<environment>` files.
- Produces: `SimpleTarotEnvironment`, `parseSimpleTarotEnvironment`, `getSelectedEnvironment`, `loadInfraEnv`, and fail-closed `getInfraConfig`.

- [ ] **Step 1: Write failing configuration tests**

Create `apps/infra/test/config.test.ts`:

```ts
import * as cdk from 'aws-cdk-lib/core';
import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { getInfraConfig, getSelectedEnvironment, loadInfraEnv } from '../lib/config';

const devEnv = {
  SIMPLE_TAROT_ENV: 'dev',
  SIMPLE_TAROT_AWS_REGION: 'us-east-1',
  SIMPLE_TAROT_MOBILE_CALLBACK_URL: 'simpletarot://auth/callback',
  SIMPLE_TAROT_MOBILE_LOGOUT_URL: 'simpletarot://auth/logout',
  SIMPLE_TAROT_WEB_CALLBACK_URL: 'https://example.com/auth/callback',
  SIMPLE_TAROT_WEB_LOGOUT_URL: 'https://example.com/auth/logout',
  SIMPLE_TAROT_COGNITO_DOMAIN_PREFIX: 'simple-tarot-dev',
};

describe('infrastructure environment configuration', () => {
  it.each(['dev', 'prod'] as const)('selects %s from CDK context', (environment) => {
    expect(getSelectedEnvironment(new cdk.App({ context: { environment } }))).toBe(environment);
  });

  it('rejects missing context', () => {
    expect(() => getSelectedEnvironment(new cdk.App())).toThrow(
      'Missing CDK context environment. Pass -c environment=dev or -c environment=prod.'
    );
  });

  it('rejects unsupported context', () => {
    const app = new cdk.App({ context: { environment: 'test' } });
    expect(() => getSelectedEnvironment(app)).toThrow(
      'Unsupported Simple Tarot environment "test". Expected "dev" or "prod".'
    );
  });

  it('loads only the selected file', () => {
    const directory = mkdtempSync(join(tmpdir(), 'simple-tarot-infra-'));
    writeFileSync(join(directory, '.env.dev'), 'SIMPLE_TAROT_ENV=dev\n');
    writeFileSync(join(directory, '.env.prod'), 'SIMPLE_TAROT_ENV=prod\n');
    try {
      expect(loadInfraEnv('prod', directory)).toEqual({ SIMPLE_TAROT_ENV: 'prod' });
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it('names the missing selected file', () => {
    const directory = mkdtempSync(join(tmpdir(), 'simple-tarot-infra-'));
    try {
      expect(() => loadInfraEnv('prod', directory)).toThrow(
        `Missing infra environment file at ${join(directory, '.env.prod')}. Create it from apps/infra/.env.prod.example.`
      );
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it('rejects a mismatched file declaration', () => {
    expect(() => getInfraConfig({
      app: new cdk.App(), environmentName: 'prod', env: devEnv,
    })).toThrow(
      'Infra environment mismatch: selected "prod" but SIMPLE_TAROT_ENV is "dev".'
    );
  });
});
```

- [ ] **Step 2: Verify the tests fail**

Run: `yarn workspace infra test config.test.ts --runInBand`

Expected: FAIL because the new selector and loader signatures do not exist.

- [ ] **Step 3: Implement the explicit configuration contract**

In `apps/infra/lib/config.ts`, export the type and replace the default file/parser code with:

```ts
export type SimpleTarotEnvironment = 'dev' | 'prod';
type InfraEnvironment = Record<string, string | undefined>;
const DEFAULT_ENV_DIRECTORY = join(__dirname, '..');

export function parseSimpleTarotEnvironment(value: unknown): SimpleTarotEnvironment {
  if (value === 'dev' || value === 'prod') return value;
  throw new Error(
    `Unsupported Simple Tarot environment "${String(value)}". Expected "dev" or "prod".`
  );
}

export function getSelectedEnvironment(app: cdk.App): SimpleTarotEnvironment {
  const value = contextValue(app, 'environment');
  if (value === undefined) {
    throw new Error(
      'Missing CDK context environment. Pass -c environment=dev or -c environment=prod.'
    );
  }
  return parseSimpleTarotEnvironment(value);
}

export function loadInfraEnv(
  environmentName: SimpleTarotEnvironment,
  envDirectory = DEFAULT_ENV_DIRECTORY
): InfraEnvironment {
  const path = join(envDirectory, `.env.${environmentName}`);
  if (!existsSync(path)) {
    throw new Error(
      `Missing infra environment file at ${path}. Create it from apps/infra/.env.${environmentName}.example.`
    );
  }
  return dotenv.parse(readFileSync(path));
}
```

At the beginning of `getInfraConfig`, replace fallback selection with:

```ts
const env = input.env ?? process.env;
if (input.environmentName === undefined) {
  throw new Error('InfraConfig requires an explicit environmentName.');
}
const environmentName = parseSimpleTarotEnvironment(input.environmentName);
const declaredEnvironment = parseSimpleTarotEnvironment(
  requiredEnvValue(env, 'SIMPLE_TAROT_ENV')
);
if (environmentName !== declaredEnvironment) {
  throw new Error(
    `Infra environment mismatch: selected "${environmentName}" but SIMPLE_TAROT_ENV is "${declaredEnvironment}".`
  );
}
const awsRegion = requiredEnvValue(env, 'SIMPLE_TAROT_AWS_REGION');

return {
  environmentName,
  awsRegion,
  mobileCallbackUrl: requiredEnvValue(env, 'SIMPLE_TAROT_MOBILE_CALLBACK_URL'),
  mobileLogoutUrl: requiredEnvValue(env, 'SIMPLE_TAROT_MOBILE_LOGOUT_URL'),
  webCallbackUrl: requiredEnvValue(env, 'SIMPLE_TAROT_WEB_CALLBACK_URL'),
  webLogoutUrl: requiredEnvValue(env, 'SIMPLE_TAROT_WEB_LOGOUT_URL'),
  cognitoDomainPrefix: requiredEnvValue(env, 'SIMPLE_TAROT_COGNITO_DOMAIN_PREFIX'),
  apiFunctionName: `simple-tarot-${environmentName}-api`,
  apiName: `simple-tarot-${environmentName}-api`,
  apiStackName: `SimpleTarotApi-${environmentName}`,
  stackName: `SimpleTarotCognito-${environmentName}`,
  userPoolName: `simple-tarot-${environmentName}-users`,
  userDataStackName: `SimpleTarotUserData-${environmentName}`,
  userDataTableName: `simple-tarot-${environmentName}-user-data`,
  bedrockStackName: `SimpleTarotBedrockRag-${environmentName}`,
  bedrockKnowledgeBaseName: `simple-tarot-${environmentName}-readings`,
  bedrockDataSourceName: `simple-tarot-${environmentName}-corpus`,
  bedrockCollectionName: `st-${environmentName}-rag`,
  bedrockVectorIndexName: 'tarot-readings',
  bedrockCorpusPrefix: optionalEnvValue(env, 'SIMPLE_TAROT_BEDROCK_CORPUS_PREFIX', 'corpus/'),
  bedrockEmbeddingModelId: optionalEnvValue(
    env, 'SIMPLE_TAROT_BEDROCK_EMBEDDING_MODEL_ID', 'amazon.titan-embed-text-v2:0'
  ),
  bedrockEmbeddingDimensions: optionalIntegerEnvValue(
    env, 'SIMPLE_TAROT_BEDROCK_EMBEDDING_DIMENSIONS', 1024
  ),
  bedrockGenerationModelId: optionalEnvValue(
    env,
    'SIMPLE_TAROT_BEDROCK_GENERATION_MODEL_ID',
    'global.anthropic.claude-sonnet-4-5-20250929-v1:0'
  ),
  aossIndexPrincipalArn:
    optionalEnvValue(env, 'SIMPLE_TAROT_AOSS_INDEX_PRINCIPAL_ARN', '') || undefined,
};
```

Delete `DEFAULT_ENVIRONMENT` and `firstDefined`.

- [ ] **Step 4: Update existing test fixtures**

Add `SIMPLE_TAROT_ENV: 'dev'` to fixed dev fixtures. In helpers accepting an environment, pass:

```ts
env: {
  ...baseEnv,
  SIMPLE_TAROT_ENV: environmentName,
},
```

Delete the existing `loads deployment values from an explicit env file` test from
`cognito-stack.test.ts` and remove its `fs`, `os`, and `path` imports. The new
selected-file and mismatch cases in `config.test.ts` own this configuration
boundary; the stack fixtures continue to prove that required values reach CDK
resources and outputs.

- [ ] **Step 5: Verify all infra tests**

Run: `yarn workspace infra test --runInBand`

Expected: PASS.

- [ ] **Step 6: Commit**

```sh
git add apps/infra/lib/config.ts apps/infra/test/config.test.ts apps/infra/test/cognito-stack.test.ts apps/infra/test/user-data-stack.test.ts apps/infra/test/bedrock-rag-stack.test.ts apps/infra/test/api-stack.test.ts
git commit -m "refactor(infra): require explicit environment config"
```

---

### Task 2: Environment Stage Composition

**Files:**
- Create: `apps/infra/lib/simple-tarot-stage.ts`
- Create: `apps/infra/test/simple-tarot-stage.test.ts`

**Interfaces:**
- Consumes: `InfraConfig` and the four existing stack constructors.
- Produces: `SimpleTarotStageProps`, `SimpleTarotStage`, and public stack properties.

- [ ] **Step 1: Write the failing stage test**

Create `apps/infra/test/simple-tarot-stage.test.ts`:

```ts
import * as cdk from 'aws-cdk-lib/core';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { getInfraConfig, type SimpleTarotEnvironment } from '../lib/config';
import { SimpleTarotStage } from '../lib/simple-tarot-stage';

const account = '123456789012';
const region = 'us-east-1';

function synthesize(environmentName: SimpleTarotEnvironment) {
  const app = new cdk.App();
  const config = getInfraConfig({
    app,
    environmentName,
    env: {
      SIMPLE_TAROT_ENV: environmentName,
      SIMPLE_TAROT_AWS_REGION: region,
      SIMPLE_TAROT_MOBILE_CALLBACK_URL: 'simpletarot://auth/callback',
      SIMPLE_TAROT_MOBILE_LOGOUT_URL: 'simpletarot://auth/logout',
      SIMPLE_TAROT_WEB_CALLBACK_URL: 'https://example.com/auth/callback',
      SIMPLE_TAROT_WEB_LOGOUT_URL: 'https://example.com/auth/logout',
      SIMPLE_TAROT_COGNITO_DOMAIN_PREFIX: `simple-tarot-${environmentName}`,
      SIMPLE_TAROT_AOSS_INDEX_PRINCIPAL_ARN:
        `arn:aws:iam::${account}:role/cdk-hnb659fds-cfn-exec-role-${account}-${region}`,
    },
  });
  const suffix = environmentName === 'dev' ? 'Dev' : 'Prod';
  return new SimpleTarotStage(app, `SimpleTarot${suffix}`, {
    config, env: { account, region },
  });
}

describe('SimpleTarotStage', () => {
  it.each([
    ['dev', 'SimpleTarotCognito-dev', 'SimpleTarotUserData-dev', 'SimpleTarotBedrockRag-dev', 'SimpleTarotApi-dev'],
    ['prod', 'SimpleTarotCognito-prod', 'SimpleTarotUserData-prod', 'SimpleTarotBedrockRag-prod', 'SimpleTarotApi-prod'],
  ] as const)('keeps stable %s stack names', (environment, cognito, data, bedrock, api) => {
    const stage = synthesize(environment);
    expect(stage.cognitoStack.stackName).toBe(cognito);
    expect(stage.userDataStack.stackName).toBe(data);
    expect(stage.bedrockStack.stackName).toBe(bedrock);
    expect(stage.apiStack.stackName).toBe(api);
  });

  it('wires API values only from its stage', () => {
    const template = Template.fromStack(synthesize('dev').apiStack);
    const fn = Object.values(template.findResources('AWS::Lambda::Function'))[0];
    const variables = fn.Properties.Environment.Variables;
    expect(JSON.stringify(variables.API_LOG_BUCKET_NAME)).toContain('SimpleTarotUserDatadev');
    expect(JSON.stringify(variables.BEDROCK_KNOWLEDGE_BASE_ID)).toContain('SimpleTarotBedrockRagdev');
    expect(variables.USER_DATA_TABLE_NAME).toBe('simple-tarot-dev-user-data');
  });

  it('tags owned resources', () => {
    const template = Template.fromStack(synthesize('prod').cognitoStack);
    template.hasResourceProperties('AWS::Cognito::UserPool', {
      UserPoolName: 'simple-tarot-prod-users',
      Tags: Match.arrayWith([
        { Key: 'Application', Value: 'SimpleTarot' },
        { Key: 'Environment', Value: 'prod' },
        { Key: 'ManagedBy', Value: 'CDK' },
      ]),
    });
  });
});
```

- [ ] **Step 2: Verify the test fails**

Run: `yarn workspace infra test simple-tarot-stage.test.ts --runInBand`

Expected: FAIL because `simple-tarot-stage.ts` does not exist.

- [ ] **Step 3: Implement `SimpleTarotStage`**

Create `apps/infra/lib/simple-tarot-stage.ts`:

```ts
import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import { ApiStack } from './api-stack';
import { BedrockRagStack } from './bedrock-rag-stack';
import { CognitoStack } from './cognito-stack';
import type { InfraConfig } from './config';
import { UserDataStack } from './user-data-stack';

export interface SimpleTarotStageProps extends cdk.StageProps { config: InfraConfig }

export class SimpleTarotStage extends cdk.Stage {
  public readonly apiStack: ApiStack;
  public readonly bedrockStack: BedrockRagStack;
  public readonly cognitoStack: CognitoStack;
  public readonly userDataStack: UserDataStack;

  constructor(scope: Construct, id: string, props: SimpleTarotStageProps) {
    super(scope, id, props);
    const common = { config: props.config, env: props.env };
    this.cognitoStack = new CognitoStack(this, props.config.stackName, {
      ...common, stackName: props.config.stackName,
    });
    this.userDataStack = new UserDataStack(this, props.config.userDataStackName, {
      ...common, stackName: props.config.userDataStackName,
    });
    this.bedrockStack = new BedrockRagStack(this, props.config.bedrockStackName, {
      ...common, stackName: props.config.bedrockStackName,
    });
    this.apiStack = new ApiStack(this, props.config.apiStackName, {
      ...common,
      apiLogBucket: this.userDataStack.apiLogBucket,
      knowledgeBase: this.bedrockStack.knowledgeBase,
      stackName: props.config.apiStackName,
      userDataTable: this.userDataStack.userDataTable,
      userPool: this.cognitoStack.userPool,
      userPoolClient: this.cognitoStack.userPoolClient,
    });
    cdk.Tags.of(this).add('Application', 'SimpleTarot');
    cdk.Tags.of(this).add('Environment', props.config.environmentName);
    cdk.Tags.of(this).add('ManagedBy', 'CDK');
  }
}
```

- [ ] **Step 4: Verify focused and full tests**

```sh
yarn workspace infra test simple-tarot-stage.test.ts --runInBand
yarn workspace infra test --runInBand
```

Expected: PASS. If CDK renders a more specific stage-qualified token string, assert that exact value rather than weakening it to `Match.anyValue()`.

- [ ] **Step 5: Commit**

```sh
git add apps/infra/lib/simple-tarot-stage.ts apps/infra/test/simple-tarot-stage.test.ts
git commit -m "feat(infra): compose stacks in environment stage"
```

---

### Task 3: Explicit Stage Entrypoint

**Files:**
- Modify: `apps/infra/bin/simple-tarot-infra.ts`

**Interfaces:**
- Consumes: Task 1 configuration functions and `SimpleTarotStage`.
- Produces: stage IDs `SimpleTarotDev` and `SimpleTarotProd`.

- [ ] **Step 1: Replace the entrypoint**

```ts
#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib/core';
import { getInfraConfig, getSelectedEnvironment, loadInfraEnv } from '../lib/config';
import { SimpleTarotStage } from '../lib/simple-tarot-stage';

const app = new cdk.App();
const environmentName = getSelectedEnvironment(app);
const config = getInfraConfig({
  app,
  environmentName,
  env: loadInfraEnv(environmentName),
});
const stageId = environmentName === 'dev' ? 'SimpleTarotDev' : 'SimpleTarotProd';

new SimpleTarotStage(app, stageId, {
  config,
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: config.awsRegion },
});
```

- [ ] **Step 2: Type-check**

Run: `yarn workspace infra build-types`

Expected: PASS.

- [ ] **Step 3: Verify missing context fails closed**

Run: `yarn workspace infra cdk list`

Expected: non-zero with `Missing CDK context environment. Pass -c environment=dev or -c environment=prod.` before stack selection.

- [ ] **Step 4: Commit**

```sh
git add apps/infra/bin/simple-tarot-infra.ts
git commit -m "refactor(infra): select one explicit CDK stage"
```

---

### Task 4: Separate Configuration Templates

**Files:**
- Create: `apps/infra/.env.dev.example`
- Create: `apps/infra/.env.prod.example`
- Delete: `apps/infra/.env.example`
- Modify: `.gitignore`

**Interfaces:**
- Consumes: all keys read by `getInfraConfig`.
- Produces: templates for `.env.dev` and `.env.prod`.

- [ ] **Step 1: Create `.env.dev.example`**

```dotenv
SIMPLE_TAROT_ENV=dev
SIMPLE_TAROT_AWS_REGION=
SIMPLE_TAROT_MOBILE_CALLBACK_URL=
SIMPLE_TAROT_MOBILE_LOGOUT_URL=
SIMPLE_TAROT_WEB_CALLBACK_URL=
SIMPLE_TAROT_WEB_LOGOUT_URL=
SIMPLE_TAROT_COGNITO_DOMAIN_PREFIX=
SIMPLE_TAROT_BEDROCK_CORPUS_PREFIX=corpus/
SIMPLE_TAROT_BEDROCK_EMBEDDING_MODEL_ID=amazon.titan-embed-text-v2:0
SIMPLE_TAROT_BEDROCK_EMBEDDING_DIMENSIONS=1024
SIMPLE_TAROT_BEDROCK_GENERATION_MODEL_ID=global.anthropic.claude-sonnet-4-5-20250929-v1:0
SIMPLE_TAROT_AOSS_INDEX_PRINCIPAL_ARN=
```

- [ ] **Step 2: Create `.env.prod.example`**

```dotenv
SIMPLE_TAROT_ENV=prod
SIMPLE_TAROT_AWS_REGION=
SIMPLE_TAROT_MOBILE_CALLBACK_URL=
SIMPLE_TAROT_MOBILE_LOGOUT_URL=
SIMPLE_TAROT_WEB_CALLBACK_URL=
SIMPLE_TAROT_WEB_LOGOUT_URL=
SIMPLE_TAROT_COGNITO_DOMAIN_PREFIX=
SIMPLE_TAROT_BEDROCK_CORPUS_PREFIX=corpus/
SIMPLE_TAROT_BEDROCK_EMBEDDING_MODEL_ID=amazon.titan-embed-text-v2:0
SIMPLE_TAROT_BEDROCK_EMBEDDING_DIMENSIONS=1024
SIMPLE_TAROT_BEDROCK_GENERATION_MODEL_ID=global.anthropic.claude-sonnet-4-5-20250929-v1:0
SIMPLE_TAROT_AOSS_INDEX_PRINCIPAL_ARN=
```

- [ ] **Step 3: Protect the real environment files**

Add these entries beside the existing dotenv rules in `.gitignore`:

```gitignore
.env.dev
.env.prod
```

- [ ] **Step 4: Delete the ambiguous example and verify ignore behavior**

Delete `.env.example`, then run:

```sh
git check-ignore apps/infra/.env.dev apps/infra/.env.prod
git check-ignore apps/infra/.env.dev.example apps/infra/.env.prod.example
```

Expected: real files are ignored; example files are not ignored (the second command exits non-zero and prints nothing).

- [ ] **Step 5: Commit**

```sh
git add .gitignore apps/infra/.env.example apps/infra/.env.dev.example apps/infra/.env.prod.example
git commit -m "docs(infra): split dev and prod config templates"
```

---

### Task 5: Infrastructure Operations Documentation

**Files:**
- Modify: `apps/infra/README.md`

**Interfaces:**
- Consumes: stage IDs and paths from Tasks 1–4.
- Produces: migration, synth, future diff/deploy, handoff, and rollback instructions.

- [ ] **Step 1: Document structure and config migration**

Add `lib/simple-tarot-stage.ts` to App Structure. State that dev is pre-production/test and prod is production. Replace `.env` instructions with `.env.dev`/`.env.prod` and document this non-destructive migration:

```sh
cp apps/infra/.env apps/infra/.env.dev
```

Require `SIMPLE_TAROT_ENV=dev` in the copied file. Tell operators to verify it before manually removing obsolete `.env`. State that outputs go only to same-environment consumers.

- [ ] **Step 2: Document explicit commands**

```sh
yarn workspace infra build-types
yarn workspace infra test --runInBand
yarn workspace infra cdk list -c environment=dev
yarn workspace infra cdk synth -c environment=dev 'SimpleTarotDev/*'
yarn workspace infra cdk list -c environment=prod
yarn workspace infra cdk synth -c environment=prod 'SimpleTarotProd/*'
```

Label these as future gated commands that must not run in Stage 1:

```sh
yarn workspace infra cdk diff -c environment=dev 'SimpleTarotDev/*'
yarn workspace infra cdk deploy -c environment=dev 'SimpleTarotDev/*'
```

State that Stage 2 begins with diff and deployment stays blocked pending approval.

- [ ] **Step 3: Validate docs**

```sh
rg -n "apps/infra/\.env([^.]|$)|SimpleTarotDev|SimpleTarotProd|environment=dev|environment=prod" README.md apps docs .agents
git diff --check
```

Expected: current infra instructions use environment-specific paths and explicit selectors. Historical plans need not be rewritten.

- [ ] **Step 4: Commit**

```sh
git add apps/infra/README.md
git commit -m "docs(infra): document explicit environment stages"
```

---

### Task 6: Stage 1 Verification Gate

**Files:**
- No changes expected.

**Interfaces:**
- Consumes: all Stage 1 work.
- Produces: local evidence only; no AWS mutation.

- [ ] **Step 1: Run complete local verification**

```sh
yarn workspace infra test --runInBand
yarn workspace infra build-types
git diff --check
git status --short
```

Expected: tests and types pass; diff check and working tree are clean.

- [ ] **Step 2: Migrate the ignored dev config locally**

The operator runs:

```sh
cp apps/infra/.env apps/infra/.env.dev
```

Add or update `SIMPLE_TAROT_ENV=dev`. Never print or commit the file.

- [ ] **Step 3: List and synthesize dev only**

```sh
yarn workspace infra cdk list -c environment=dev
yarn workspace infra cdk synth -c environment=dev 'SimpleTarotDev/*' --quiet
```

Expected list:

```text
SimpleTarotDev/SimpleTarotCognito-dev
SimpleTarotDev/SimpleTarotUserData-dev
SimpleTarotDev/SimpleTarotBedrockRag-dev
SimpleTarotDev/SimpleTarotApi-dev
```

Expected synth: exit 0 and no AWS mutation.

- [ ] **Step 4: Report evidence and stop**

Report test counts, type-check status, synthesized list, stable physical/stack names, task commit IDs, and confirmation that neither `cdk diff` nor `cdk deploy` ran. Stop for user validation before Stage 2 planning or any AWS call.
