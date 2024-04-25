export default () => ({
  app: {
    env: process.env.APP_ENV || 'development',
    port: parseInt(process.env.APP_PORT, 10) || 3000,
    root: process.env.APPLICATION_ROOT,
    domain: process.env.APP_DOMAIN,
  },
  swagger: {
    docsUrl: process.env.DOCS_URL || 'docs',
  },
  database: {
    url: process.env.DATABASE_URL || 'mysql://root:root@127.0.0.1:3306/api',
  },
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'r@nD0mS3kr3t',
  },
  mail: {
    host: process.env.MAIL_HOST,
    username: process.env.MAIL_USERNAME,
    password: process.env.MAIL_PASSWORD,
    from: process.env.MAIL_FROM,
  },
  githubApp: {
    name: process.env.GITHUB_APP_NAME || 'node-forge',
    id: process.env.GITHUB_APP_ID,
    privateKey: Buffer.from(process.env.GITHUB_APP_PRIVATE_KEY, 'base64'),
  },
  stripe: {
    apiKey: process.env.STRIPE_API_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    priceLookupKey: process.env.STRIPE_PRICE_LOOKUP_KEY || 'NodeForge',
  },
  aws: {
    region: process.env.AWS_REGION,
    sqs: {
      queueUrl: process.env.AWS_SQS_QUEUE_URL,
      queueName: process.env.AWS_SQS_QUEUE_NAME,
    },
    ecs: {
      clusterName: process.env.AWS_ECS_CLUSTER_NAME || 'nodeforge-cluster',
    },
    vpc: {
      vpcId: process.env.AWS_VPC_ID,
      subnetIds: process.env.AWS_VPC_SUBNET_IDS || '',
    },
    alb: {
      dnsName: process.env.AWS_ALB_DNS_NAME,
      zoneId: process.env.AWS_ALB_ZONE_ID,
      listenerArn: process.env.AWS_ALB_LISTENER_ARN,
      secgroupId: process.env.AWS_ALB_SECGROUP_ID,
    },
    r53: {
      zoneId: process.env.AWS_R53_ZONE_ID,
    },
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL,
  },
});
