import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { androidpublisher_v3, auth } from '@googleapis/androidpublisher';
import { GooglePurchase } from 'src/subscription/in-app-purchase/google/google-purchase.model';
import { IapReceipt } from 'src/subscription/models/iap-receipt.model';
import { GOOGLE_PACKAGE_NAME, GOOGLE_SERVICE_ACCOUNT } from '../iap.config';
import { Subscription } from 'src/subscription/models/subscription.model';
import { SubscriptionSource, SubscriptionStatus } from 'src/enums/user.enum';
import { Types } from 'mongoose';
import { GoogleApiService } from './google-api.service';
import { GooglePubSubMessageDto } from './google-pub-sub.dto';
import { IapNotificationLog } from 'src/subscription/models/iap-notification-log.model';
import { Transaction } from 'src/subscription/models/transaction.model';
import { SubscriptionProduct } from 'src/subscription/models/subscription-product.model';
import { MappingRepoService } from './mapping-repo.service';
import { SubscriptionPrice } from 'src/subscription/models/subscription-price.model';

@Injectable()
export class GoogleIAPService {
  private readonly logger = new Logger(GoogleIAPService.name);
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
    @InjectModel(SubscriptionPrice.name)
    private subscriptionPriceModel: Model<SubscriptionPrice>,

    private googlePlayService: GoogleApiService,
    private mappingRepo: MappingRepoService,
  ) {}
  parsePubSubMessage(
    body: GooglePubSubMessageDto,
  ): GoogleDeveloperNotification {
    // body.message.data is base64
    const decodedData = Buffer.from(body.message.data, 'base64').toString(
      'utf8',
    );
    return JSON.parse(decodedData);
  }

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

    let productDocId = null;

    if (subscriptionNotification) {
      purchaseToken = subscriptionNotification.purchaseToken;
      productId = subscriptionNotification.subscriptionId;
      const foundProduct = await this.subscriptionProductModel.findOne({
        googleProductId: productId,
      });
      if (!foundProduct) {
        this.logger.warn(
          `No subscription product found for Google ID: ${productId}`,
        );
        throw new Error('Unknown product ID from Google notification');
      }
      productDocId = foundProduct._id;
      notificationType = this.mapSubscriptionNotificationType(
        subscriptionNotification.notificationType,
      );
      // Validate via Google Play Developer API (Subscription)
      googleResponse = await this.googlePlayService.getSubscriptionStatus(
        packageName,
        purchaseToken,
      );
      const obfuscatedId =
        googleResponse?.externalAccountIdentifiers
          ?.obfuscatedExternalAccountId ?? null;
      const businessId = obfuscatedId
        ? await this.mappingRepo.findBusinessByObfuscatedId(obfuscatedId)
        : null;
      if (!businessId) {
        this.logger.warn(
          `No business found for obfuscatedExternalAccountId: ${obfuscatedId}`,
        );
      }
      await this.mappingRepo.upsertPurchaseTokenMapping({
        purchaseToken,
        businessId,
        packageName,
        productId,
      });
    } else if (oneTimeProductNotification) {
      purchaseToken = oneTimeProductNotification.purchaseToken;
      productId = oneTimeProductNotification.sku;
      notificationType =
        oneTimeProductNotification.notificationType === 1
          ? 'ONE_TIME_PURCHASED'
          : 'ONE_TIME_CANCELED';
      // Validate via Google API (one-time purchase)
      googleResponse = await this.googlePlayService.getProductPurchaseStatus(
        packageName,
        purchaseToken,
      );
      const obfId = googleResponse?.obfuscatedExternalAccountId ?? null; // productsV2 field
      let businessId = obfId
        ? await this.mappingRepo.findBusinessByObfuscatedId(obfId)
        : await this.mappingRepo.findBusinessByPurchaseToken(purchaseToken);
      if (businessId) {
        await this.mappingRepo.upsertPurchaseTokenMapping({
          purchaseToken,
          businessId,
          packageName,
          productId,
        });
      }
      const ack = googleResponse?.acknowledgementState; // ACKNOWLEDGEMENT_STATE_*
      if (ack === 'ACKNOWLEDGEMENT_STATE_PENDING') {
        await this.googlePlayService.acknowledgeProduct(
          packageName,
          productId,
          purchaseToken,
        ); // server ack
      }
    } else if (voidedPurchaseNotification) {
      purchaseToken = voidedPurchaseNotification.purchaseToken;
      // This indicates a purchase was voided (refunded or canceled by developer). We'll handle as a separate flow.
      notificationType = 'PURCHASE_VOIDED';
      // (Google Play Developer API offers a voided purchases API, but we might not need to call it here; the notification itself is the event.)
      googleResponse = { voided: true };
    } else {
      console.warn('Unknown Google notification type structure', notification);
      throw new Error('Unknown Google notification type');
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
        throw new Error('Duplicate event');
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
        subscription.product = productDocId;
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

  async validatePurchase(
    businessId: string,
    packageName: string,
    productId: string,
    purchaseToken: string,
  ): Promise<boolean> {
    console.log(
      `Validating Google purchase for business ${businessId}, package ${packageName}, product ${productId}, token ${purchaseToken}`,
    );
    // Heuristic: if it's in your subscription catalog, treat as subscription; otherwise one-time
    const isSub = !!(await this.subscriptionPriceModel.findOne({
      googleProductId: productId,
    }));
    console.log(`Is subscription product: ${isSub}`);
    if (isSub) {
      const sub = await this.googlePlayService.getSubscriptionStatus(
        packageName,
        purchaseToken,
      ); // v2
      console.log('Google subscription status response:', sub);
      if (!sub) {
        this.logger.warn(`No sub for token: ${purchaseToken}`);
        return false;
      }

      // Map + persist
      await this.mappingRepo.upsertPurchaseTokenMapping({
        purchaseToken,
        packageName,
        productId,
        businessId: new mongoose.Types.ObjectId(businessId),
      });

      const obf =
        sub?.externalAccountIdentifiers?.obfuscatedExternalAccountId ?? '';
      if (obf) {
        await this.mappingRepo.upsertObfuscatedIdMapping({
          obfuscatedExternalAccountId: obf,
          businessId: new mongoose.Types.ObjectId(businessId),
        });
      }
      return true;
    }

    // ----- One-time product path -----
    const prod = await this.googlePlayService.getProductPurchaseStatus(
      packageName,
      purchaseToken,
    ); // v2
    if (!prod) {
      this.logger.warn(`No product for token: ${purchaseToken}`);
      return false;
    }

    // Persist mappings (primary via obfuscated ID if available)
    const obf = prod?.obfuscatedExternalAccountId ?? '';
    await this.mappingRepo.upsertPurchaseTokenMapping({
      purchaseToken,
      packageName,
      productId,
      businessId: new mongoose.Types.ObjectId(businessId),
    });
    if (obf) {
      await this.mappingRepo.upsertObfuscatedIdMapping({
        obfuscatedExternalAccountId: obf,
        businessId: new mongoose.Types.ObjectId(businessId),
      });
    }

    // Optional: acknowledge one-time if pending (avoid refund)
    if (prod?.acknowledgementState === 'ACKNOWLEDGEMENT_STATE_PENDING') {
      await this.googlePlayService.acknowledgeProduct(
        packageName,
        productId,
        purchaseToken,
      ); // server ack
    }

    // Interpret product state: PURCHASED / PENDING / CANCELLED
    const state = prod?.purchaseStateContext?.purchaseState;
    return state === 'PURCHASED';
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
