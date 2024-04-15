// eslint-disable-next-line @typescript-eslint/no-var-requires
const aws = require('@aws-sdk/client-amplify');

async function lol() {
  try {
    const client = new aws.AmplifyClient({ region: 'ap-southeast-1' });

    const appInput = {
      name: 'react',
      repository: 'https://github.com/letronghoangminh/react-example',
      platform: 'WEB',
      accessToken: 'ghs_xxx',
      enableBranchAutoBuild: true,
      environmentVariables: {
        test: 'hehe',
        test2: 'hehe2',
        test3: 'hehe3',
      },
      buildSpec: `
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - yarn install
    build:
      commands:
        - yarn run build
  artifacts:
    baseDirectory: build
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*`,
    };

    const appCommand = new aws.CreateAppCommand(appInput);

    const appResponse = await client.send(appCommand);

    // const backendInput = {
    //   appId: appResponse.app.appId,
    //   environmentName: 'backend',
    // };

    // const backendCommand = new aws.CreateBackendEnvironmentCommand(backendInput);
    // const backendReponse = await client.send(backendCommand);

    // console.log(JSON.stringify(backendReponse));

    const branchInput = {
      appId: appResponse.app.appId, // required
      branchName: 'main',
      stage: 'PRODUCTION',
      framework: 'React',
      enableAutoBuild: true,
      // backendEnvironmentArn:
      //   backendReponse.backendEnvironment.backendEnvironmentArn,
    };

    const branchCommand = new aws.CreateBranchCommand(branchInput);
    const branchResponse = await client.send(branchCommand);

    const startInput = {
      appId: appResponse.app.appId,
      branchName: 'main',
      jobType: 'RELEASE',
    };

    const startCommand = new aws.StartJobCommand(startInput);
    const startResponse = await client.send(startCommand);

    const domainInput = {
      appId: appResponse.app.appId,
      domainName: 'nodeforge.site',
      certificateSettings: {
        type: 'AMPLIFY_MANAGED',
      },
      subDomainSettings: [
        {
          branchName: 'main',
          prefix: 'react',
        },
      ],
    };

    const domainCommand = new aws.CreateDomainAssociationCommand(domainInput);
    const domainResponse = await client.send(domainCommand);
  } catch (error) {
    console.log(error.message);
  }
}

lol();
