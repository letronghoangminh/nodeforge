import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class SubscriptionModel {
  @Expose()
  @ApiProperty({ type: Number })
  id: number;

  @Expose()
  @ApiProperty({ type: String })
  type: string;

  @Expose()
  @ApiProperty({ type: String })
  stripeCheckoutSessionId: string;

  @Expose()
  @ApiProperty({ type: String })
  stripeCustomerId: string;

  @Expose()
  @ApiProperty({ type: String })
  stripeSubscriptionId: string;
}

export class FinishCheckoutModel {
  @Expose()
  @ApiProperty({ type: String })
  redirectUrl: string;
}

export class PortalSessionModel extends FinishCheckoutModel {}
