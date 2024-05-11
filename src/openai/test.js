// eslint-disable-next-line @typescript-eslint/no-var-requires
const OpenAI = require('openai');

const openai = new OpenAI.OpenAI({
  apiKey: '',
});

const packageJson = `
{
  "name": "nestjs-prisma-boilerplate",
  "version": "0.0.1",
  "description": "",
  "author": "",
  "private": true,
  "license": "UNLICENSED",
  "scripts": {
    "lint": "NODE_OPTIONS=\"--max-old-space-size=8192\" eslint \"{src,apps,libs,test}/**/*.ts\" --fix --max-warnings 0",
    "build": "nest build",
    "format": "prettier --write \"src/**/*.ts\"",
    "start": "nest start",
    "start:dev": "nest start --watch",
    "start:debug": "nest start --debug --watch",
    "start:prod": "node dist/src/main",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "test:debug": "node --inspect-brk -r tsconfig-paths/register -r ts-node/register node_modules/.bin/jest --runInBand",
    "test:e2e": "jest --config ./test/jest-e2e.json"
  },
  "dependencies": {
    "@nestjs-modules/mailer": "^1.8.1",
    "@nestjs/common": "^9.0.0",
    "@nestjs/config": "^2.3.1",
    "@nestjs/core": "^9.0.0",
    "@nestjs/jwt": "^10.0.2",
    "@nestjs/passport": "^9.0.3",
    "@nestjs/platform-express": "^9.0.0",
    "@nestjs/swagger": "^6.2.1",
    "@prisma/client": "^4.10.0",
    "@types/lodash": "^4.14.191",
    "argon2": "^0.40.1",
    "axios": "^1.4.0",
    "class-transformer": "^0.5.1",
    "class-validator": "^0.14.0",
    "handlebars": "^4.7.7",
    "newrelic": "^9.11.0",
    "nodemailer": "^6.9.1",
    "passport": "^0.6.0",
    "passport-jwt": "^4.0.1",
    "passport-local": "^1.0.0",
    "reflect-metadata": "^0.1.13",
    "rxjs": "^7.2.0"
  },
  "devDependencies": {
    "@nestjs/cli": "^9.0.0",
    "@nestjs/schematics": "^9.0.0",
    "@nestjs/testing": "^9.0.0",
    "@types/express": "^4.17.13",
    "@types/jest": "29.2.4",
    "@types/node": "18.11.18",
    "@types/nodemailer": "^6.4.7",
    "@types/passport-local": "^1.0.35",
    "@types/supertest": "^2.0.11",
    "@typescript-eslint/eslint-plugin": "^5.0.0",
    "@typescript-eslint/parser": "^5.0.0",
    "eslint": "^8.0.1",
    "eslint-config-prettier": "^8.3.0",
    "eslint-plugin-prettier": "^4.0.0",
    "jest": "29.3.1",
    "lodash": "^4.17.21",
    "prettier": "^2.3.2",
    "prisma": "^4.10.0",
    "source-map-support": "^0.5.20",
    "supertest": "^6.1.3",
    "ts-jest": "29.0.3",
    "ts-loader": "^9.2.3",
    "ts-node": "^10.0.0",
    "tsconfig-paths": "4.1.1",
    "typescript": "^4.7.4"
  },
  "jest": {
    "moduleFileExtensions": [
      "js",
      "json",
      "ts"
    ],
    "rootDir": "src",
    "testRegex": ".*\\.spec\\.ts$",
    "transform": {
      "^.+\\.(t|j)s$": "ts-jest"
    },
    "collectCoverageFrom": [
      "**/*.(t|j)s"
    ],
    "coverageDirectory": "../coverage",
    "testEnvironment": "node"
  },
  "prisma": {
    "seed": "npx ts-node prisma/seed.ts"
  }
}
`;

async function main() {
  const completion = await openai.chat.completions.create({
    messages: [
      {
        role: 'system',
        content:
          'You only return the raw file content, do not explain or add any comments, do not add markdown syntax.',
      },
      {
        role: 'system',
        content:
          'The file content returned can be used directly without any modifications.',
      },
      {
        role: 'system',
        content: 'Make sure the file content and syntax is valid for Docker.',
      },
      {
        role: 'user',
        content: 'Generate the Dockerfile for running NestJS application',
      },
      {
        role: 'user',
        content: 'Expose the port 8000, do not add ENTRYPOINT and COMMAND',
      },
      {
        role: 'user',
        content: `Use the latest base image`,
      },
    ],
    model: 'gpt-3.5-turbo',
  });

  console.log(completion.choices[0].message.content);
}

main();
