import { User } from 'src/user/models/user.model';
// import { Location } from '../business/model/types.model';
import { Business } from 'src/business/model/business.model';
import { LocationClass } from 'src/business/model/types.model';

export const BusinessProfileStatus = {
  ACTIVE: 0,
  VERIFIED: 1,
  BLOCKED: 2,
};

export const UserProfileStatus = {
  INITIATED: 0,
  DETAILS_ADDED: 1,
};

export const FollowingStatus = {
  PENDING: 0,
  ACCEPTED: 1,
  BLOCKED: 2,
};
export const UserPopulates = {
  FOREIGN: 'id _id name email phone profilePhoto followersCount followingCount',
};

export const BusinessPopulates = {
  FOREIGN:
    'id _id name bio description brandColor profilePhoto logo followersCount countryCode phone email website isDeleted instagramPageUrl twitterPageUrl facebookPageUrl',
};

export const LocationPopulates = {
  FOREIGN:
    'id _id name latitude longitude location accuracy address1 address2 city state zip website email phone businessLocationId',
};

export const ImagePopulates = {
  FOREIGN: 'id _id url',
};

export const CategoryPopulates = {
  FOREIGN: 'id _id title lightIcon darkIcon activeColor',
};

export const TransactionPopulates = {
  FOREIGN: 'id _id amount status transactionId createdAt updatedAt',
};
const Loc: LocationClass = {
  latitude: 0,
  longitude: 0,
  accuracy: 0,
  address1: '',
  address2: '',
  city: '',
  state: '',
  zip: '',
  website: '',
  email: '',
  phone: '',
};

export const ExmpLocKeys = Object.keys(Loc);

export const ProfileTypes = ['User', Business.name];

export enum SubscriptionStatus {
  ACTIVE = 'active',
  TRIAL = 'trial', // in trial period
  PAST_DUE = 'past_due', // payment failed, in grace period
  CANCELED = 'canceled', // canceled (will not renew, but might still be active until expiry)
  EXPIRED = 'expired', // fully expired (no longer active)
  PAUSED = 'paused', // subscription is paused
  CANCELLED = 'cancelled', // subscription is cancelled
  REFUNDED = 'refunded', // subscription was refunded
  ON_HOLD = 'on_hold', // subscription is on hold (Google-specific)
  IN_GRACE_PERIOD = 'in_grace_period', // subscription is in grace period (Apple-specific)
  FULFILLED = 'fulfilled', // one-time purchase fulfilled (if we track one-time purchases as subscriptions)
  VOIDED = 'voided', // purchase was voided (refund)
  REVOKED = 'revoked', // subscription was revoked (Apple-specific)
}

export enum SubscriptionSource {
  STRIPE = 'stripe',
  APPLE = 'apple',
  GOOGLE = 'google',
  FREE = 'free',
}

export enum ReceiptStatus {
  PENDING = 'pending', // not yet validated or pending action
  VALID = 'valid', // successfully validated and active
  EXPIRED = 'expired', // subscription receipt expired/lapsed
  INVALID = 'invalid', // invalid or failed verification
}

export enum CurrencyTypes {
  USD = 'USD',
  EUR = 'EUR',
}
