import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  FinishCheckoutModel,
  PortalSessionModel,
  SubscriptionModel,
} from './model/subscription.model';
import { PlainToInstance } from 'src/helpers/helpers';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { Role, SubscriptionType } from '@prisma/client';
import { UpdateSubscriptionDto } from './dto/subscription.dto';

@Injectable()
export class SubscriptionService {
  private stripe: Stripe;

  constructor(
    private prismaService: PrismaService,
    private configService: ConfigService,
  ) {
    this.stripe = new Stripe(configService.get('stripe.apiKey'));
  }

  private async handleSubscriptionCreated(
    subscription: Stripe.Subscription,
  ): Promise<void> {
    const subscriptionId = subscription.id;
    const customerId = subscription.customer.toString();

    console.log(
      `CREATED - Subscription with id ${subscriptionId} and customer ${customerId}`,
    );

    if (subscription.status === 'active')
      await this.prismaService.subscription.updateMany({
        where: {
          userId: +subscription.metadata.userId,
        },
        data: {
          type: SubscriptionType.PRO,
          stripeCustomerId: subscription.customer.toString(),
          stripeSubscriptionId: subscription.id,
        },
      });
  }

  private async handleSubscriptionDeleted(
    subscription: Stripe.Subscription,
  ): Promise<void> {
    const subscriptionId = subscription.id;
    const customerId = subscription.customer.toString();

    console.log(
      `DELETED - Subscription with id ${subscriptionId} and customer ${customerId}`,
    );

    await this.prismaService.subscription.updateMany({
      where: {
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
      },
      data: {
        type: SubscriptionType.FREE,
        stripeCheckoutSessionId: null,
        stripeCustomerId: null,
        stripeSubscriptionId: null,
      },
    });
  }

  private async handleSubscriptionUpdated(
    subscription: Stripe.Subscription,
  ): Promise<void> {
    const subscriptionId = subscription.id;
    const customerId = subscription.customer.toString();

    console.log(
      `UPDATED - Subscription with id ${subscriptionId} and customer ${customerId}`,
    );

    if (subscription.cancel_at)
      await this.prismaService.subscription.updateMany({
        where: {
          userId: +subscription.metadata.userId,
        },
        data: {
          type: SubscriptionType.FREE,
        },
      });
    else if (subscription.status === 'active')
      this.handleSubscriptionCreated(subscription);
  }

  async getSubscription(user: { id: number }): Promise<SubscriptionModel> {
    const subscription = await this.prismaService.subscription.findFirst({
      where: {
        userId: user.id,
      },
    });

    if (!subscription) throw new NotFoundException('Subscription not found');

    return PlainToInstance(SubscriptionModel, subscription);
  }

  async getAllSubscriptions(): Promise<SubscriptionModel[]> {
    const subscriptions = await this.prismaService.subscription.findMany({
      where: {
        user: {
          role: {
            not: Role.ADMIN,
          },
        },
      },
    });

    return PlainToInstance(SubscriptionModel, subscriptions);
  }

  async getSubscriptionForUser(userId: number): Promise<SubscriptionModel> {
    const subscription = await this.prismaService.subscription.findFirst({
      where: {
        userId,
      },
    });

    return PlainToInstance(SubscriptionModel, subscription);
  }

  async updateSubscriptionType(
    dto: UpdateSubscriptionDto,
  ): Promise<SubscriptionModel> {
    const existingSubscription =
      await this.prismaService.subscription.findFirst({
        where: {
          id: dto.subscriptionId,
        },
      });

    if (!existingSubscription)
      throw new NotFoundException('Subscription not found');

    if (
      dto.subscriptionType !== SubscriptionType.FREE &&
      dto.subscriptionType !== SubscriptionType.PRO
    ) {
      throw new BadRequestException('Subscription type is invalid');
    }

    const subscription = await this.prismaService.subscription.update({
      where: {
        id: dto.subscriptionId,
      },
      data: {
        type: dto.subscriptionType as SubscriptionType,
      },
    });

    return PlainToInstance(SubscriptionModel, subscription);
  }

  async purchaseProSubscription(user: {
    id: number;
  }): Promise<FinishCheckoutModel> {
    try {
      const prices = await this.stripe.prices.list({
        lookup_keys: [this.configService.get('stripe.priceLookupKey')],
        expand: ['data.product'],
      });

      const session = await this.stripe.checkout.sessions.create({
        billing_address_collection: 'auto',
        line_items: [
          {
            price: prices.data[0].id,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${this.configService.get(
          'app.root',
        )}/successed-purchase?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${this.configService.get('app.root')}/failed-success`,
        subscription_data: {
          metadata: {
            userId: user.id,
          },
        },
      });

      await this.prismaService.subscription.update({
        data: {
          stripeCheckoutSessionId: session.id,
        },
        where: {
          userId: user.id,
        },
      });

      return { redirectUrl: session.url };
    } catch (err) {
      throw new BadRequestException('Payment failed, please try again later');
    }
  }

  async createPortalSession(user: { id: number }): Promise<PortalSessionModel> {
    const subscription = await this.prismaService.subscription.findFirst({
      where: {
        userId: user.id,
      },
    });

    const checkoutSession = await this.stripe.checkout.sessions.retrieve(
      subscription.stripeCheckoutSessionId,
    );

    if (!checkoutSession)
      throw new BadRequestException('Stripe checkout session invalid');

    const portalSession = await this.stripe.billingPortal.sessions.create({
      customer: checkoutSession.customer.toString(),
      return_url: `${this.configService.get('app.root')}/subscription`,
    });

    return { redirectUrl: portalSession.url };
  }

  async webhookReceiver(body: any, signature: string) {
    if (!signature) {
      throw new BadRequestException('Missing stripe-signature header');
    }

    try {
      const event = this.stripe.webhooks.constructEvent(
        body,
        signature,
        this.configService.get('stripe.webhookSecret'),
      );

      let subscription: Stripe.Subscription;

      switch (event.type) {
        case 'customer.subscription.trial_will_end':
          subscription = event.data.object as Stripe.Subscription;
          // this.handleSubscriptionTrialEnding(subscription);
          break;
        case 'customer.subscription.deleted':
          subscription = event.data.object as Stripe.Subscription;
          await this.handleSubscriptionDeleted(subscription);
          break;
        case 'customer.subscription.created':
          subscription = event.data.object as Stripe.Subscription;
          await this.handleSubscriptionCreated(subscription);
          break;
        case 'customer.subscription.updated':
          subscription = event.data.object as Stripe.Subscription;
          await this.handleSubscriptionUpdated(subscription);
          break;
        default:
          console.log(`Unhandled event type ${event.type}.`);
      }
    } catch (err) {
      console.log(`⚠️  Webhook signature verification failed.`, err.message);
      throw new BadRequestException('Bad signature');
    }
  }
}
