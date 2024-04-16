import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { DeploymentService } from './deployment.service';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { APISummaries } from 'src/helpers/helpers';
import { UserGuard } from 'src/auth/guard/auth.guard';
import { VerifyGuard } from 'src/auth/guard/verify.guard';
import { CheckSubdomainDto, CreateDeploymentDto } from './dto/deployment.dto';
import { GetUser } from 'src/auth/decorator/get-user.decorator';
import { DeploymentModel, EnvironmentModel } from './model/deployment.model';
import { UserType } from 'src/helpers/types';

@Controller('deployment')
@ApiTags('DEPLOYMENT')
export class DeploymentController {
  constructor(private deploymentService: DeploymentService) {}

  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: APISummaries.USER })
  @ApiOkResponse({ type: [DeploymentModel] })
  @ApiBearerAuth()
  @UseGuards(UserGuard, VerifyGuard)
  @Get()
  getDeployments(@GetUser() user: UserType): Promise<DeploymentModel[]> {
    return this.deploymentService.getDeployments(user);
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: APISummaries.USER })
  @ApiOkResponse({ type: DeploymentModel })
  @ApiBearerAuth()
  @UseGuards(UserGuard, VerifyGuard)
  @Get(':id')
  getDeploymentById(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: UserType,
  ): Promise<DeploymentModel> {
    return this.deploymentService.getDeploymentById(id, user);
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: APISummaries.USER })
  @ApiOkResponse({ type: DeploymentModel })
  @ApiBearerAuth()
  @UseGuards(UserGuard, VerifyGuard)
  @Post()
  createNewDeployment(
    @Body() dto: CreateDeploymentDto,
    @GetUser() user: UserType,
  ): Promise<DeploymentModel> {
    return this.deploymentService.createNewDeployment(dto, user);
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: APISummaries.USER })
  @ApiOkResponse({ type: EnvironmentModel })
  @ApiBearerAuth()
  @UseGuards(UserGuard, VerifyGuard)
  @Get(':id/environment')
  getEnvironmentByDeploymentId(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: UserType,
  ): Promise<EnvironmentModel> {
    return this.deploymentService.getEnvironmentByDeploymentId(id, user);
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: APISummaries.USER })
  @ApiOkResponse({ type: DeploymentModel })
  @ApiBearerAuth()
  @UseGuards(UserGuard, VerifyGuard)
  @Delete(':id')
  deleteDeploymenByDeploymentId(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: UserType,
  ): Promise<DeploymentModel> {
    return this.deploymentService.deleteDeploymenByDeploymentId(id, user);
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: APISummaries.USER })
  @ApiBearerAuth()
  @UseGuards(UserGuard, VerifyGuard)
  @Post('/check-subdomain')
  checkSubdomain(@Body() dto: CheckSubdomainDto): void {
    this.deploymentService.checkSubdomain(dto.subdomain);
  }
}
