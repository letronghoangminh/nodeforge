export const AmplifyApplicationTypeMapping = {
  NEXT: 'WEB_COMPUTE',
  REACT: 'WEB',
  VUE: 'WEB',
  ANGULAR: 'WEB',
  OTHER: 'WEB',
};

export const AmplifyBuildSpecMapping = {
  NEXT: `
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm install
    build:
      commands:
        - env > .env
        - npm run build
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*`,
  REACT: `
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - yarn install
    build:
      commands:
        - env > .env
        - yarn run build
  artifacts:
    baseDirectory: build
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*`,
  VUE: `
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm install
    build:
      commands:
        - env > .env
        - npm run build
  artifacts:
    baseDirectory: dist
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*`,
  ANGULAR: `
  version: 1
  frontend:
    phases:
      preBuild:
        commands:
          - npm install
      build:
        commands:
          - env > .env
          - npm run build
    artifacts:
      baseDirectory: dist
      files:
        - '**/*'
    cache:
      paths:
        - node_modules/**/*`,
};

export const AmplifyFrameworkMapping = {
  NEXT: 'Next.js - SSR',
  REACT: 'REACT',
  VUE: 'VUE',
  ANGULAR: 'ANGULAR',
  OTHER: '',
};
