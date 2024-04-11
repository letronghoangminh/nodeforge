import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { UserGuard } from 'src/auth/guard/auth.guard';
import { APISummaries } from 'src/helpers/helpers';
import { VerifiyGuard } from 'src/auth/guard/verify.guard';
import {
  AuthorizeUrlModel,
  GithubBranchModel,
  GithubProfileModel,
  GithubRepositoryModel,
} from './model/github.model';
import { GithubService } from './github.service';
import { GetUser } from 'src/auth/decorator/get-user.decorator';
import { GetGithubBranchesDto, SaveGithubProfileDto } from './dto/github.dto';
import { MessageModel } from 'src/helpers/model';
import { UserType } from 'src/helpers/types';

@Controller('github')
@ApiTags('GITHUB')
export class GithubController {
  constructor(private githubService: GithubService) {}

  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: APISummaries.USER })
  @ApiOkResponse({ type: AuthorizeUrlModel })
  @ApiBearerAuth()
  @UseGuards(UserGuard, VerifiyGuard)
  @Get('/authorize')
  getAuthorizeUrl(): Promise<AuthorizeUrlModel> {
    return this.githubService.getAuthorizeUrl();
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: APISummaries.USER })
  @ApiOkResponse({ type: GithubProfileModel })
  @ApiBearerAuth()
  @UseGuards(UserGuard, VerifiyGuard)
  @Post('/profile')
  saveGithubProfile(
    @Body() dto: SaveGithubProfileDto,
    @GetUser() user: UserType,
  ): Promise<GithubProfileModel> {
    return this.githubService.saveGithubProfile(dto, user);
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: APISummaries.USER })
  @ApiOkResponse({ type: MessageModel })
  @ApiBearerAuth()
  @UseGuards(UserGuard, VerifiyGuard)
  @Delete('/profile')
  deleteGithubProfile(@GetUser() user: UserType): Promise<MessageModel> {
    return this.githubService.deleteGithubProfile(user);
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: APISummaries.USER })
  @ApiOkResponse({ type: [GithubRepositoryModel] })
  @ApiBearerAuth()
  @UseGuards(UserGuard, VerifiyGuard)
  @Get('/repos')
  getGithubRepositories(
    @GetUser() user: UserType,
  ): Promise<GithubRepositoryModel[]> {
    return this.githubService.getGithubRepositories(user);
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: APISummaries.USER })
  @ApiOkResponse({ type: [GithubBranchModel] })
  @ApiBearerAuth()
  @UseGuards(UserGuard, VerifiyGuard)
  @Get('/branches')
  getGithubBranches(
    @Query() query: GetGithubBranchesDto,
    @GetUser() user: UserType,
  ): Promise<GithubBranchModel[]> {
    return this.githubService.getGithubBranches(query, user);
  }
}
