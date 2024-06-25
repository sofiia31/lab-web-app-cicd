import * as cdk from 'aws-cdk-lib';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import { Construct } from 'constructs';

const accountId = process.env.AWS_ACCOUNT_ID;
const region = process.env.AWS_REGION || 'ap-northeast-1';
const repositoryName = process.env.REPOSITORY_NAME || 'lab-web-app'

export class LabEcrStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    new ecr.Repository(this, 'LabECRRepository', {
      repositoryName,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
  }
}

const app = new cdk.App()

new LabEcrStack(app, 'labEcrStack', {
  env: {
    account: accountId,
    region
  },
})
