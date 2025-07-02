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
}

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
    'id _id name bio brandColor profilePhoto logo followersCount countryCode phone email website isDeleted instagramPageUrl twitterPageUrl facebookPageUrl',
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

export const SubscriptionStatus = {
  ACTIVE: 0,
  PAUSED: 1,
  PENDING_PAYMENT: 2,
};
