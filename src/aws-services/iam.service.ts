import { ConfigService } from '@nestjs/config';
import { AwsService } from './base.class';
import {
  AttachRolePolicyCommand,
  AttachRolePolicyCommandInput,
  AttachRolePolicyCommandOutput,
  CreateRoleCommand,
  CreateRoleCommandInput,
  CreateRoleCommandOutput,
  DeleteRoleCommand,
  DeleteRoleCommandInput,
  DeleteRoleCommandOutput,
  DetachRolePolicyCommand,
  DetachRolePolicyCommandInput,
  DetachRolePolicyCommandOutput,
  IAMClient,
} from '@aws-sdk/client-iam';
import { Injectable } from '@nestjs/common';
import { CreateDeploymentDto } from 'src/deployment/dto/deployment.dto';

@Injectable()
export class IamService extends AwsService {
  constructor(private configService: ConfigService) {
    super();
    this.client = new IAMClient({
      region: configService.get('aws.region'),
    });
  }

  private buildCreateRoleInput(roleName: string): CreateRoleCommandInput {
    const input = {
      RoleName: roleName,
      AssumeRolePolicyDocument: `{
"Version": "2012-10-17",
"Statement": [
  {
    "Action": "sts:AssumeRole",
    "Principal": {
      "Service": "ecs-tasks.amazonaws.com"
    },
    "Effect": "Allow",
    "Sid": ""
  }
]
}`,
    };

    return input;
  }

  private async createRole(
    input: CreateRoleCommandInput,
  ): Promise<CreateRoleCommandOutput> {
    return this.sendAwsCommand<CreateRoleCommandInput, CreateRoleCommandOutput>(
      CreateRoleCommand,
      input,
    );
  }

  private buildAttachRolePolicyInput(
    roleName: string,
    policyArn: string,
  ): AttachRolePolicyCommandInput {
    const input = {
      RoleName: roleName,
      PolicyArn: policyArn,
    };

    return input;
  }

  private async attachRolePolicy(
    input: AttachRolePolicyCommandInput,
  ): Promise<AttachRolePolicyCommandOutput> {
    return this.sendAwsCommand<
      AttachRolePolicyCommandInput,
      AttachRolePolicyCommandOutput
    >(AttachRolePolicyCommand, input);
  }

  private buildDeleteRoleInput(role: string): DeleteRoleCommandInput {
    const input = {
      RoleName: role,
    };

    return input;
  }

  private async deleteRole(
    input: DeleteRoleCommandInput,
  ): Promise<DeleteRoleCommandOutput> {
    return this.sendAwsCommand<DeleteRoleCommandInput, DeleteRoleCommandOutput>(
      DeleteRoleCommand,
      input,
    );
  }

  private buildDetachRolePolicyInput(
    roleName: string,
    policyArn: string,
  ): DetachRolePolicyCommandInput {
    const input = {
      RoleName: roleName,
      PolicyArn: policyArn,
    };

    return input;
  }

  private async detachRolePolicy(
    input: DetachRolePolicyCommandInput,
  ): Promise<DetachRolePolicyCommandOutput> {
    return this.sendAwsCommand<
      DetachRolePolicyCommandInput,
      DetachRolePolicyCommandOutput
    >(DetachRolePolicyCommand, input);
  }

  async createIamRolesForEcs(
    dto: CreateDeploymentDto,
  ): Promise<{ taskRoleArn: string; taskExecutionRoleArn: string }> {
    const createTaskExecutionRoleInput = this.buildCreateRoleInput(
      `${dto.name}-ecsTaskExecutionRole`,
    );

    const createTaskExecutionRoleResponse = await this.createRole(
      createTaskExecutionRoleInput,
    );

    const attachRolePolicyInput = this.buildAttachRolePolicyInput(
      createTaskExecutionRoleResponse.Role.RoleName,
      'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy',
    );

    await this.attachRolePolicy(attachRolePolicyInput);

    const createTaskRoleInput = this.buildCreateRoleInput(
      `${dto.name}-ecsTaskRole`,
    );

    const createTaskRoleResponse = await this.createRole(createTaskRoleInput);

    return {
      taskRoleArn: createTaskRoleResponse.Role.Arn,
      taskExecutionRoleArn: createTaskExecutionRoleResponse.Role.Arn,
    };
  }

  async deleteIamRolesForEcs(serviceName) {
    try {
      const deleteTaskRoleInput = this.buildDeleteRoleInput(
        `${serviceName}-ecsTaskRole`,
      );

      await this.deleteRole(deleteTaskRoleInput);

      const detachRolePolicyInput = this.buildDetachRolePolicyInput(
        `${serviceName}-ecsTaskExecutionRole`,
        'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy',
      );

      await this.detachRolePolicy(detachRolePolicyInput);

      const deleteTaskExecutionRoleInput = this.buildDeleteRoleInput(
        `${serviceName}-ecsTaskExecutionRole`,
      );

      await this.deleteRole(deleteTaskExecutionRoleInput);
    } catch (error) {
      console.log(error);
    }
  }
}
