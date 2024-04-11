import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
  Headers,
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
import { UserGuard } from 'src/auth/guard/auth.guard';
import { GetUser } from 'src/auth/decorator/get-user.decorator';
import {
  FinishCheckoutModel,
  PortalSessionModel,
  SubscriptionModel,
} from './model/subscription.model';
import { VerifiyGuard } from 'src/auth/guard/verify.guard';
import { FreeSubscriptionGuard } from './guard/subscription.guard';
import { RequestWithRawBody } from 'src/helpers/interfaces';

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
  @ApiOperation({ summary: APISummaries.USER })
  @ApiOkResponse({ type: FinishCheckoutModel })
  @ApiBearerAuth()
  @UseGuards(UserGuard, VerifiyGuard, FreeSubscriptionGuard)
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
  @UseGuards(UserGuard, VerifiyGuard)
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
