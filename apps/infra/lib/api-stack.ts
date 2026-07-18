import * as apigatewayv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as authorizers from 'aws-cdk-lib/aws-apigatewayv2-authorizers';
import * as integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as bedrock from 'aws-cdk-lib/aws-bedrock';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import { join } from 'path';
import { InfraConfig } from './config';

export interface ApiStackProps extends cdk.StackProps {
  apiLogBucket: s3.Bucket;
  config: InfraConfig;
  corpusBucket: s3.Bucket;
  dataSource: bedrock.CfnDataSource;
  generationInferenceProfile: bedrock.CfnApplicationInferenceProfile;
  knowledgeBase: bedrock.CfnKnowledgeBase;
  userDataTable: dynamodb.Table;
  userPool: cognito.UserPool;
  userPoolClient: cognito.UserPoolClient;
}

export class ApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    cdk.CrossStackReferences.of(this).consume(cdk.ReferenceStrength.STRONG);

    const composerEnabled = props.config.environmentName === 'dev';
    const composerEnvironment: Record<string, string> = composerEnabled
      ? {
          BEDROCK_CORPUS_BUCKET: props.corpusBucket.bucketName,
          BEDROCK_DATA_SOURCE_ID: props.dataSource.attrDataSourceId,
        }
      : {};

    const apiFunction = new nodejs.NodejsFunction(this, 'ApiFunction', {
      entry: join(__dirname, '..', '..', 'api', 'src', 'lambda.ts'),
      functionName: props.config.apiFunctionName,
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_22_X,
      timeout: cdk.Duration.seconds(29),
      environment: {
        API_LOG_BUCKET_NAME: props.apiLogBucket.bucketName,
        BEDROCK_INFERENCE_PROFILE_ARN:
          props.generationInferenceProfile.attrInferenceProfileArn,
        BEDROCK_KNOWLEDGE_BASE_ID: props.knowledgeBase.attrKnowledgeBaseId,
        BEDROCK_REGION: props.config.awsRegion,
        BEDROCK_RUNTIME_MODE: 'bedrock',
        COMPOSER_RUNTIME_MODE: composerEnabled ? 'enabled' : 'disabled',
        ...composerEnvironment,
        USER_DATA_TABLE_NAME: props.config.userDataTableName
      },
      bundling: {
        target: 'node22'
      }
    });

    apiFunction.addToRolePolicy(new iam.PolicyStatement({
      actions: ['bedrock:RetrieveAndGenerate'],
      resources: ['*']
    }));
    if (composerEnabled) {
      apiFunction.addToRolePolicy(new iam.PolicyStatement({
        actions: ['s3:GetObject'],
        resources: [
          props.corpusBucket.arnForObjects('state/dev/active-release.json'),
          props.corpusBucket.arnForObjects('releases/*/manifest.json'),
          props.corpusBucket.arnForObjects('releases/*/composer-bundle.json')
        ]
      }));
    }
    apiFunction.addToRolePolicy(new iam.PolicyStatement({
      actions: ['bedrock:GetInferenceProfile'],
      resources: [props.generationInferenceProfile.attrInferenceProfileArn]
    }));
    apiFunction.addToRolePolicy(new iam.PolicyStatement({
      actions: ['bedrock:Retrieve'],
      resources: [props.knowledgeBase.attrKnowledgeBaseArn]
    }));
    apiFunction.addToRolePolicy(new iam.PolicyStatement({
      actions: ['bedrock:InvokeModel'],
      resources: [
        props.generationInferenceProfile.attrInferenceProfileArn,
        `arn:aws:bedrock:${props.config.awsRegion}::foundation-model/${props.config.bedrockGenerationModelId}`
      ]
    }));
    props.userDataTable.grantReadWriteData(apiFunction);
    props.apiLogBucket.grantPut(apiFunction, 'api-logs/*');
    const httpApi = new apigatewayv2.HttpApi(this, 'HttpApi', {
      apiName: props.config.apiName,
      corsPreflight: {
        allowHeaders: ['authorization', 'content-type', 'x-request-id'],
        allowMethods: [apigatewayv2.CorsHttpMethod.ANY],
        allowOrigins: ['*']
      }
    });
    const integration = new integrations.HttpLambdaIntegration(
      'ApiLambdaIntegration',
      apiFunction
    );
    const authorizer = new authorizers.HttpJwtAuthorizer(
      'CognitoJwtAuthorizer',
      `https://cognito-idp.${props.config.awsRegion}.amazonaws.com/${props.userPool.userPoolId}`,
      {
        jwtAudience: [props.userPoolClient.userPoolClientId]
      }
    );

    httpApi.addRoutes({
      authorizer,
      integration,
      methods: [apigatewayv2.HttpMethod.ANY],
      path: '/{proxy+}'
    });
    httpApi.addRoutes({
      authorizer,
      integration,
      methods: [apigatewayv2.HttpMethod.ANY],
      path: '/'
    });

    new cdk.CfnOutput(this, 'ApiUrl', {
      value: httpApi.apiEndpoint
    });
    new cdk.CfnOutput(this, 'ApiFunctionName', {
      value: props.config.apiFunctionName
    });
    new cdk.CfnOutput(this, 'ApiFunctionArn', {
      value: apiFunction.functionArn
    });
  }
}
