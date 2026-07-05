import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
    DynamoDBDocumentClient,
    PutCommand,
    QueryCommand,
    UpdateCommand,
    type UpdateCommandInput
} from '@aws-sdk/lib-dynamodb';
import {
    FailedReadingAttemptRecord,
    ReadingHistoryRecord,
    ReadingHistoryStore,
    SaveFailedReadingAttemptInput,
    SaveSuccessfulReadingInput
} from './contracts';
import {
    PROFILE_SORT_KEY,
    READING_KEY_PREFIX,
    readingAttemptSortKey,
    readingSortKey,
    userPartitionKey
} from './reading-history-store';

type DynamoDbDocumentClient = Pick<DynamoDBDocumentClient, 'send'>;

export type DynamoDbReadingHistoryStoreOptions = {
    client?: DynamoDbDocumentClient;
    tableName: string;
};

const metadataFromSuccessfulReading = (
    input: SaveSuccessfulReadingInput
): ReadingHistoryRecord['generationMetadata'] => {
    const modelId = input.readingResponse.metadata.modelId ?? input.generatedReading.modelId;

    return {
        itemCount: input.readingResponse.metadata.itemCount,
        mode: input.readingResponse.metadata.mode,
        ...(modelId ? { modelId } : {})
    };
};

export const toSuccessfulReadingItem = (
    input: SaveSuccessfulReadingInput
): ReadingHistoryRecord => ({
    createdAt: input.createdAt,
    entityType: 'reading',
    generatedReading: input.generatedReading,
    generationMetadata: metadataFromSuccessfulReading(input),
    pk: userPartitionKey(input.userId),
    readingId: input.readingResponse.readingId,
    readingResponse: input.readingResponse,
    request: input.request,
    schemaVersion: 1,
    sk: readingSortKey(input.createdAt, input.readingResponse.readingId),
    spread: input.readingResponse.spread,
    updatedAt: input.createdAt,
    userId: input.userId,
    ...(input.request.question ? { question: input.request.question } : {}),
    ...(input.requestId ? { requestId: input.requestId } : {})
});

export const toFailedReadingAttemptItem = (
    input: SaveFailedReadingAttemptInput
): FailedReadingAttemptRecord => ({
    createdAt: input.createdAt,
    entityType: 'readingAttempt',
    failure: input.failure,
    generationMetadata: input.generationMetadata,
    pk: userPartitionKey(input.userId),
    request: input.request,
    requestId: input.requestId,
    schemaVersion: 1,
    sk: readingAttemptSortKey(input.createdAt, input.requestId),
    spread: input.request.spread,
    status: 'failed',
    updatedAt: input.createdAt,
    userId: input.userId,
    ...(input.request.question ? { question: input.request.question } : {})
});

export const toUserProfileUpdateInput = (
    input: SaveSuccessfulReadingInput
): Omit<UpdateCommandInput, 'TableName'> => {
    const expressionAttributeNames: NonNullable<
        UpdateCommandInput['ExpressionAttributeNames']
    > = {
        '#createdAt': 'createdAt',
        '#entityType': 'entityType',
        '#firstSeenAt': 'firstSeenAt',
        '#lastReadingAt': 'lastReadingAt',
        '#lastSeenAt': 'lastSeenAt',
        '#readingCount': 'readingCount',
        '#schemaVersion': 'schemaVersion',
        '#updatedAt': 'updatedAt',
        '#userId': 'userId'
    };
    const expressionAttributeValues: NonNullable<
        UpdateCommandInput['ExpressionAttributeValues']
    > = {
        ':createdAt': input.createdAt,
        ':entityType': 'userProfile',
        ':one': 1,
        ':schemaVersion': 1,
        ':userId': input.userId
    };
    const setExpressions = [
        '#entityType = :entityType',
        '#schemaVersion = :schemaVersion',
        '#userId = :userId',
        '#createdAt = if_not_exists(#createdAt, :createdAt)',
        '#firstSeenAt = if_not_exists(#firstSeenAt, :createdAt)',
        '#updatedAt = :createdAt',
        '#lastSeenAt = :createdAt',
        '#lastReadingAt = :createdAt'
    ];

    if (input.cognitoIssuer) {
        expressionAttributeNames['#cognitoIssuer'] = 'cognitoIssuer';
        expressionAttributeValues[':cognitoIssuer'] = input.cognitoIssuer;
        setExpressions.push('#cognitoIssuer = :cognitoIssuer');
    }

    return {
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        Key: {
            pk: userPartitionKey(input.userId),
            sk: PROFILE_SORT_KEY
        },
        UpdateExpression: `SET ${setExpressions.join(', ')} ADD #readingCount :one`
    };
};

const defaultDocumentClient = (): DynamoDbDocumentClient =>
    DynamoDBDocumentClient.from(new DynamoDBClient({}), {
        marshallOptions: {
            removeUndefinedValues: true
        }
    });

export const createDynamoDbReadingHistoryStore = ({
    client = defaultDocumentClient(),
    tableName
}: DynamoDbReadingHistoryStoreOptions): ReadingHistoryStore => ({
    async listSuccessfulReadingsByUser({ limit, userId }) {
        const response = await client.send(
            new QueryCommand({
                ExpressionAttributeValues: {
                    ':pk': userPartitionKey(userId),
                    ':skPrefix': READING_KEY_PREFIX
                },
                KeyConditionExpression: 'pk = :pk AND begins_with(sk, :skPrefix)',
                Limit: limit,
                ScanIndexForward: false,
                TableName: tableName
            })
        );

        return (response.Items ?? []) as ReadingHistoryRecord[];
    },
    async saveFailedReadingAttempt(input) {
        await client.send(
            new PutCommand({
                Item: toFailedReadingAttemptItem(input),
                TableName: tableName
            })
        );
    },
    async saveSuccessfulReading(input) {
        await client.send(
            new PutCommand({
                Item: toSuccessfulReadingItem(input),
                TableName: tableName
            })
        );
        await client.send(
            new UpdateCommand({
                ...toUserProfileUpdateInput(input),
                TableName: tableName
            })
        );
    }
});
