import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import { ApiStack } from './api-stack';
import { BedrockRagStack } from './bedrock-rag-stack';
import { CognitoStack } from './cognito-stack';
import type { InfraConfig } from './config';
import { createEnvironmentStackSynthesizer } from './deployment-role-routing';
import { UserDataStack } from './user-data-stack';

export interface SimpleTarotStageProps extends cdk.StageProps {
  config: InfraConfig;
}

export class SimpleTarotStage extends cdk.Stage {
  public readonly apiStack: ApiStack;
  public readonly bedrockStack: BedrockRagStack;
  public readonly cognitoStack: CognitoStack;
  public readonly userDataStack: UserDataStack;

  constructor(scope: Construct, id: string, props: SimpleTarotStageProps) {
    super(scope, id, props);

    const common = {
      config: props.config,
      env: props.env,
    };

    this.cognitoStack = new CognitoStack(this, props.config.stackName, {
      ...common,
      stackName: props.config.stackName,
      synthesizer: createEnvironmentStackSynthesizer(props.config.environmentName),
    });
    this.userDataStack = new UserDataStack(this, props.config.userDataStackName, {
      ...common,
      stackName: props.config.userDataStackName,
      synthesizer: createEnvironmentStackSynthesizer(props.config.environmentName),
    });
    this.bedrockStack = new BedrockRagStack(this, props.config.bedrockStackName, {
      ...common,
      stackName: props.config.bedrockStackName,
      synthesizer: createEnvironmentStackSynthesizer(props.config.environmentName),
    });
    this.apiStack = new ApiStack(this, props.config.apiStackName, {
      ...common,
      apiLogBucket: this.userDataStack.apiLogBucket,
      stackName: props.config.apiStackName,
      synthesizer: createEnvironmentStackSynthesizer(props.config.environmentName),
      userDataTable: this.userDataStack.userDataTable,
      userPool: this.cognitoStack.userPool,
      userPoolClient: this.cognitoStack.userPoolClient,
    });

    cdk.Tags.of(this).add('Application', 'SimpleTarot');
    cdk.Tags.of(this).add('Environment', props.config.environmentName);
    cdk.Tags.of(this).add('ManagedBy', 'CDK');
  }
}
