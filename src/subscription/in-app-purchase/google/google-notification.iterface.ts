interface GoogleDeveloperNotification {
  version: string; // Notification version (currently "1.0" for all):contentReference[oaicite:18]{index=18}
  packageName: string; // App package name the notification relates to (e.g. "com.some.app"):contentReference[oaicite:19]{index=19}
  eventTimeMillis: string; // Timestamp of the event in Unix epoch millis:contentReference[oaicite:20]{index=20}

  // Exactly one of the following will be present, depending on the type of event:
  subscriptionNotification?: {
    version: string;
    notificationType: number;
    purchaseToken: string;
    subscriptionId: string; // The subscription SKU (for subscription notifications)
  };
  oneTimeProductNotification?: {
    version: string;
    notificationType: number;
    purchaseToken: string;
    sku: string;
  };
  voidedPurchaseNotification?: {
    purchaseToken: string;
    orderId: string;
    productType: number;
    refundType?: number;
  };
  testNotification?: {}; // Present for test messages (usually an empty object)
}
