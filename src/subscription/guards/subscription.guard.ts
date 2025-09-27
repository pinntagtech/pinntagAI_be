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
import { EventService2 } from 'src/event/event.service2';
import { EventTypes } from 'src/enums/event.enums';

export function SubscriptionGuard(
  featureType: FeatureLimitList,
): Type<CanActivate> {
  @Injectable()
  class SubscriptionTypeGuard implements CanActivate {
    constructor(
      private readonly subscriptionService: SubscriptionService,
      private readonly eventService: EventService2,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
      console.log('Feature Type in Guard:', featureType);
      const request = context.switchToHttp().getRequest();
      const user = request.user;
      const businessProfile = request.businessProfile;
      if (!user || !businessProfile) {
        return false;
      }
      //   let isDropPin = false;
      if (featureType === FeatureLimitList.CONTENT_CREATION) {
        const eventId = request.body.eventId || request.query.eventId;
        if (!eventId) {
          throw new UnauthorizedException(
            'Event ID is required to publish content.',
          );
        }
        const event = await this.eventService.findById(eventId);
        if (!event) {
          throw new UnauthorizedException(
            'No event found with the provided ID.',
          );
        }
        if (event.type === EventTypes.DROPPED_PIN)
          featureType = FeatureLimitList.DROP_PIN;
      }
      let dataCount = 0;
      if (featureType === FeatureLimitList.LOCATIONS) {
        const locationsInRequest = request.body.locations;
        if (Array.isArray(locationsInRequest) && locationsInRequest.length) {
          dataCount = locationsInRequest.length;
        }
      }

      const fetchFeatureLimits =
        await this.subscriptionService.fetchFeatureLimits(
          businessProfile.toString(),
          featureType,
          dataCount,
        );

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
