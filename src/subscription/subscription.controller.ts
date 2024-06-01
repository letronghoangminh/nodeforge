import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
  Headers,
  Put,
  Body,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { SubscriptionService } from './subscription.service';
import { UserType } from 'src/helpers/types';
import { APISummaries } from 'src/helpers/helpers';
import { AdminGuard, UserGuard } from 'src/auth/guard/auth.guard';
import { GetUser } from 'src/auth/decorator/get-user.decorator';
import {
  FinishCheckoutModel,
  PortalSessionModel,
  SubscriptionModel,
} from './model/subscription.model';
import { VerifyGuard } from 'src/auth/guard/verify.guard';
import {
  FreeSubscriptionGuard,
  ProSubscriptionGuard,
} from './guard/subscription.guard';
import { RequestWithRawBody } from 'src/helpers/interfaces';
import { UpdateSubscriptionDto } from './dto/subscription.dto';

@Controller('subscription')
@ApiTags('SUBSCRIPTION')
export class SubscriptionController {
  constructor(private subscriptionService: SubscriptionService) {}

  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: APISummaries.USER })
  @ApiOkResponse({ type: SubscriptionModel })
  @ApiBearerAuth()
  @UseGuards(UserGuard)
  @Get()
  getSubscription(@GetUser() user: UserType): Promise<SubscriptionModel> {
    return this.subscriptionService.getSubscription(user);
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: APISummaries.ADMIN })
  @ApiOkResponse({ type: [SubscriptionModel] })
  @ApiBearerAuth()
  @UseGuards(AdminGuard)
  @Get('admin/subscriptions')
  getAllSubscriptions(): Promise<SubscriptionModel[]> {
    return this.subscriptionService.getAllSubscriptions();
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: APISummaries.ADMIN })
  @ApiOkResponse({ type: SubscriptionModel })
  @ApiBearerAuth()
  @UseGuards(AdminGuard)
  @Put('admin/update-subscription')
  updateSubscriptionType(
    @Body() dto: UpdateSubscriptionDto,
  ): Promise<SubscriptionModel> {
    return this.subscriptionService.updateSubscriptionType(dto);
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: APISummaries.USER })
  @ApiOkResponse({ type: FinishCheckoutModel })
  @ApiBearerAuth()
  @UseGuards(UserGuard, VerifyGuard, FreeSubscriptionGuard)
  @Get('pro-subscription')
  purchaseProSubscription(
    @GetUser() user: UserType,
  ): Promise<FinishCheckoutModel> {
    return this.subscriptionService.purchaseProSubscription(user);
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: APISummaries.USER })
  @ApiOkResponse({ type: PortalSessionModel })
  @ApiBearerAuth()
  @UseGuards(UserGuard, VerifyGuard, ProSubscriptionGuard)
  @Get('portal-session')
  createPortalSession(@GetUser() user: UserType): Promise<PortalSessionModel> {
    return this.subscriptionService.createPortalSession(user);
  }

  @HttpCode(HttpStatus.OK)
  @Post('webhook')
  webhookReceiver(
    @Req() req: RequestWithRawBody,
    @Headers('stripe-signature') signature: string,
  ): void {
    this.subscriptionService.webhookReceiver(req.rawBody, signature);
  }
}
