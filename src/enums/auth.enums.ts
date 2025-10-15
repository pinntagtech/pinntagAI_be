import { ADDRCONFIG } from 'dns';
import { BusinessUser } from 'src/business/model/businessUser.model';
import { Broadcast } from 'src/notification/models/broadcast.model';

export const UserTypes = {
  USER: 'Consumer',
  BUSINESS: 'BusinessUser',
  ADMIN: 'Admin',
  GUEST: 'Guest',
};

export const CarouselType = {
  Event: 'event',
  Business: 'business',
  OnWheels: 'onWheels',
};

export const DeviceTypes = {
  ANDROID: 'android',
  IOS: 'ios',
  WEB: 'web',
  POSTMAN: 'postman',
  MOBILE: 'mobile',
};

export const FileType = {
  IMAGE: 'image',
  VIDEO: 'video',
  DOCUMENT: 'document',
  GIF: 'gif',
  AUDIO: 'audio',
  OTHER: 'other',
};
export const FileCategoryTypes = {
  PROFILE_PICTURE: 'profile picture',
  Thumbnail: 'thumbnail',
  GALLERY_IMAGE: 'gallery image',
  LOGO: 'logo',
  PROMOTIONAL_IMAGE: 'promotional image',
  PROMOTIONAL_VIDEO: 'promotional video',
  BROCHURE: 'brochure',
  LIVE_STREAM_RECORDING: 'live stream recording',
  BUSINESS_LICENSE: 'business license',
  TAX_DOCUMENT: 'tax document',
  ID_PROOF: 'ID Proof',
  INVOICE: 'invoice',
  AUDIO_NOTE: 'Audio Note',
  CONTENT_QR: 'Content QR',
  VERIFICATION_DOCUMENT: 'Verification Document',
  OTHER: 'other',
};
export const allowedImageMimeTypes = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/svg+xml',
  'image/bmp',
  'image/tiff',
  'image/x-icon',
  'image/heif',
  'image/heic',
];
export const allowedVideoMimeTypes = [
  'video/mp4',
  'video/x-msvideo',
  'video/x-ms-wmv',
  'video/webm',
  'video/ogg',
  'video/3gpp',
  'video/quicktime',
];
export const allowedDocumentMimeTypes = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
  'application/zip',
  'application/x-rar-compressed',
];
export const allowedAudioMimeTypes = [
  'audio/mpeg', // MP3
  'audio/wav', // WAV
  'audio/aac', // AAC
  'audio/ogg', // OGG
  'audio/flac', // FLAC
  'audio/opus', // OPUS
  'audio/midi', // MIDI
  'audio/x-ms-wma', // WMA
  'audio/x-aiff', // AIFF
  'audio/webm', // WebM Audio
];

export const TokenTypes = {
  ACCESS: 'access',
  REFRESH: 'refresh',
  RESET_PASSWORD: 'resetPassword',
  VERIFY_EMAIL: 'verifyEmail',
  GUEST_USER: 'guestUser',
  FCM: 'fcm',
};

export const OtpTypes = {
  EMAIL: 'email',
  MOBILE: 'mobile',
};
export const SubscriptionServiceTypes = {
  IN_APP: 'inApp',
  STRIPE: 'stripe',
};

export const SubscriptionServices = [
  SubscriptionServiceTypes.IN_APP,
  SubscriptionServiceTypes.STRIPE,
];

export const TransactionStatus = {
  PENDING: 0,
  SUCCESS: 1,
  FAILED: 2,
};

export const allowedRoutesForGuest = [
  '/v1/auth/dashboard',
  '/v1/auth/dashboard/map-view',
  '/v1/auth/logout',
];

export const SMSType = {
  OTP: 'OTP',
  WELCOME: 'WELCOME',
  ORDER_CONFIRMATION: 'ORDER_CONFIRMATION',
  ALERT: 'ALERT',
  CONSUMER_INVITE: 'CONSUMER_INVITE',
  BUSINESS_INVITE: 'BUSINESS_INVITE',
};


export const REDIS_TTL = {
  ONEDAY: 86400,
  ONEHOUR: 3600,
  FIVEMINUTES: 300,
  ONEWEEK: 604800,
}


export const FeedTypes = {
  MEDIA: 'Media',
  BROADCAST: 'Broadcast',
  POLL: 'Poll',
  NEWS: 'News',
  AGENDA: 'Agenda',
}