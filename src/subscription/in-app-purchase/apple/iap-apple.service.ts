import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
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
import { SubscriptionStatus } from 'src/enums/user.enum';
import { generateAppleJWT } from '../iap-apple-token.generator';
import { IapNotificationLog } from 'src/subscription/models/iap-notification-log.model';
import { Transaction } from 'src/subscription/models/transaction.model';

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
    @InjectModel(IapNotificationLog.name)
    private iapNotificationLogModel: Model<IapNotificationLog>,

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
  //  * Process an incoming Apple Server Notification (already verified and decoded by the guard).
  //  * It logs the notification, calls Apple's API to validate/update the receipt, and updates the database.
  //  * @param notification The decoded notification payload from Apple.
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

  async processNotification(payload: any): Promise<void> {
    const notificationType: string = payload.notificationType;
    const subtype: string = payload.subtype;
    const notificationId: string = payload.notificationUUID; // unique UUID for this notification
    const data = payload.data || {};
    // The data object contains JWS strings for transaction and (maybe) renewal info
    const signedTransactionInfo = data.signedTransactionInfo;
    const signedRenewalInfo = data.signedRenewalInfo; // might be present for certain types
    // Decode the signedTransactionInfo to get details (claims include transactionId, originalTransactionId, productId, purchaseDate, etc)
    let transactionInfo: any = {};
    if (signedTransactionInfo) {
      try {
        const decoded = JSON.parse(
          Buffer.from(signedTransactionInfo.split('.')[1], 'base64').toString(
            'utf8',
          ),
        );
        transactionInfo = decoded;
      } catch (e) {
        console.error('Failed to decode Apple signedTransactionInfo', e);
      }
    }
    // Likewise, decode signedRenewalInfo if present (contains subscription auto-renew status, expiration, etc)
    let renewalInfo: any = {};
    if (signedRenewalInfo) {
      try {
        renewalInfo = JSON.parse(
          Buffer.from(signedRenewalInfo.split('.')[1], 'base64').toString(
            'utf8',
          ),
        );
      } catch (e) {
        console.error('Failed to decode Apple signedRenewalInfo', e);
      }
    }

    // Extract key identifiers from transactionInfo for database lookup
    const originalTransactionId = transactionInfo.originalTransactionId;
    const transactionId = transactionInfo.transactionId;
    const productId = transactionInfo.productId;

    // **Deduplication**: Check if this notification (or transaction) was already processed
    if (notificationId) {
      const alreadyProcessed = await this.transactionModel.findOne({
        notificationUUID: notificationId,
      });
      if (alreadyProcessed) {
        console.log(`Duplicate Apple notification ${notificationId} ignored`);
        return;
      }
    } else if (transactionId) {
      const existingTxn = await this.transactionModel.findOne({
        platform: 'apple',
        transactionId,
      });
      if (existingTxn) {
        console.log(
          `Transaction ${transactionId} already processed, ignoring duplicate event`,
        );
        return;
      }
    }

    // **Validate with Apple Server API or verifyReceipt**:
    let appleValidationData: any = null;
    try {
      if (transactionId) {
        // Preferred: call App Store Server API to get transaction status (requires JWT auth using Apple's private key)
        const url = `https://api.storekit.itunes.apple.com/inApps/v1/transactions/${transactionId}`;
        // Apple API requires a JWT in Authorization header. Assume we have generated a dev token:
        const appleDevToken = await this.getAppleDevToken();
        const response = await this.httpService
          .get(url, {
            headers: { Authorization: `Bearer ${appleDevToken}` },
          })
          .toPromise();
        appleValidationData = response.data;
      }
    } catch (err) {
      console.error(
        'Apple transaction lookup failed, attempting verifyReceipt',
        err,
      );
      // Fallback: use verifyReceipt if Server API call fails or not available
      if (transactionInfo.signedRenewalInfo) {
        // If we have the signedRenewalInfo, use it to get the originalTransactionId or shared secret for verifyReceipt
      }
      // Assuming we stored the latest App Store receipt for this user in AppleReceipt model:
      if (originalTransactionId) {
        const receiptRecord = await this.appleReceiptModel.findOne({
          originalTransactionId,
        });
        if (receiptRecord?.latestReceipt) {
          appleValidationData = await this.verifyReceiptWithApple(
            receiptRecord.latestReceipt,
          );
        }
      }
    }

    // Log raw notification & Apple validation response to DB (for auditing)
    await this.iapNotificationLogModel.create({
      platform: 'apple',
      notificationId,
      rawNotification: payload,
      validationResponse: appleValidationData,
      receivedAt: new Date(),
    });

    // **Update internal models based on event type**:
    // Find or create the subscription record by originalTransactionId
    let subscription = await this.subscriptionModel.findOne({
      platform: 'apple',
      originalTransactionId,
    });
    if (!subscription && notificationType === 'INITIAL_BUY') {
      // New subscription purchase
      subscription = new this.subscriptionModel({
        platform: 'apple',
        originalTransactionId,
        productId,
        status: 'active',
        userId: this.mapToUser(originalTransactionId), // some mapping from transaction to user if applicable
      });
    }
    if (!subscription) {
      console.warn(
        `Subscription record not found for origTx ${originalTransactionId}`,
      );
      // We may still proceed to create one if needed, or skip if irrelevant
      subscription = new this.subscriptionModel({
        platform: 'apple',
        originalTransactionId,
        productId,
        status: 'active',
      });
    }

    // Determine new status or action based on Apple notification type
    switch (notificationType) {
      case 'INITIAL_BUY': {
        // Initial purchase of a subscription
        subscription.status = SubscriptionStatus.ACTIVE;
        subscription.productId = productId;
        // Set current period expiration if available (from Apple validation or renewalInfo)
        if (appleValidationData?.expiresDate || renewalInfo.expirationDate) {
          const expMs =
            appleValidationData?.expiresDate ||
            parseInt(renewalInfo.expirationDate);
          subscription.currentPeriodEnd = new Date(expMs);
        }
        subscription.autoRenew = true;
        break;
      }
      case 'DID_RENEW': {
        // Subscription was successfully auto-renewed (or recovered from billing retry)
        subscription.status = SubscriptionStatus.ACTIVE;
        subscription.autoRenew = true;
        // Update expiration to new date
        if (appleValidationData?.expiresDate || renewalInfo.expirationDate) {
          const expMs =
            appleValidationData?.expiresDate ||
            parseInt(renewalInfo.expirationDate);
          subscription.currentPeriodEnd = new Date(expMs);
        }
        break;
      }
      case 'DID_FAIL_TO_RENEW': {
        // A renewal attempt failed (payment issue). Subscription in retry mode.
        subscription.autoRenew = true; // still in retry period
        if (subtype === 'GRACE_PERIOD') {
          subscription.status = SubscriptionStatus.ACTIVE; // still active during grace period
        } else {
          subscription.status = SubscriptionStatus.PAST_DUE; // payment failed, no grace period
        }
        // Apple will send EXPIRED or DID_RENEW later, so we don't cancel yet.
        break;
      }
      case 'CANCEL': {
        // Subscription was fully cancelled (e.g. refunded by Apple Support)
        subscription.status = SubscriptionStatus.CANCELED;
        subscription.autoRenew = false;
        // If refunded, access should be revoked immediately
        subscription.currentPeriodEnd = new Date(); // end now
        break;
      }
      case 'EXPIRED': {
        // Subscription expired after all renewals ended or not renewed
        subscription.status = SubscriptionStatus.EXPIRED;
        subscription.autoRenew = false;
        subscription.currentPeriodEnd = new Date(); // already expired
        break;
      }
      case 'DID_CHANGE_RENEWAL_STATUS': {
        // User toggled auto-renew status
        const autoRenewEnabled = subtype === 'AUTO_RENEW_ENABLED';
        subscription.autoRenew = autoRenewEnabled;
        // Status might remain active until expiration; no immediate change to active status
        break;
      }
      case 'REFUND': {
        // Apple issued a refund for this subscription (distinct from CANCEL which is AppleCare refund)
        subscription.status = SubscriptionStatus.REFUNDED;
        subscription.autoRenew = false;
        subscription.currentPeriodEnd = new Date(); // assume access revoked
        break;
      }
      // ... handle other types as needed (e.g., DID_CHANGE_RENEWAL_PREF, PRICE_INCREASE_CONSENT)
      default:
        console.warn(`Unhandled Apple notification type: ${notificationType}`);
    }

    // Save updated subscription
    await subscription.save();

    // Create a Transaction record for this event
    if (transactionId) {
      await this.transactionModel.create({
        platform: 'apple',
        notificationUUID: notificationId,
        transactionId,
        originalTransactionId,
        type: notificationType,
        subtype: subtype || null,
        productId,
        purchaseDate: transactionInfo.purchaseDate
          ? new Date(parseInt(transactionInfo.purchaseDate))
          : new Date(),
        processedAt: new Date(),
      });
    }

    // If we have new receipt info (Apple may not send the full receipt in v2), we might update AppleReceipt model
    if (originalTransactionId) {
      let receiptRecord = await this.appleReceiptModel.findOne({
        originalTransactionId,
      });
      if (!receiptRecord) {
        receiptRecord = new this.appleReceiptModel({ originalTransactionId });
      }
      if (appleValidationData?.latestReceipt) {
        receiptRecord.latestReceipt = appleValidationData.latestReceipt; // base64 string of receipt
      }
      // Store the last known status, expiration, etc., from validation data
      if (appleValidationData?.expiresDate) {
        receiptRecord.latestExpiresDate = new Date(
          appleValidationData.expiresDate,
        );
      }
      receiptRecord.lastNotificationType = notificationType;
      await receiptRecord.save();
    }

    // (Optional) trigger any post-processing, such as notifying the user, sending emails, etc., based on event.
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

  private async getAppleDevToken(): Promise<string> {
    // Generate a JWT for Apple StoreKit API using your private key, key ID, issuer ID.
    // Omitted for brevity – assume we have it configured.
    return generateAppleJWT();
  }

  private async verifyReceiptWithApple(receiptData: string): Promise<any> {
    // Call Apple's https://buy.itunes.apple.com/verifyReceipt endpoint with the base64 receipt and shared secret
    // Omitted: implement using appleReceiptVerify library or direct HTTP call.
    return {};
  }
}
