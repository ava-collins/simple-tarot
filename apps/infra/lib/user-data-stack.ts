import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import { InfraConfig } from './config';

export interface UserDataStackProps extends cdk.StackProps {
  config: InfraConfig;
}

export class UserDataStack extends cdk.Stack {
  public readonly apiLogBucket: s3.Bucket;
  public readonly userDataTable: dynamodb.Table;

  constructor(scope: Construct, id: string, props: UserDataStackProps) {
    super(scope, id, props);

    const isProd = props.config.environmentName === 'prod';
    const removalPolicy = isProd ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY;

    const userDataTable = new dynamodb.Table(this, 'UserDataTable', {
      tableName: props.config.userDataTableName,
      partitionKey: {
        name: 'pk',
        type: dynamodb.AttributeType.STRING
      },
      sortKey: {
        name: 'sk',
        type: dynamodb.AttributeType.STRING
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.DEFAULT,
      pointInTimeRecoverySpecification: isProd
        ? {
            pointInTimeRecoveryEnabled: true
          }
        : undefined,
      removalPolicy
    });

    const apiLogBucket = new s3.Bucket(this, 'ApiLogBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      lifecycleRules: [
        {
          expiration: cdk.Duration.days(isProd ? 365 : 30)
        }
      ],
      removalPolicy,
      autoDeleteObjects: !isProd
    });

    this.apiLogBucket = apiLogBucket;
    this.userDataTable = userDataTable;

    new cdk.CfnOutput(this, 'UserDataTableName', {
      value: props.config.userDataTableName
    });
    new cdk.CfnOutput(this, 'UserDataTableArn', {
      value: userDataTable.tableArn
    });
    new cdk.CfnOutput(this, 'ApiLogBucketName', {
      value: apiLogBucket.bucketName
    });
    new cdk.CfnOutput(this, 'ApiLogBucketArn', {
      value: apiLogBucket.bucketArn
    });
  }
}
