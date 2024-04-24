export abstract class AwsService {
  client: any;

  protected async sendAwsCommand<TInput, TOutput>(
    command: new (input: TInput) => any,
    input: TInput,
  ): Promise<TOutput> {
    const commandInstance = new command(input);
    const response = await this.client.send(commandInstance);

    return response as TOutput;
  }
}
