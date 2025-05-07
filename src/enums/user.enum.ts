import { BusinessProfile } from 'src/business-profile/models/businessProfile.model';
import { User } from 'src/user/models/user.model';
import { Location } from '../business-profile/models/types.model';
import { Business } from 'src/business/model/business.model';



export const BusinessProfileStatus = {
  ACTIVE: 0,
  VERIFIED: 1,
  BLOCKED: 2,
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
    'id _id name bio brandColor profilePhoto followersCount phone email website isDeleted instagramPageUrl twitterPageUrl facebookPageUrl',
};

export const LocationPopulates = {
  FOREIGN:
    'id _id name latitude longitude location accuracy address1 address2 city state zip website email phone businessLocationId',
};

export const ImagePopulates = {
  FOREIGN: 'id _id url',
};

export const CategoryPopulates = {
  FOREIGN: 'id _id name image color',
};

export const TransactionPopulates = {
  FOREIGN: 'id _id amount status transactionId createdAt updatedAt',
};
const Loc: Location = {
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

export const ProfileTypes = [User.name, Business.name];

export const SubscriptionStatus = {
  ACTIVE: 0,
  PAUSED: 1,
  PENDING_PAYMENT: 2,
};
