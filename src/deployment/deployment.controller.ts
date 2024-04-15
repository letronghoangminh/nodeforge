import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
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
import { VerifiyGuard } from 'src/auth/guard/verify.guard';
import { CheckSubdomainDto, CreateDeploymentDto } from './dto/deployment.dto';
import { GetUser } from 'src/auth/decorator/get-user.decorator';
import { DeploymentModel } from './model/deployment.model';
import { UserType } from 'src/helpers/types';

@Controller('deployment')
@ApiTags('DEPLOYMENT')
export class DeploymentController {
  constructor(private deploymentService: DeploymentService) {}

  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: APISummaries.USER })
  @ApiOkResponse({ type: DeploymentModel })
  @ApiBearerAuth()
  @UseGuards(UserGuard, VerifiyGuard)
  @Post()
  createNewDeployment(
    @Body() dto: CreateDeploymentDto,
    @GetUser() user: UserType,
  ): Promise<DeploymentModel> {
    return this.deploymentService.createNewDeployment(dto, user);
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: APISummaries.USER })
  @ApiBearerAuth()
  @UseGuards(UserGuard, VerifiyGuard)
  @Post('/check-subdomain')
  checkSubdomain(@Body() dto: CheckSubdomainDto): void {
    this.deploymentService.checkSubdomain(dto.subdomain);
  }
}
