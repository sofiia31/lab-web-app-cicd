import * as cdk from 'aws-cdk-lib';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as logs from 'aws-cdk-lib/aws-logs';

import { Construct } from 'constructs';

const accountId = process.env.AWS_ACCOUNT_ID;
const region = process.env.AWS_REGION || 'ap-northeast-1';
const appName = process.env.APP_NAME || 'lab-web-app';
const appPort = Number(process.env.APP_PORT || 80);

export class LabEcsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, {
      ...props,
      env: {
        account: accountId,
        region: region,
      },
    });

    const vpc = new ec2.Vpc(this, 'LabVpc', { maxAzs: 3, natGateways: 0 });

    const repository = ecr.Repository.fromRepositoryName(this, 'LabECRRepository', appName);

    const logGroup = new logs.LogGroup(this, 'LabLogGroup', {
      logGroupName: appName,
      retention: logs.RetentionDays.ONE_DAY,
    });

    const cluster = new ecs.Cluster(this, 'LabCluster', { vpc });

    const taskDefinition = new ecs.FargateTaskDefinition(this, 'LabTaskDefinition');
    const container = taskDefinition.addContainer('LabContainer', {
      image: ecs.ContainerImage.fromEcrRepository(repository, 'latest'),
      memoryLimitMiB: 256,
      logging: ecs.LogDrivers.awsLogs({
        logGroup,
        streamPrefix: 'app',
      }),
    });
    container.addPortMappings({ containerPort: appPort });
    container.addEnvironment('APP_PORT', String(appPort));

    const securityGroup = new ec2.SecurityGroup(this, 'LabServiceSecurityGroup', { vpc });
    securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(appPort));

    new ecs.FargateService(this, 'LabFargateService', {
      cluster,
      taskDefinition,
      assignPublicIp: true, // Assign a public IP
      securityGroups: [securityGroup],
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC }, // Use public subnets
    });
  }
}

const app = new cdk.App();

new LabEcsStack(app, 'labEcsStack', {
  env: {
    account: accountId,
    region: region,
  },
});

app.synth();