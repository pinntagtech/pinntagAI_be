// Enums for receipt validation status and subscription platform type
export enum ReceiptStatus {
  PENDING = 'pending',
  VALID = 'valid',
  EXPIRED = 'expired',
  INVALID = 'invalid',
}

export enum SubscriptionServiceType {
  IOS_APP_STORE = 'in-app-ios',
  ANDROID_PLAY_STORE = 'in-app-android',
  STRIPE = 'stripe',
}

// Configuration constants (to be set in environment or config files)
export const APPLE_SHARED_SECRET =
  process.env.APPLE_SHARED_SECRET || '<itunes_shared_secret>';
export const APP_BUNDLE_ID = process.env.APP_BUNDLE_ID || '<your.app.bundleid>'; // Apple app bundle ID for security checks

export const GOOGLE_SERVICE_ACCOUNT_JSON =
  process.env.GOOGLE_SERVICE_ACCOUNT_JSON || '';

export const GOOGLE_PACKAGE_NAME =
  process.env.GOOGLE_PACKAGE_NAME || '<com.your.app>';
// Parse service account JSON (for Google API authentication)
export const GOOGLE_SERVICE_ACCOUNT = GOOGLE_SERVICE_ACCOUNT_JSON
  ? JSON.parse(GOOGLE_SERVICE_ACCOUNT_JSON)
  : null;

export const STRIPE_WEBHOOK_SECRET =
  process.env.STRIPE_WEBHOOK_SECRET || '<stripe_webhook_signing_secret>';
