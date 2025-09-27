import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model, Types } from 'mongoose';
import axios from 'axios'; // using axios for HTTP calls to Apple
import { AppleReceipt } from 'src/subscription/in-app-purchase/apple/apple-receipt.model';
import { IapReceipt } from 'src/subscription/models/iap-receipt.model';
import {
  APPLE_SHARED_SECRET,
  ReceiptStatus,
  SubscriptionServiceType,
} from '../iap.config';
import { HttpService } from '@nestjs/axios';
import { Subscription } from 'src/subscription/models/subscription.model';
import { SubscriptionSource, SubscriptionStatus } from 'src/enums/user.enum';
import { generateAppleJWT, verifyAppleJws } from '../iap-apple.helper';
import {
  IapNotificationLog,
  IapPlatform,
} from 'src/subscription/models/iap-notification-log.model';
import { Transaction } from 'src/subscription/models/transaction.model';
import { SubscriptionProduct } from 'src/subscription/models/subscription-product.model';
import { Business } from 'src/business/model/business.model';
import { AppleNotificationSubtype, AppleNotificationType } from '../enums';
import { SubscriptionPrice } from 'src/subscription/models/subscription-price.model';
import {
  PurchaseTokenMap,
  PurchaseTokenMapDocument,
} from 'src/subscription/models/iap-mapping.model';
import { DecodedUser } from 'src/auth/interfaces/decodedUser.interface';
import { console } from 'inspector';

const APPLE_VERIFY_RECEIPT_PROD_URL =
  'https://buy.itunes.apple.com/verifyReceipt';
const APPLE_VERIFY_RECEIPT_SANDBOX_URL =
  'https://sandbox.itunes.apple.com/verifyReceipt';

@Injectable()
export class AppleIAPService {
  private readonly logger = new Logger(AppleIAPService.name);
  constructor(
    @InjectModel(IapReceipt.name) private iapReceiptModel: Model<IapReceipt>,
    @InjectModel(Transaction.name) private transactionModel: Model<Transaction>,
    @InjectModel(AppleReceipt.name)
    private appleReceiptModel: Model<AppleReceipt>,
    @InjectModel(Subscription.name)
    private subscriptionModel: Model<Subscription>,
    @InjectModel(SubscriptionProduct.name)
    private subscriptionProductModel: Model<SubscriptionProduct>,
    @InjectModel(SubscriptionPrice.name)
    private subscriptionPriceModel: Model<SubscriptionPrice>,
    @InjectModel(IapNotificationLog.name)
    private iapNotificationLogModel: Model<IapNotificationLog>,
    @InjectModel(Business.name) private businessModel: Model<Business>,
    @InjectModel(PurchaseTokenMap.name)
    private readonly purchaseTokenMapModel: Model<PurchaseTokenMapDocument>,

    private httpService: HttpService,
  ) {}

  /**
   * Validate an Apple receipt with Apple's verifyReceipt API.
   * @param base64Receipt The receipt data (base64 string) to validate.
   * @returns The parsed response from Apple.
   */
  async validateReceiptWithApple(base64Receipt: string): Promise<any> {
    const requestBody = {
      'receipt-data': base64Receipt,
      password: APPLE_SHARED_SECRET,
      'exclude-old-transactions': false, // include all transactions in the response
    };
    // Try production endpoint first
    let response = await axios.post(
      APPLE_VERIFY_RECEIPT_PROD_URL,
      requestBody,
      { timeout: 5000 },
    );
    let data = response.data;
    if (data.status === 21007) {
      // Receipt is from the test environment, retry on sandbox URL
      response = await axios.post(
        APPLE_VERIFY_RECEIPT_SANDBOX_URL,
        requestBody,
        { timeout: 5000 },
      );
      data = response.data;
    } else if (data.status === 21008) {
      // Receipt is from production environment but was sent to sandbox URL (unlikely if we started with prod).
      response = await axios.post(APPLE_VERIFY_RECEIPT_PROD_URL, requestBody, {
        timeout: 5000,
      });
      data = response.data;
    }
    return data;
  }
  /**
  // The possible status codes are: 1 – active, 2 – expired, 3 – in billing retry (payment failed), 4 – in grace period, 5 – revoked/refunded
  //   A sample response structure: {
  //   "bundleId": "com.yourapp",
  //   "environment": "Production",
  //   "data": [
  //     {
  //       "subscriptionGroupIdentifier": "12345678",
  //       "lastTransactions": [
  //         {
  //           "transactionId": "230001020690335",
  //           "status": 1,
  //           "signedTransactionInfo": "<base64-string>",
  //           "signedRenewalInfo": "<base64-string>"
  //         }
  //       ]
  //     }
  //   ]
  // }
    * Fetch the status of a subscription from Apple using the originalTransactionId. Optionally filter by specific statuses. 
    * @param originalTransactionId The original transaction ID of the subscription.
    * @param statuses Optional list of statuses to filter by (e.g. '1' for active).
    * @returns The subscription status data from Apple.
    * @throws InternalServerErrorException if the request fails.
    /**
   */
  async fetchSubscriptionStatus(
    originalTransactionId: string,
    ...statuses: string[]
  ): Promise<any> {
    let params = '';
    if (statuses.length) {
      params = '?' + statuses.map((s) => `status=${s}`).join('&');
    }
    const jwtToken = generateAppleJWT();
    const url = `${process.env.APPLE_API_BASE_URL}/inApps/v1/subscriptions/${originalTransactionId}${params}`;
    try {
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
        },
      });
      return response.data;
    } catch (error) {
      this.logger.error(
        `Failed to fetch subscription status: ${error.message}`,
      );
      throw new InternalServerErrorException(
        'Failed to fetch subscription status',
      );
    }
  }

  // --- Little helpers (inline to keep this self-contained) ---
  b64urlToUtf8Json = (b64url: string) => {
    const padLen = (4 - (b64url.length % 4)) % 4;
    const b64 =
      b64url.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat(padLen);
    return JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
  };
  decodeJwsPayload = (jws: string) => {
    const parts = jws.split('.');
    if (parts.length !== 3) throw new Error('Invalid JWS');
    // parts[1] is base64url; decode to JSON
    return this.b64urlToUtf8Json(parts[1]);
  };
  isNonEmpty = (obj: any) =>
    !!obj && typeof obj === 'object' && Object.keys(obj).length > 0;

  async processNotification(payload: any): Promise<void> {
    this.logger.log(
      'Entered to the service to process Apple notification payload.',
    );
    const notificationType: string = payload.notificationType;
    const subtype: string = payload.subtype;
    const notificationId: string = payload.notificationUUID; // unique UUID for this notification
    const data = payload.data || {};
    const signedTransactionInfo = data.signedTransactionInfo as
      | string
      | undefined;
    const signedRenewalInfo = data.signedRenewalInfo as string | undefined;

    this.logger.log(
      `Apple notification type=${notificationType}, subtype=${subtype}, id=${notificationId}`,
    );

    // Decode the signedTransactionInfo (notification)
    let transactionInfo: any = {};
    if (signedTransactionInfo) {
      // If you have a working verifier, you can verify first; here we decode to avoid blocking on signature issues.
      try {
        transactionInfo = this.decodeJwsPayload(signedTransactionInfo);
      } catch (e) {
        this.logger.error('Failed to decode Apple signedTransactionInfo', e);
        // You can choose to throw here; keeping non-fatal so API fallback can still help.
      }
    }

    // Decode the signedRenewalInfo (notification)
    let renewalInfo: any = {};
    if (signedRenewalInfo) {
      try {
        renewalInfo = this.decodeJwsPayload(signedRenewalInfo);
      } catch (e) {
        this.logger.error('Failed to decode Apple signedRenewalInfo', e);
      }
    }

    this.logger.log('Decoded renewalInfo (from notification):', renewalInfo);
    this.logger.log(
      'Decoded transactionInfo (from notification):',
      transactionInfo,
    );

    // Extract identifiers from decoded notification (may be refined after API call)
    let originalTransactionId = transactionInfo?.originalTransactionId;
    let transactionId = transactionInfo?.transactionId;
    let productId = transactionInfo?.productId;
    let packageName = transactionInfo?.bundleId;

    // --- Map to your business via your mapping collection ---
    const iapMapping = await this.purchaseTokenMapModel.findOne({
      purchaseToken: originalTransactionId,
      packageName,
      productId,
      platform: 'apple',
    });
    if (!iapMapping) {
      this.logger.warn(
        `No mapping found for originalTransactionId=${originalTransactionId}, package=${packageName}, productId=${productId}`,
      );
      throw new Error('No mapping found for this transaction');
    }
    const businessId = iapMapping.businessId;
    const business = await this.businessModel.findById(businessId);
    if (!business) {
      this.logger.warn(`Business not found for id=${businessId}`);
      throw new Error('Business not found');
    }

    const foundPrice = await this.subscriptionPriceModel.findOne({
      appleProductId: productId,
    });
    if (!foundPrice) {
      this.logger.warn(
        `No subscription price found for appleProductId=${productId}`,
      );
      throw new Error('Unknown productId in notification');
    }

    if (notificationId) {
      const alreadyProcessed = await this.transactionModel.findOne({
        notificationUUID: notificationId,
      });
      if (alreadyProcessed) {
        this.logger.log(
          `Duplicate Apple notification ${notificationId} ignored`,
        );
        throw new Error('Duplicate notification');
      }
    }
    if (transactionId) {
      const existingTxn = await this.transactionModel.findOne({
        platform: SubscriptionSource.APPLE,
        appleTransactionId: transactionId,
      });
      if (existingTxn) {
        this.logger.log(
          `Transaction ${transactionId} already processed, ignoring duplicate event`,
        );
        throw new Error('Duplicate transaction');
      }
    }

    // --- Preferred: call App Store Server API Get Transaction Info ---
    // Docs: returns JSON with signedTransactionInfo (JWS) and possibly signedRenewalInfo (JWS).
    // You need to decode those to read purchaseDate / expiresDate, etc.
    // https://developer.apple.com/documentation/appstoreserverapi/get-transaction-info
    let appleValidationData: any = null;
    let apiTxInfo: any = {};
    let apiRenewalInfo: any = {};

    try {
      if (transactionId) {
        const url = `${process.env.APPLE_API_BASE_URL}/inApps/v1/transactions/${transactionId}`;
        const appleDevToken = await this.getAppleDevToken();
        const response = await this.httpService
          .get(url, { headers: { Authorization: `Bearer ${appleDevToken}` } })
          .toPromise();

        appleValidationData = response.data; // <-- JSON object (NOT a JWS)
        this.logger.log(
          'Apple GetTransactionInfo raw response:',
          appleValidationData,
        );

        // Decode the JWS strings from the API response:
        // https://developer.apple.com/documentation/appstoreserverapi/transactioninforesponse
        if (appleValidationData?.signedTransactionInfo) {
          apiTxInfo = this.decodeJwsPayload(
            appleValidationData.signedTransactionInfo,
          );
        }
        if (appleValidationData?.signedRenewalInfo) {
          apiRenewalInfo = this.decodeJwsPayload(
            appleValidationData.signedRenewalInfo,
          );
        }

        this.logger.log('Decoded transactionInfo (from API):', apiTxInfo);
        this.logger.log('Decoded renewalInfo (from API):', apiRenewalInfo);
      }
    } catch (err) {
      this.logger.error(
        'Apple transaction lookup failed, attempting verifyReceipt',
        err,
      );
      // (Optional legacy fallback) verifyReceipt is deprecated; prefer Server API. Keep only if you still store raw receipts.
      // https://developer.apple.com/documentation/appstoreserverapi  (see deprecation notes of verifyReceipt)
      try {
        if (originalTransactionId) {
          const receiptRecord = await this.appleReceiptModel.findOne({
            originalTransactionId,
          });
          if (receiptRecord?.latestReceipt) {
            appleValidationData = await this.validateReceiptWithApple(
              receiptRecord.latestReceipt,
            );
          }
        }
      } catch (e) {
        this.logger.error('verifyReceipt fallback failed', e);
      }
    }

    // Choose the most reliable decoded sources (prefer API > notification)
    const effectiveTx = this.isNonEmpty(apiTxInfo)
      ? apiTxInfo
      : transactionInfo;
    const effectiveRenewal = this.isNonEmpty(apiRenewalInfo)
      ? apiRenewalInfo
      : renewalInfo;

    // Refresh identifiers in case API decoding had more accurate data
    originalTransactionId =
      effectiveTx?.originalTransactionId ?? originalTransactionId;
    transactionId = effectiveTx?.transactionId ?? transactionId;
    productId = effectiveTx?.productId ?? productId;
    packageName = effectiveTx?.bundleId ?? packageName;

    // Extract important dates (milliseconds since epoch as strings)
    const purchaseDateMs =
      (effectiveTx && Number(effectiveTx.purchaseDate)) || undefined; // when the charge occurred
    const expiresDateMs =
      (effectiveTx && Number(effectiveTx.expiresDate)) ||
      (effectiveRenewal && Number(effectiveRenewal.expiresDate)) ||
      undefined;

    // Prepare decoded “validation” object for logging/auditing
    const decodedAppleValidationData = {
      transaction: this.isNonEmpty(apiTxInfo) ? apiTxInfo : transactionInfo,
      renewal: this.isNonEmpty(apiRenewalInfo) ? apiRenewalInfo : renewalInfo,
    };

    // Log raw notification & Apple validation response to DB (for auditing)
    await this.iapNotificationLogModel.create({
      platform: IapPlatform.APPLE,
      notificationUUID: notificationId,
      rawPayload: JSON.stringify(payload),
      validationResponse: JSON.stringify(appleValidationData ?? {}),
      decodedValidationResponse: JSON.stringify(decodedAppleValidationData),
      eventTime: new Date(),
      eventType: notificationType,
      productId: productId,
      receivedAt: new Date(),
    });

    // --- Upsert subscription based on event type ---
    let subscription = await this.subscriptionModel.findOne({
      source: SubscriptionSource.APPLE,
      originalTransactionId,
    });
    if (!subscription) {
      this.logger.log(
        `Subscription record not found for origTx ${originalTransactionId}`,
      );
      subscription = new this.subscriptionModel({
        source: SubscriptionSource.APPLE,
        originalTransactionId,
        product: foundPrice.product,
        price: foundPrice._id,
        status: SubscriptionStatus.ACTIVE,
        business: business._id,
      });
    }

    switch (notificationType) {
      case AppleNotificationType.INITIAL_BUY: {
        subscription.status = SubscriptionStatus.ACTIVE;
        subscription.product = foundPrice.product;
        if (expiresDateMs)
          subscription.currentPeriodEnd = new Date(expiresDateMs);
        subscription.autoRenew = true;
        break;
      }

      case AppleNotificationType.DID_CHANGE_RENEWAL_PREF: {
        // Prefer the next-period product from renewal info:
        // autoRenewProductId = product that will renew next period.
        const nextProductId =
          effectiveRenewal?.autoRenewProductId || effectiveRenewal?.productId;
        if (nextProductId && nextProductId !== productId) {
          const newPrice = await this.subscriptionPriceModel.findOne({
            appleProductId: nextProductId,
          });
          if (newPrice) {
            subscription.price = new mongoose.Types.ObjectId(newPrice.id);
            subscription.product = newPrice.product;
            this.logger.log(
              `Subscription ${subscription._id} changed to new product ${nextProductId} (DID_CHANGE_RENEWAL_PREF)`,
            );
          } else {
            this.logger.warn(
              `Unknown new productId ${nextProductId} in DID_CHANGE_RENEWAL_PREF`,
            );
          }
        }
        break;
      }

      case AppleNotificationType.DID_RENEW: {
        subscription.status = SubscriptionStatus.ACTIVE;
        subscription.autoRenew = true;

        const startMs =
          (effectiveTx && Number(effectiveTx.purchaseDate)) ||
          (effectiveRenewal && Number(effectiveRenewal.signedDate)) ||
          undefined;
        if (startMs) subscription.startDate = new Date(startMs);
        if (expiresDateMs) subscription.endDate = new Date(expiresDateMs);
        break;
      }

      case AppleNotificationType.DID_FAIL_TO_RENEW: {
        subscription.autoRenew = true; // still in retry
        if (subtype === AppleNotificationSubtype.GRACE_PERIOD) {
          subscription.status = SubscriptionStatus.ACTIVE;
        } else {
          subscription.status = SubscriptionStatus.PAST_DUE;
        }
        break;
      }

      case AppleNotificationType.CANCEL: {
        subscription.status = SubscriptionStatus.CANCELED;
        subscription.autoRenew = false;
        subscription.currentPeriodEnd = new Date(); // end now
        break;
      }

      case AppleNotificationType.EXPIRED: {
        subscription.status = SubscriptionStatus.EXPIRED;
        subscription.autoRenew = false;
        subscription.currentPeriodEnd = new Date();
        break;
      }

      case AppleNotificationType.DID_CHANGE_RENEWAL_STATUS: {
        const autoRenewEnabled =
          subtype === AppleNotificationSubtype.AUTO_RENEW_ENABLED;
        subscription.autoRenew = !!autoRenewEnabled;
        break;
      }

      case AppleNotificationType.REFUND: {
        subscription.status = SubscriptionStatus.REFUNDED;
        subscription.autoRenew = false;
        subscription.currentPeriodEnd = new Date();
        break;
      }

      case AppleNotificationType.INTERACTIVE_RENEWAL: {
        subscription.status = SubscriptionStatus.ACTIVE;
        subscription.autoRenew = false; // manual renewal
        if (expiresDateMs)
          subscription.currentPeriodEnd = new Date(expiresDateMs);
        break;
      }

      case AppleNotificationType.REVOKE: {
        subscription.status = SubscriptionStatus.REVOKED;
        subscription.autoRenew = false;
        subscription.currentPeriodEnd = new Date();
        break;
      }

      default:
        this.logger.warn(
          `Unhandled Apple notification type: ${notificationType}`,
        );
    }

    // Save updated subscription
    await subscription.save();
    const updatedSubscription = await this.subscriptionModel.findById(
      subscription._id,
    );
    this.logger.log(
      'Updated subscription after notification processing:',
      updatedSubscription,
    );

    // Create a Transaction record for this event
    if (transactionId) {
      await this.transactionModel.create({
        platform: SubscriptionSource.APPLE,
        notificationUUID: notificationId,
        appleTransactionId: transactionId,
        originalTransactionId,
        type: notificationType,
        subtype: subtype || null,
        productId,
        purchaseDate: purchaseDateMs ? new Date(purchaseDateMs) : new Date(),
        processedAt: new Date(),
      });
    }

    // Update AppleReceipt model with what we can (if you keep this record)
    if (originalTransactionId) {
      let receiptRecord = await this.appleReceiptModel.findOne({
        originalTransactionId,
      });
      if (!receiptRecord) {
        receiptRecord = new this.appleReceiptModel({
          originalTransactionId,
          receiptData: 'There is no receipt data available', // not provided in v2
          subscription: subscription._id,
        });
      }
      if (expiresDateMs) {
        receiptRecord.latestExpiresDate = new Date(expiresDateMs);
      }
      receiptRecord.lastNotificationType = notificationType;
      await receiptRecord.save();
    }

    // (Optional) trigger any post-processing, such as notifying the user, sending emails, etc., based on event.
  }

  async validatePurchase(token: string, businessId: string): Promise<boolean> {
    try {
      this.logger.log('Validating Apple Service..............');
      let transactionInfo: any = {};
      if (!verifyAppleJws(token)) {
        console.warn('Invalid JWS signature for token');
        throw new Error('Invalid JWS signature');
      }
      try {
        const decoded = JSON.parse(
          Buffer.from(token.split('.')[1], 'base64').toString('utf8'),
        );
        transactionInfo = decoded;
      } catch (e) {
        console.error('Failed to decode Apple token', e);
      }
      const purchaseToken = transactionInfo.originalTransactionId;
      const transactionId = transactionInfo.transactionId;
      const productId = transactionInfo.productId;
      const packageName = transactionInfo.bundleId;
      this.logger.log('Decoded transactionInfo:', transactionInfo);
      this.logger.log('purchaseToken:', purchaseToken);
      this.logger.log('transactionId:', transactionId);
      this.logger.log('productId:', productId);
      this.logger.log('packageName:', packageName);
      await this.purchaseTokenMapModel.create({
        purchaseToken,
        businessId: new mongoose.Types.ObjectId(businessId),
        packageName,
        productId,
        platform: 'apple',
      });
      return true;
    } catch (error) {
      console.error('Error validating Apple purchase', error);
      return false;
    }
  }

  private async mapToUser(
    originalTransactionId: string,
  ): Promise<Types.ObjectId | null> {
    // Look up an existing subscription by the original transaction ID
    const subscription = await this.subscriptionModel.findOne({
      originalTransactionId,
    });
    return subscription ? subscription.business : null;
  }

  private _appleJwtCache?: { token: string; exp: number };

  private async getAppleDevToken(): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    if (this._appleJwtCache && this._appleJwtCache.exp - 60 > now) {
      return this._appleJwtCache.token;
    }
    const token = generateAppleJWT();
    const decoded: any = JSON.parse(
      Buffer.from(token.split('.')[1], 'base64').toString('utf8'),
    );
    this._appleJwtCache = { token, exp: decoded.exp };
    return token;
  }

  /**
   * Process an incoming Apple Server Notification (already verified and decoded by the guard).
   * It logs the notification, calls Apple's API to validate/update the receipt, and updates the database.
   * @param notification The decoded notification payload from Apple.
  //  */
  // async handleNotification(notification: any): Promise<void> {
  //   // Extract relevant info from the notification payload
  //   const notificationType: string = notification.notificationType;
  //   const subtype: string | undefined = notification.subtype;
  //   const origTxId: string = notification.data?.originalTransactionId; // original transaction ID
  //   const txId: string | undefined = notification.data?.transactionId; // may be undefined for certain notification types

  //   this.logger.log(
  //     `Received Apple notification: type=${notificationType}, subtype=${subtype}, origTxId=${origTxId}, txId=${txId}`,
  //   );

  //   // Log the raw notification payload in IapReceipt
  //   const iapLog = new this.iapReceiptModel({
  //     platform: SubscriptionServiceType.IOS_APP_STORE,
  //     rawReceipt: JSON.stringify(notification), // store the notification payload JSON as rawReceipt
  //     subscriptionId: undefined, // will fill after finding the subscription (if available)
  //     isValidated: false,
  //     validationAttempts: 0,
  //   });

  //   // Find the associated AppleReceipt (and thus Subscription) by originalTransactionId
  //   let appleReceipt = await this.appleReceiptModel.findOne({
  //     originalTransactionId: origTxId,
  //   });
  //   if (appleReceipt) {
  //     iapLog.subscriptionId = appleReceipt.subscription; // link log to the Subscription
  //   }

  //   // ** Duplicate notification handling **: check if this transaction was already processed
  //   if (txId && appleReceipt && appleReceipt.latestReceiptInfo) {
  //     const alreadyProcessed = appleReceipt.latestReceiptInfo.some(
  //       (item: any) => item.transaction_id === txId,
  //     );
  //     if (alreadyProcessed) {
  //       // It's a replay of an event we already have in latestReceiptInfo
  //       this.logger.warn(
  //         `Duplicate Apple notification for transaction ${txId} - ignoring reprocessing`,
  //       );
  //       // Mark log and save it, but skip calling Apple again to avoid unnecessary work
  //       iapLog.isValidated = true;
  //       iapLog.validationResponse = { duplicate: true };
  //       await iapLog.save();
  //       return;
  //     }
  //   }

  //   // Save the log entry early (before validation), with pending status
  //   iapLog.validationAttempts = 1;
  //   await iapLog.save();

  //   // If we have no AppleReceipt (e.g., this might be the first time seeing this subscription), create one
  //   if (!appleReceipt) {
  //     this.logger.log(
  //       `No AppleReceipt found for origTxId=${origTxId}, creating a new record.`,
  //     );
  //     appleReceipt = new this.appleReceiptModel({
  //       subscription: undefined, // If we have a Subscription model, we could create or link it here.
  //       originalTransactionId: origTxId,
  //       receiptData: '', // will store latest receipt after validation
  //       latestReceiptInfo: [],
  //       pendingRenewalInfo: [],
  //       status: ReceiptStatus.PENDING,
  //     });
  //   }

  //   // If the notification includes the latest App Store receipt (for example, in certain notification types, the appReceipt may be included), you could use it.
  //   // In v2 notifications, we have signedTransactionInfo and signedRenewalInfo JWS strings in notification.data.
  //   // We could decode those for details, but we will instead call Apple's API with our stored receipt (or require the app to send us the latest base64 receipt).
  //   // For simplicity, assume we already have a receiptData on record or can use the last known receipt.
  //   let base64Receipt = appleReceipt.receiptData;
  //   if (!base64Receipt) {
  //     // If we don't have a stored receipt, we cannot call verifyReceipt. In a real scenario, we might need the app to send us the receipt.
  //     this.logger.error(
  //       `No receipt data available for origTxId=${origTxId}. Skipping Apple validation.`,
  //     );
  //     iapLog.validationResponse = { error: 'No receiptData for verification' };
  //     iapLog.isValidated = false;
  //     await iapLog.save();
  //     return;
  //   }

  //   // Call Apple verifyReceipt API
  //   let appleResponse: any;
  //   try {
  //     appleResponse = await this.validateReceiptWithApple(base64Receipt);
  //   } catch (err) {
  //     this.logger.error(`Apple verifyReceipt API call failed: ${err}`);
  //     iapLog.validationResponse = {
  //       error: 'verifyReceipt request failed',
  //       details: err.message,
  //     };
  //     await iapLog.save();
  //     return;
  //   }

  //   // Update log with raw response
  //   iapLog.validationResponse = appleResponse;
  //   iapLog.isValidated = true;

  //   // Check status codes from Apple
  //   const statusCode = appleResponse.status;
  //   appleReceipt.environment =
  //     appleResponse.environment ?? appleReceipt.environment;
  //   appleReceipt.appleStatusCode = statusCode;
  //   if (statusCode === 0 || statusCode === 21006) {
  //     // 0: valid receipt, 21006: valid but subscription expired
  //     const latestInfo = appleResponse.latest_receipt_info || [];
  //     const renewalInfo = appleResponse.pending_renewal_info || [];
  //     appleReceipt.latestReceiptInfo = latestInfo;
  //     appleReceipt.pendingRenewalInfo = renewalInfo;
  //     // Store the latest receipt base64 for future validations
  //     if (appleResponse.latest_receipt) {
  //       appleReceipt.receiptData = appleResponse.latest_receipt;
  //     }
  //     // Determine latest expiration date from latestReceiptInfo
  //     let maxExpireMs = 0;
  //     latestInfo.forEach((item: any) => {
  //       if (item.expires_date_ms) {
  //         const exp = Number(item.expires_date_ms);
  //         if (!isNaN(exp) && exp > maxExpireMs) {
  //           maxExpireMs = exp;
  //         }
  //       }
  //     });
  //     if (maxExpireMs > 0) {
  //       appleReceipt.latestExpiryDate = new Date(maxExpireMs);
  //     }
  //     // Set status based on whether subscription is currently active
  //     if (
  //       appleReceipt.latestExpiryDate &&
  //       appleReceipt.latestExpiryDate.getTime() < Date.now()
  //     ) {
  //       appleReceipt.status = ReceiptStatus.EXPIRED;
  //     } else {
  //       appleReceipt.status = ReceiptStatus.VALID;
  //     }
  //     // If status was 21006, it implies expired subscription
  //     if (statusCode === 21006) {
  //       appleReceipt.status = ReceiptStatus.EXPIRED;
  //     }
  //   } else {
  //     // Non-zero status (other than 21006) indicates an invalid receipt or error
  //     appleReceipt.status = ReceiptStatus.INVALID;
  //   }

  //   // Save the updated AppleReceipt
  //   await appleReceipt.save();
  //   // Link the Subscription if not already (for example, if we created appleReceipt without subscription earlier, we'd assign it now if we have context)
  //   if (!iapLog.subscriptionId && appleReceipt.subscription) {
  //     iapLog.subscriptionId = appleReceipt.subscription;
  //   }
  //   // Update log entry (including any latestTransactionId for reference)
  //   if (txId) {
  //     iapLog.latestTransactionId = txId;
  //   }
  //   await iapLog.save();

  //   // (Optional) If you have a Subscription model tracking user's subscription status, update it here:
  //   // e.g., mark the subscription active/expired, update next billing date, etc., based on appleReceipt.status and latestExpiryDate.

  //   this.logger.log(
  //     `Processed Apple notification ${notificationType} for origTxId=${origTxId}: set status=${appleReceipt.status}`,
  //   );
  // }
}
