import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAI } from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources';
import { AmplifyOpenAIFrameworkMapping } from './mapping/openai.mapping';
import { load as yamlLoad } from 'js-yaml';

@Injectable()
export class OpenaiService {
  private openai: OpenAI;
  private model: string;
  constructor(private configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.get('openai.apiKey'),
    });
    this.model = this.configService.get('openai.model');
  }

  private validateBuildSpec(yamlString: string) {
    try {
      yamlLoad(yamlString);
      return true;
    } catch (error) {
      return false;
    }
  }

  async generateAmplifyBuildSpec(options: {
    framework: string;
    packageJson?: string;
    exampleBuildSpec?: string;
    angularConfig?: string;
    nextConfig?: string;
    nuxtConfig?: string;
    viteConfig?: string;
    svelteConfig?: string;
    webpackConfig?: string;
  }): Promise<string> {
    const prompts: ChatCompletionMessageParam[] = [
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
        content: `Generate the buildspec amplify.yaml for ${
          AmplifyOpenAIFrameworkMapping[options.framework]
        } applications. Do not add backend configuration`,
      },
      {
        role: 'user',
        content:
          'Please add this command before running build command: `env > .env`',
      },
    ];

    if (options.exampleBuildSpec)
      prompts.push({
        role: 'user',
        content: `Use this amplify.yaml as an example ${options.exampleBuildSpec}`,
      });

    if (options.packageJson)
      prompts.push({
        role: 'user',
        content: `Please refer to this package.json file also ${options.packageJson}`,
      });

    if (options.angularConfig)
      prompts.push({
        role: 'user',
        content: `Please check this angular.json file for output directory: ${options.angularConfig}`,
      });

    if (options.nextConfig)
      prompts.push({
        role: 'user',
        content: `Please also check this next.config.js for additional information: ${options.nextConfig}`,
      });

    if (options.nuxtConfig)
      prompts.push({
        role: 'user',
        content: `Please also check this nuxt.config.js for additional information: ${options.nuxtConfig}`,
      });

    if (options.svelteConfig)
      prompts.push({
        role: 'user',
        content: `Please also check this svelte.config.js for additional information: ${options.svelteConfig}`,
      });

    if (options.viteConfig)
      prompts.push({
        role: 'user',
        content: `Please also check this vite.config.js for additional information: ${options.viteConfig}`,
      });

    if (options.webpackConfig)
      prompts.push({
        role: 'user',
        content: `Please also check this webpack.config.js for additional information: ${options.webpackConfig}`,
      });

    let buildSpec = '';

    for (let i = 0; i < 10; i++) {
      const response = await this.openai.chat.completions.create({
        messages: prompts,
        model: this.model,
      });

      buildSpec = response.choices[0].message.content;

      if (this.validateBuildSpec(buildSpec)) return buildSpec;
    }
    throw new BadRequestException(
      'Cannot generate Amplify buildspec, please try again later',
    );
  }
}
