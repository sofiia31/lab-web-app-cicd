import * as cdk from 'aws-cdk-lib';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as logs from 'aws-cdk-lib/aws-logs';

import { Construct } from 'constructs';

const accountId = process.env.AWS_ACCOUNT_ID;
const region = process.env.AWS_REGION || 'ap-northeast-1';
const appName = process.env.APP_NAME || 'lab-web-app';
const appPort = Number(process.env.APP_PORT || 80);

export class LabEcsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Використання дефолтного VPC
    const vpc = ec2.Vpc.fromLookup(this, 'DefaultVpc', { isDefault: true });

    // Створення Secret для зберігання паролю бази даних
    const dbSecret = new secretsmanager.Secret(this, 'DBSecret', {
      secretName: `${appName}-db-secret`,
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'postgres' }),
        generateStringKey: 'password',
        excludeCharacters: '"@/\\',
      },
    });

    // Створення RDS Інстансу
    const dbInstance = new rds.DatabaseInstance(this, 'LabRDSInstance', {
      engine: rds.DatabaseInstanceEngine.postgres({ version: rds.PostgresEngineVersion.VER_13_3 }),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      vpc,
      credentials: rds.Credentials.fromSecret(dbSecret),
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },

    });

    // Створення ECS кластера
    const cluster = new ecs.Cluster(this, 'LabCluster', { vpc });

    // Ваш існуючий код для ECR, LogGroup, TaskDefinition, FargateService
    const repository = ecr.Repository.fromRepositoryName(this, 'LabECRRepository', appName);

    const logGroup = new logs.LogGroup(this, 'LabLogGroup', {
      logGroupName: appName,
      retention: logs.RetentionDays.ONE_DAY,
    });

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
    container.addEnvironment('DB_HOST', dbInstance.instanceEndpoint.hostname);
    container.addEnvironment('DB_PORT', String(dbInstance.instanceEndpoint.port));
    container.addEnvironment('DB_NAME', 'ship-db');
    container.addEnvironment('DB_USER', 'Sofia_IAM');
    container.addEnvironment('DB_PASSWORD', dbSecret.secretValueFromJson('password').toString());

    const securityGroup = new ec2.SecurityGroup(this, 'LabServiceSecurityGroup', { vpc });
    securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(appPort));

    new ecs.FargateService(this, 'LabFargateService', {
      cluster,
      taskDefinition,
      assignPublicIp: true, // Assign a public IP
      securityGroups: [securityGroup],
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC }, // Use public subnets
    });

    // Додавання інгрес правила для RDS security group, щоб дозволити доступ від ECS контейнера
    dbInstance.connections.allowDefaultPortFrom(securityGroup);
  }
}

const app = new cdk.App();

new LabEcsStack(app, 'labEcsStack', {
  env: {
    account: accountId,
    region,
  },
});