// eslint-disable-next-line @typescript-eslint/no-var-requires
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: '',
});

const AmplifyBuildSpecMapping = {
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

const packageJsonNext = `
{
  "name": "nextshcdndashboardstarter",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "prettier": "prettier . --write"
  },
  "dependencies": {
    "@dnd-kit/core": "^6.1.0",
    "@dnd-kit/modifiers": "^7.0.0",
    "@dnd-kit/sortable": "^8.0.0",
    "@dnd-kit/utilities": "^3.2.2",
    "@hookform/resolvers": "^3.3.2",
    "@radix-ui/react-accordion": "^1.1.2",
    "@radix-ui/react-alert-dialog": "^1.0.5",
    "@radix-ui/react-avatar": "^1.0.4",
    "@radix-ui/react-checkbox": "^1.0.4",
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-dropdown-menu": "^2.0.5",
    "@radix-ui/react-icons": "^1.3.0",
    "@radix-ui/react-label": "^2.0.2",
    "@radix-ui/react-popover": "^1.0.7",
    "@radix-ui/react-scroll-area": "^1.0.5",
    "@radix-ui/react-select": "^1.2.2",
    "@radix-ui/react-separator": "^1.0.3",
    "@radix-ui/react-slider": "^1.1.2",
    "@radix-ui/react-slot": "^1.0.2",
    "@radix-ui/react-switch": "^1.0.3",
    "@radix-ui/react-tabs": "^1.0.4",
    "@radix-ui/react-toast": "^1.1.5",
    "@tanstack/react-table": "^8.10.7",
    "@types/node": "20.5.7",
    "@types/react": "18.2.21",
    "@types/react-dom": "18.2.7",
    "@uploadthing/react": "^5.7.0",
    "autoprefixer": "10.4.15",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "date-fns": "^2.30.0",
    "eslint": "8.48.0",
    "eslint-config-next": "^14.0.1",
    "lucide-react": "^0.291.0",
    "next": "^14.0.1",
    "next-auth": "^4.24.4",
    "next-themes": "^0.2.1",
    "postcss": "8.4.28",
    "react": "^18.2.0",
    "react-day-picker": "^8.9.1",
    "react-dom": "^18.2.0",
    "react-hook-form": "^7.47.0",
    "recharts": "^2.9.2",
    "sharp": "^0.32.5",
    "tailwind-merge": "^1.14.0",
    "tailwindcss": "^3.4.0",
    "tailwindcss-animate": "^1.0.7",
    "typescript": "5.2.2",
    "uploadthing": "^5.7.4",
    "uuid": "^9.0.1",
    "zod": "^3.22.4",
    "zustand": "^4.4.6"
  },
  "devDependencies": {
    "@types/uuid": "^9.0.7",
    "@typescript-eslint/eslint-plugin": "^6.11.0",
    "prettier": "3.0.3"
  }
}
`;

const packageJsonReact = `
{
  "name": "react-landmarks",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
    "@types/node": "^18.15.5",
    "@types/react": "^18.0.28",
    "@types/react-dom": "^18.0.11",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-scripts": "^5.0.1",
    "typescript": "^5.0.2"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "eslintConfig": {
    "extends": [
      "react-app",
      "react-app/jest"
    ]
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  }
}
`;

const packageJsonVue = `
{
  "name": "vuetasks",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "vue": "^3.3.4"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^4.2.3",
    "vite": "^4.4.6"
  }
}
`;

const packageJsonAngular = `
{
  "name": "angular-realworld",
  "version": "0.0.0",
  "license": "MIT",
  "scripts": {
    "ng": "ng",
    "start": "ng serve",
    "build": "ng build",
    "test": "ng test",
    "lint": "ng lint --force",
    "prepare": "husky install"
  },
  "engines": {
    "node": "^18.13.0 || ^20.9.0"
  },
  "private": true,
  "dependencies": {
    "@angular/animations": "17.2.1",
    "@angular/common": "17.2.1",
    "@angular/compiler": "17.2.1",
    "@angular/core": "17.2.1",
    "@angular/forms": "17.2.1",
    "@angular/platform-browser": "17.2.1",
    "@angular/platform-browser-dynamic": "17.2.1",
    "@angular/router": "17.2.1",
    "@rx-angular/cdk": "17.0.0",
    "@rx-angular/template": "17.0.0",
    "marked": "^11.1.0",
    "rxjs": "^7.4.0",
    "tslib": "^2.3.0",
    "zone.js": "~0.14.2"
  },
  "devDependencies": {
    "@angular-devkit/build-angular": "^17.2.0",
    "@angular/cli": "^17.2.0",
    "@angular/compiler-cli": "17.2.1",
    "@types/jasmine": "~4.3.0",
    "@types/marked": "^6.0.0",
    "husky": "^8.0.3",
    "jasmine-core": "~4.5.0",
    "karma": "~6.4.1",
    "karma-chrome-launcher": "~3.1.0",
    "karma-coverage": "~2.2.0",
    "karma-jasmine": "~5.1.0",
    "karma-jasmine-html-reporter": "~2.0.0",
    "lint-staged": "^15.2.0",
    "prettier": "^3.1.1",
    "typescript": "~5.2.2"
  },
  "lint-staged": {
    "*.{ts,html,css,json,md}": "prettier --write"
  }
}
`;

const angularConfig = `
{
  "$schema": "./node_modules/@angular/cli/lib/config/schema.json",
  "version": 1,
  "newProjectRoot": "projects",
  "projects": {
    "angular-conduit": {
      "projectType": "application",
      "schematics": {},
      "root": "",
      "sourceRoot": "src",
      "prefix": "app",
      "architect": {
        "build": {
          "builder": "@angular-devkit/build-angular:browser-esbuild",
          "options": {
            "outputPath": "dist/angular-conduit",
            "index": "src/index.html",
            "main": "src/main.ts",
            "polyfills": ["zone.js"],
            "tsConfig": "tsconfig.app.json",
            "assets": [
              "src/favicon.ico",
              "src/assets",
              {
                "glob": "_redirects",
                "input": "src",
                "output": "/"
              }
            ],
            "styles": ["src/styles.css"],
            "scripts": []
          },
          "configurations": {
            "production": {
              "budgets": [
                {
                  "type": "initial",
                  "maximumWarning": "500kb",
                  "maximumError": "1mb"
                },
                {
                  "type": "anyComponentStyle",
                  "maximumWarning": "2kb",
                  "maximumError": "4kb"
                }
              ],
              "outputHashing": "all"
            },
            "development": {
              "buildOptimizer": false,
              "optimization": false,
              "vendorChunk": true,
              "extractLicenses": false,
              "sourceMap": true,
              "namedChunks": true
            }
          },
          "defaultConfiguration": "production"
        },
        "serve": {
          "builder": "@angular-devkit/build-angular:dev-server",
          "configurations": {
            "production": {
              "buildTarget": "angular-conduit:build:production"
            },
            "development": {
              "buildTarget": "angular-conduit:build:development"
            }
          },
          "defaultConfiguration": "development"
        },
        "extract-i18n": {
          "builder": "@angular-devkit/build-angular:extract-i18n",
          "options": {
            "buildTarget": "angular-conduit:build"
          }
        },
        "test": {
          "builder": "@angular-devkit/build-angular:karma",
          "options": {
            "polyfills": ["zone.js", "zone.js/testing"],
            "tsConfig": "tsconfig.spec.json",
            "assets": ["src/favicon.ico", "src/assets"],
            "styles": ["src/styles.css"],
            "scripts": []
          }
        }
      }
    }
  },
  "cli": {
    "analytics": "2fd54eca-0009-4dc9-83e2-5c7512ec2ed8"
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
        content: 'Make sure the file content and syntax is valid for Amplify.',
      },
      {
        role: 'user',
        content:
          'Generate the buildspec amplify.yaml for AngularJS applications. Do not add backend configuration',
      },
      {
        role: 'user',
        content:
          'Please add this command before running build command: `env > .env`',
      },
      {
        role: 'user',
        content: `Use this amplify.yaml as an example ${AmplifyBuildSpecMapping['ANGULAR']}`,
      },
      {
        role: 'user',
        content: `Please refer to this package.json file also ${packageJsonAngular}`,
      },
      {
        role: 'user',
        content: `Please check this angular.json file for output directory: ${angularConfig}`,
      },
    ],
    model: 'gpt-3.5-turbo',
  });

  console.log(completion.choices[0].message.content);
}
main();
