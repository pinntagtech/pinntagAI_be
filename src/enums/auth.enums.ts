export const DeviceTypes = {
  ANDROID: 'android',
  IOS: 'ios',
  WEB: 'web',
  POSTMAN: 'postman',
  MOBILE: 'mobile',
};
export const fileType = {
  IMAGE: 'image',
  VIDEO: 'video',
  DOCUMENT: 'document',
  GIF: 'gif',
  AUDIO: 'audio',
  OTHER: 'other',
}
export const allowedImageMimeTypes = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'image/bmp',
  'image/tiff',
  'image/x-icon',
  'image/heif',
  'image/heic',
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
};
