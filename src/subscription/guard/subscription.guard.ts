import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { SubscriptionType } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ProSubscriptionGuard implements CanActivate {
  constructor(private prismaService: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    if (request.user) {
      const subscription = await this.prismaService.subscription.findFirst({
        select: {
          type: true,
        },
        where: {
          userId: request.user.id,
        },
      });

      if (subscription.type === SubscriptionType.PRO) return true;
    }

    throw new ForbiddenException(
      'You must upgrade your account to Pro subscription before using this feature',
    );
  }
}

@Injectable()
export class FreeSubscriptionGuard implements CanActivate {
  constructor(private prismaService: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    if (request.user) {
      const subscription = await this.prismaService.subscription.findFirst({
        select: {
          type: true,
        },
        where: {
          userId: request.user.id,
        },
      });

      if (subscription.type === SubscriptionType.FREE) return true;
    }

    throw new ForbiddenException('This feature is only for Free user only');
  }
}
