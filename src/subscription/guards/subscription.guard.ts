import {
  CanActivate,
  ExecutionContext,
  Injectable,
  mixin,
  Type,
  UnauthorizedException,
} from '@nestjs/common';
import { FeatureLimitList } from '../models/feature-limit.model';
import { SubscriptionService } from '../subscription.service';

export function SubscriptionGuard(
  featureType: FeatureLimitList,
): Type<CanActivate> {
  @Injectable()
  class SubscriptionTypeGuard implements CanActivate {
    constructor(private readonly subscriptionService: SubscriptionService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
      console.log('Feature Type in Guard:', featureType);
      const request = context.switchToHttp().getRequest();
      const user = request.user;
      const businessProfile = request.businessProfile;
      if (!user || !businessProfile) {
        return false;
      }

      const fetchFeatureLimits =
        await this.subscriptionService.fetchFeatureLimits(
          businessProfile.toString(),
          featureType,
        );

      console.log('Fetch Feature Limits:', fetchFeatureLimits);

      if (!fetchFeatureLimits.success || !fetchFeatureLimits.data) {
        return false;
      }

      if (fetchFeatureLimits.data.isLimitExceeded) {
        throw new UnauthorizedException(
          'Feature limit exceeded. Please upgrade your subscription to access this feature.',
        );
      }

      return true;
    }
  }
  return mixin(SubscriptionTypeGuard);
}
