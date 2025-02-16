export const DeviceTypes = {
  ANDROID: 'android',
  IOS: 'ios',
  WEB: 'web',
  POSTMAN: 'postman',
  MOBILE: 'mobile',
};

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
