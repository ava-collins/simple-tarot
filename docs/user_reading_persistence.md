# User Reading Persistence

This document captures the current authenticated user persistence flow for the
mobile reading history MVP.

## Runtime Shape

The mobile app authenticates users with Cognito and sends the Cognito access
token to the API:

```http
Authorization: Bearer <cognito-access-token>
```

The mobile app never receives DynamoDB or S3 credentials. API Gateway HTTP API
validates the Cognito JWT for deployed requests, and the Express API normalizes
the authenticated user from API Gateway/Lambda event context. Local API runs can
also validate Cognito bearer tokens directly when Cognito auth env vars are set.

## API Endpoints

-   `POST /readings`
    -   Generates a reading in local mode or Bedrock mode.
    -   Persists successful readings for authenticated users.
    -   Persists sanitized failed generation attempts for authenticated users.
    -   Updates the user's minimal profile item after successful reading saves.
-   `GET /readings`
    -   Returns only successful readings for the signed-in user.
    -   Sorts newest first through the DynamoDB sort key query.
    -   Excludes failed attempts from user-facing history.

## DynamoDB Table Shape

The user-data table uses a single-table shape:

```text
pk = USER#<cognitoSub>
sk = PROFILE
```

Profile item fields:

-   `entityType = userProfile`
-   `userId`
-   `createdAt`
-   `updatedAt`
-   `firstSeenAt`
-   `lastSeenAt`
-   `lastReadingAt`
-   `readingCount`
-   `cognitoIssuer`, when present in JWT claims

Successful reading items:

```text
pk = USER#<cognitoSub>
sk = READING#<createdAt>#<readingId>
```

Successful readings store the complete `ReadingResponse`, complete
`GeneratedReading`, original request, original `question` when provided,
`generationMetadata`, timestamps, and optional `requestId`.

Failed generation attempts:

```text
pk = USER#<cognitoSub>
sk = READING_ATTEMPT#<createdAt>#<requestId>
```

Failed attempts store the original request/question and sanitized failure
fields. They are intentionally API/admin-only for now and are not returned by
`GET /readings`.

## API Metadata And Logs

Do not persist API metadata such as source IP, route, method, duration, or user
agent in DynamoDB reading/profile items. The API writes that request/diagnostic
metadata to the S3 API log bucket under `api-logs/`.

S3 API logs must not log authorization headers, tokens, cookies, or full raw
request bodies.

## Mobile Configuration

The mobile app needs these public values in `apps/tarot/.env.local` or the
matching EAS environment:

```sh
EXPO_PUBLIC_TAROT_API_URL=https://<api-id>.execute-api.<region>.amazonaws.com
```

Use the exact `ApiUrl` CloudFormation output from `SimpleTarotApi-<environment>`.
The current CDK API is an API Gateway HTTP API, so the URL does not include a
REST API stage path such as `/dev` unless the stack output itself includes one.

## AWS CLI Inspection

Fetch the profile item:

```sh
USER_DATA_TABLE_NAME=$(aws cloudformation describe-stacks \
  --stack-name SimpleTarotUserData-dev \
  --query "Stacks[0].Outputs[?OutputKey=='UserDataTableName'].OutputValue" \
  --output text)

COGNITO_SUB=<signed-in-user-sub>

aws dynamodb get-item \
  --table-name "$USER_DATA_TABLE_NAME" \
  --key '{
    "pk": { "S": "USER#'"$COGNITO_SUB"'" },
    "sk": { "S": "PROFILE" }
  }'
```

Inspect the whole user partition:

```sh
aws dynamodb query \
  --table-name "$USER_DATA_TABLE_NAME" \
  --key-condition-expression "pk = :pk" \
  --expression-attribute-values '{
    ":pk": { "S": "USER#'"$COGNITO_SUB"'" }
  }'
```

## Bedrock Availability Follow-Ups

The deployed API stack currently sets `BEDROCK_RUNTIME_MODE=local` so the full
authenticated persistence flow can be exercised while Bedrock model access is
pending AWS Support review.

When Bedrock access is approved:

1. Upload and sync the corpus as described in
   `docs/bedrock_corpus_operations.md`.
2. Change the API Lambda environment to `BEDROCK_RUNTIME_MODE=bedrock`.
3. Ensure the Lambda has `BEDROCK_KNOWLEDGE_BASE_ID`, `BEDROCK_REGION`, and a
   usable model or inference profile env value.
4. Update `apps/api/src/readings/response-mapper.ts` so persisted
   `ReadingResponse.metadata.mode` records `bedrock` for Bedrock-generated
   readings.
5. Deploy `SimpleTarotApi-<environment>` and verify `POST /readings` persists
   successful Bedrock readings with citations and profile updates.
