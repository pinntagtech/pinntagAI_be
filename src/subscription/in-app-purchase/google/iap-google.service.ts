import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { androidpublisher_v3, auth } from '@googleapis/androidpublisher';
import { GooglePurchase } from 'src/subscription/in-app-purchase/google/google-purchase.model';
import { IapReceipt } from 'src/subscription/models/iap-receipt.model';
import {
  GOOGLE_PACKAGE_NAME,
  GOOGLE_SERVICE_ACCOUNT,
  ReceiptStatus,
  SubscriptionServiceType,
} from '../iap.config';
import { Subscription } from 'src/subscription/models/subscription.model';
import { SubscriptionSource, SubscriptionStatus } from 'src/enums/user.enum';
import { Types } from 'mongoose';
import { GoogleApiService } from './google-api.service';
import { GooglePubSubMessageDto } from './google-pub-sub.dto';
import { IapNotificationLog } from 'src/subscription/models/iap-notification-log.model';
import { Transaction } from 'src/subscription/models/transaction.model';
import { SubscriptionProduct } from 'src/subscription/models/subscription-product.model';

@Injectable()
export class GoogleIAPService {
  private readonly logger = new Logger(GoogleIAPService.name);
  private androidPublisher: androidpublisher_v3.Androidpublisher;
  private authClient: any;
  constructor(
    @InjectModel(GooglePurchase.name)
    private googlePurchaseModel: Model<GooglePurchase>,
    @InjectModel(IapReceipt.name) private iapReceiptModel: Model<IapReceipt>,
    @InjectModel(Transaction.name) private transactionModel: Model<Transaction>,
    @InjectModel(Subscription.name)
    private subscriptionModel: Model<Subscription>,
    @InjectModel(SubscriptionProduct.name)
    private subscriptionProductModel: Model<SubscriptionProduct>,
    @InjectModel(IapNotificationLog.name)
    private iapNotificationLogModel: Model<IapNotificationLog>,

    private googleApi: GoogleApiService,
  ) {
    this.androidPublisher = new androidpublisher_v3.Androidpublisher({
      auth: new auth.GoogleAuth({
        credentials: GOOGLE_SERVICE_ACCOUNT,
        scopes: ['https://www.googleapis.com/auth/androidpublisher'],
      }),
    });
    this.authClient = this.androidPublisher.context._options.auth;
  }
  parsePubSubMessage(
    body: GooglePubSubMessageDto,
  ): GoogleDeveloperNotification {
    // body.message.data is base64
    const decodedData = Buffer.from(body.message.data, 'base64').toString(
      'utf8',
    );
    return JSON.parse(decodedData);
  }

  /**
   * Calls Google Play Developer API to get subscription purchase status.
   * @param productId The subscription product ID (SKU).
   * @param purchaseToken The purchase token from the notification.
   */
  private async fetchSubscriptionStatus(
    productId: string,
    purchaseToken: string,
  ): Promise<androidpublisher_v3.Schema$SubscriptionPurchase | null> {
    if (!this.authClient) {
      throw new Error('Google API client not configured');
    }
    const auth = await this.authClient.getClient();
    try {
      const res = await this.androidPublisher.purchases.subscriptions.get({
        packageName: GOOGLE_PACKAGE_NAME,
        subscriptionId: productId,
        token: purchaseToken,
        auth,
      });
      return res.data;
    } catch (err) {
      this.logger.error(
        `Google API fetch failed for token ${purchaseToken}: ${err}`,
      );
      throw err;
    }
  }

  /**
  //  * Process a Google RTDN DeveloperNotification.
  //  * @param notification The decoded DeveloperNotification object from the Google notification.
  //  */
  // async handleNotification(notification: any): Promise<void> {
  //   // The notification could be subscriptionNotification, oneTimeProductNotification, etc.
  //   const subNotif = notification.subscriptionNotification;
  //   const oneTimeNotif = notification.oneTimeProductNotification;
  //   const testNotif = notification.testNotification;
  //   const voidedNotif = notification.voidedPurchaseNotification;

  //   // Log basic info about the event
  //   let eventTypeDesc = '';
  //   if (subNotif) {
  //     eventTypeDesc = `subscriptionNotification: type=${subNotif.notificationType}`;
  //   } else if (oneTimeNotif) {
  //     eventTypeDesc = `oneTimeProductNotification: type=${oneTimeNotif.notificationType}`;
  //   } else if (testNotif) {
  //     eventTypeDesc = 'testNotification';
  //   } else if (voidedNotif) {
  //     eventTypeDesc = `voidedPurchaseNotification (orderId=${voidedNotif.orderId})`;
  //   }
  //   this.logger.log(`Received Google RTDN: ${eventTypeDesc}`);

  //   // Create log entry in IapReceipt
  //   const iapLog = new this.iapReceiptModel({
  //     platform: SubscriptionServiceType.ANDROID_PLAY_STORE,
  //     rawReceipt: JSON.stringify(notification), // store entire DeveloperNotification JSON
  //     subscriptionId: undefined,
  //     isValidated: false,
  //     validationAttempts: 0,
  //   });

  //   // Determine purchaseToken and productId depending on notification type
  //   let purchaseToken: string | undefined;
  //   let productId: string | undefined;
  //   if (subNotif) {
  //     purchaseToken = subNotif.purchaseToken;
  //     // Unfortunately, subscriptionNotification does not include the productId (subscription ID).
  //     // We might need to look it up from our database using the purchaseToken.
  //   } else if (oneTimeNotif) {
  //     purchaseToken = oneTimeNotif.purchaseToken;
  //     productId = oneTimeNotif.sku; // one-time product SKU is provided
  //   } else if (voidedNotif) {
  //     purchaseToken = voidedNotif.purchaseToken;
  //     // productType tells if it's subscription or in-app product (1 = subscription)
  //     if (voidedNotif.productType === 1) {
  //       // subscription voided
  //       // We might handle this similar to a cancellation.
  //     }
  //   } else if (testNotif) {
  //     // This is a test message from Google. We can simply log and save.
  //     this.logger.log('Google test notification received.');
  //     iapLog.validationAttempts = 1;
  //     iapLog.isValidated = true;
  //     iapLog.validationResponse = { message: 'Test notification received' };
  //     await iapLog.save();
  //     return;
  //   }

  //   if (!purchaseToken) {
  //     // If we couldn't extract a purchase token, log and exit.
  //     this.logger.error('No purchase token found in notification');
  //     iapLog.validationResponse = {
  //       error: 'No purchase token in notification',
  //     };
  //     await iapLog.save();
  //     return;
  //   }

  //   // Find existing GooglePurchase by purchaseToken
  //   let googlePurchase = await this.googlePurchaseModel.findOne({
  //     purchaseToken,
  //   });
  //   if (googlePurchase) {
  //     iapLog.subscriptionId = googlePurchase.subscription; // link to Subscription (user's subscription record)
  //     if (!productId) {
  //       productId = googlePurchase.productId;
  //     }
  //   }

  //   // Save log (initially) before validation
  //   iapLog.validationAttempts = 1;
  //   await iapLog.save();

  //   // If we don't know the productId yet (for subscriptionNotification), try to get it from GooglePurchase or we will fetch via API regardless.
  //   if (!productId) {
  //     this.logger.log(
  //       `Product ID not known for token ${purchaseToken}, will fetch via API.`,
  //     );
  //   }

  //   // Call Google API to get the latest subscription/purchase status
  //   let apiResponse: any;
  //   try {
  //     // For subscription notifications, we must call the subscriptions.get endpoint.
  //     if (subNotif) {
  //       // If productId is still undefined (it might be if we never saw this token before), we still attempt API call.
  //       productId = productId || '<unknown_subscription>';
  //       apiResponse = await this.fetchSubscriptionStatus(
  //         productId,
  //         purchaseToken,
  //       );
  //     } else if (oneTimeNotif) {
  //       // For one-time purchases, use purchases.products.get
  //       const auth = await this.authClient.getClient();
  //       const res = await this.androidPublisher.purchases.products.get({
  //         packageName: GOOGLE_PACKAGE_NAME,
  //         productId: productId!, // oneTimeNotif.sku provided earlier
  //         token: purchaseToken,
  //         auth,
  //       });
  //       apiResponse = res.data;
  //     } else if (voidedNotif) {
  //       // For voided purchases, we might not need to call an API; the notification itself indicates a refund/void.
  //       apiResponse = { voided: true, orderId: voidedNotif.orderId };
  //     }
  //   } catch (err) {
  //     // API call failed (e.g., invalid token or network issue)
  //     this.logger.error(`Google API validation failed: ${err}`);
  //     iapLog.validationResponse = {
  //       error: 'Google API call failed',
  //       details: err.message,
  //     };
  //     await iapLog.save();
  //     return;
  //   }

  //   // Log the API response in the IapReceipt
  //   iapLog.validationResponse = apiResponse;
  //   iapLog.isValidated = true;

  //   // Update or create GooglePurchase record with latest info
  //   if (!googlePurchase) {
  //     // Create a new GooglePurchase if not exists (e.g., new subscription purchase event)
  //     googlePurchase = new this.googlePurchaseModel({
  //       subscription: undefined, // link to Subscription if we create one
  //       purchaseToken: purchaseToken,
  //       productId: productId || (subNotif ? 'unknown' : ''),
  //       packageName: GOOGLE_PACKAGE_NAME,
  //     });
  //   }
  //   // Update fields based on API response if available
  //   if (apiResponse) {
  //     // For subscription:
  //     if (apiResponse.expiryTimeMillis) {
  //       googlePurchase.expiryTime = new Date(
  //         Number(apiResponse.expiryTimeMillis),
  //       );
  //     }
  //     if (apiResponse.startTimeMillis) {
  //       googlePurchase.purchaseTime = new Date(
  //         Number(apiResponse.startTimeMillis),
  //       );
  //     }
  //     // If API indicates canceled or revoked:
  //     if (apiResponse.cancelReason !== undefined) {
  //       // cancelReason: 0 = user canceled, 1 = developer canceled
  //       // We'll mark as expired if user/developer canceled.
  //       if (apiResponse.cancelReason !== null) {
  //         // If a subscription is canceled but still active until expiry, we still consider it valid until expiryTime.
  //       }
  //     }
  //     // Determine status (valid or expired) by comparing expiry time to now
  //     if (
  //       googlePurchase.expiryTime &&
  //       googlePurchase.expiryTime.getTime() < Date.now()
  //     ) {
  //       googlePurchase.status = ReceiptStatus.EXPIRED;
  //     } else {
  //       googlePurchase.status = ReceiptStatus.VALID;
  //     }
  //   }

  //   // Save the GooglePurchase
  //   await googlePurchase.save();
  //   // Link subscription in log if available
  //   if (!iapLog.subscriptionId && googlePurchase.subscription) {
  //     iapLog.subscriptionId = googlePurchase.subscription;
  //   }
  //   // Save updated log (and potentially store an identifier for this notification)
  //   if (subNotif) {
  //     iapLog.latestTransactionId = purchaseToken; // For Google, purchaseToken uniquely identifies the subscription purchase series
  //   } else if (oneTimeNotif) {
  //     iapLog.latestTransactionId = oneTimeNotif.purchaseToken;
  //   } else if (voidedNotif) {
  //     iapLog.latestTransactionId = voidedNotif.orderId; // use orderId as an identifier for voided events
  //   }
  //   await iapLog.save();

  //   // (Optional) Update your Subscription model to reflect new status (active/expired) using googlePurchase.status and expiryTime.

  //   this.logger.log(
  //     `Processed Google notification (token=${purchaseToken}): set status=${googlePurchase.status}, expiry=${googlePurchase.expiryTime}`,
  //   );
  // }

  async processNotification(
    notification: GoogleDeveloperNotification,
  ): Promise<void> {
    const {
      packageName,
      eventTimeMillis,
      subscriptionNotification,
      oneTimeProductNotification,
      testNotification,
      voidedPurchaseNotification,
    } = notification;
    // Determine which type of notification we have
    if (testNotification) {
      console.log(
        'Received Google test notification (ignore for production logic)',
      );
      return;
    }

    let purchaseToken: string;
    let productId: string;
    let notificationType: string;
    let googleResponse: any = null;

    const foundProduct = await this.subscriptionProductModel.findOne({
      googleProductId: productId,
    });
    if (!foundProduct) {
      this.logger.warn(
        `No subscription product found for Google ID: ${productId}`,
      );
      throw new Error('Unknown product ID from Google notification');
    }
    if (subscriptionNotification) {
      purchaseToken = subscriptionNotification.purchaseToken;
      productId = subscriptionNotification.subscriptionId;
      notificationType = this.mapSubscriptionNotificationType(
        subscriptionNotification.notificationType,
      );
      // Validate via Google Play Developer API (Subscription)
      googleResponse = await this.googleApi.getSubscriptionStatus(
        packageName,
        productId,
        purchaseToken,
      );
    } else if (oneTimeProductNotification) {
      purchaseToken = oneTimeProductNotification.purchaseToken;
      productId = oneTimeProductNotification.sku;
      notificationType =
        oneTimeProductNotification.notificationType === 1
          ? 'ONE_TIME_PURCHASED'
          : 'ONE_TIME_CANCELED';
      // Validate via Google API (one-time purchase)
      googleResponse = await this.googleApi.getProductPurchaseStatus(
        packageName,
        productId,
        purchaseToken,
      );
    } else if (voidedPurchaseNotification) {
      purchaseToken = voidedPurchaseNotification.purchaseToken;
      // This indicates a purchase was voided (refunded or canceled by developer). We'll handle as a separate flow.
      notificationType = 'PURCHASE_VOIDED';
      // (Google Play Developer API offers a voided purchases API, but we might not need to call it here; the notification itself is the event.)
      googleResponse = null;
    } else {
      console.warn('Unknown Google notification type structure', notification);
      return;
    }

    // **Deduplication**: avoid processing the same purchase token + eventTime twice
    const eventTime = parseInt(notification.eventTimeMillis || '0');
    if (purchaseToken) {
      const recentTxn = await this.transactionModel.findOne({
        platform: SubscriptionSource.GOOGLE,
        purchaseToken,
        eventTime,
      });
      if (recentTxn) {
        console.log(
          `Duplicate Google event for token ${purchaseToken} at ${eventTime} ignored.`,
        );
        return;
      }
    }

    // Log the raw notification and Google API response
    await this.iapNotificationLogModel.create({
      platform: 'google',
      purchaseToken,
      rawNotification: notification,
      validationResponse: googleResponse,
      receivedAt: new Date(),
    });

    // Find or create Subscription record for this purchaseToken
    let subscription = await this.subscriptionModel.findOne({
      platform: 'google',
      purchaseToken,
    });
    if (!subscription) {
      // If not found and it's a new purchase event, create a new subscription entry
      subscription = new this.subscriptionModel({
        platform: 'google',
        purchaseToken,
        productId,
        userId: this.mapToUser(purchaseToken), // application-specific mapping
      });
    }

    // Update subscription based on notification type
    switch (notificationType) {
      case 'SUBSCRIPTION_PURCHASED': {
        // New subscription started
        subscription.status = SubscriptionStatus.ACTIVE;
        subscription.productId = new mongoose.Types.ObjectId(foundProduct.id);
        subscription.autoRenew = true;
        // Set expiration from Google API response
        // Google API (purchases.subscriptions.get) returns an "expiryTimeMillis"
        if (googleResponse && googleResponse.expiryTimeMillis) {
          subscription.currentPeriodEnd = new Date(
            Number(googleResponse.expiryTimeMillis),
          );
        }
        break;
      }
      case 'SUBSCRIPTION_RENEWED': {
        // Subscription renewed for another period
        subscription.status = SubscriptionStatus.ACTIVE;
        subscription.autoRenew = true;
        if (googleResponse && googleResponse.expiryTimeMillis) {
          subscription.currentPeriodEnd = new Date(
            Number(googleResponse.expiryTimeMillis),
          );
        }
        break;
      }
      case 'SUBSCRIPTION_CANCELED': {
        // User cancelled the subscription (will not renew).
        // The subscription remains active until the end of the current period.
        subscription.autoRenew = false;
        // status stays 'active' until expiration, but we might mark a flag if needed.
        if (googleResponse && googleResponse.expiryTimeMillis) {
          subscription.currentPeriodEnd = new Date(
            Number(googleResponse.expiryTimeMillis),
          );
        }
        break;
      }
      case 'SUBSCRIPTION_EXPIRED': {
        // Subscription expired and is no longer active
        subscription.status = SubscriptionStatus.EXPIRED;
        subscription.autoRenew = false;
        subscription.currentPeriodEnd = new Date(); // already expired by now
        break;
      }
      case 'SUBSCRIPTION_REVOKED': {
        // Subscription was revoked (refunded or forcefully terminated)
        subscription.status = SubscriptionStatus.CANCELED;
        subscription.autoRenew = false;
        subscription.currentPeriodEnd = new Date(); // end now
        break;
      }
      case 'SUBSCRIPTION_ON_HOLD': {
        // Account hold (billing issue, Google-specific). Subscription paused.
        subscription.status = SubscriptionStatus.ON_HOLD;
        subscription.autoRenew = true;
        // Keep currentPeriodEnd as is; user currently in hold (no service, but could resume)
        break;
      }
      case 'SUBSCRIPTION_IN_GRACE_PERIOD': {
        // Payment failed, in grace period
        subscription.status = SubscriptionStatus.IN_GRACE_PERIOD; // still active during grace
        subscription.autoRenew = true;
        // currentPeriodEnd remains at end of paid period, but we know payment is due.
        break;
      }
      case 'SUBSCRIPTION_PAUSED':
      case 'SUBSCRIPTION_PAUSE_SCHEDULE_CHANGED': {
        subscription.status = SubscriptionStatus.PAUSED;
        subscription.autoRenew = true;
        // Google may provide resume time, but not directly in RTDN. The API might show new expiry or pause info.
        break;
      }
      case 'ONE_TIME_PURCHASED': {
        // A one-time in-app product was purchased (non-subscription)
        subscription.status = SubscriptionStatus.FULFILLED; // if we treat one-time purchases as a subscription record
        subscription.currentPeriodEnd = new Date(); // one-time purchase has no expiry
        break;
      }
      case 'PURCHASE_VOIDED': {
        // A purchase (one-time or sub) was voided (refund).
        // If subscription, Google likely also sends SUBSCRIPTION_REVOKED; if one-time, just mark as refunded.
        subscription.status = SubscriptionStatus.VOIDED;
        subscription.autoRenew = false;
        subscription.currentPeriodEnd = new Date();
        break;
      }
      default:
        console.warn(`Unhandled Google notification type: ${notificationType}`);
    }

    await subscription.save();

    // Record the transaction/event in our Transaction collection
    await this.transactionModel.create({
      platform: SubscriptionSource.GOOGLE,
      purchaseToken,
      eventTime,
      type: notificationType,
      productId,
      processedAt: new Date(),
    });

    // Update or create GooglePurchase record with latest status
    let purchaseRec = await this.googlePurchaseModel.findOne({ purchaseToken });
    if (!purchaseRec) {
      purchaseRec = new this.googlePurchaseModel({ purchaseToken, productId });
    }
    if (googleResponse) {
      purchaseRec.originalJson = googleResponse; // store full API response (contains status, expiry, etc.)
      purchaseRec.expiryTime = googleResponse.expiryTimeMillis
        ? new Date(Number(googleResponse.expiryTimeMillis))
        : purchaseRec.expiryTime;
      purchaseRec.autoRenewing = googleResponse.autoRenewing; // boolean
      purchaseRec.priceAmountMicros = googleResponse.priceAmountMicros; // price info, if needed
      purchaseRec.priceCurrencyCode = googleResponse.priceCurrencyCode;
      purchaseRec.paymentState = googleResponse.paymentState; // e.g., 1 (paid), 0 (pending), per Google API
    }
    purchaseRec.lastNotificationType = notificationType;
    await purchaseRec.save();
  }

  private async mapToUser(
    purchaseToken: string,
  ): Promise<Types.ObjectId | null> {
    // Look up an existing subscription by the purchase token
    const subscription = await this.subscriptionModel.findOne({
      purchaseToken,
    });
    return subscription ? subscription.business : null;
  }

  // Map Google notificationType int to readable string (subset of types shown)
  private mapSubscriptionNotificationType(type: number): string {
    switch (type) {
      case 1:
        return 'SUBSCRIPTION_RECOVERED';
      case 2:
        return 'SUBSCRIPTION_RENEWED';
      case 3:
        return 'SUBSCRIPTION_CANCELED';
      case 4:
        return 'SUBSCRIPTION_PURCHASED';
      case 5:
        return 'SUBSCRIPTION_ON_HOLD';
      case 6:
        return 'SUBSCRIPTION_IN_GRACE_PERIOD';
      case 7:
        return 'SUBSCRIPTION_RESTARTED';
      case 12:
        return 'SUBSCRIPTION_REVOKED';
      case 13:
        return 'SUBSCRIPTION_EXPIRED';
      default:
        return `UNKNOWN_${type}`;
    }
  }
}
