import { Injectable } from '@nestjs/common';
import { androidpublisher_v3, auth } from '@googleapis/androidpublisher';
import { GOOGLE_SERVICE_ACCOUNT } from '../iap.config';

@Injectable()
export class GoogleApiService {
  private androidPublisher: androidpublisher_v3.Androidpublisher;
  private authClient: any;

  constructor() {
    // Initialize Google API auth client using a service account key
    // this.authClient = new google.auth.GoogleAuth({
    //   credentials: require(process.env.GOOGLE_SERVICE_ACCOUNT_JSON),
    //   scopes: ['https://www.googleapis.com/auth/androidpublisher'],
    // }).getClient();
    // // Bind the auth client to all googleapis calls
    // google.options({ auth: this.authClient });

    console.log('GOOGLE_SERVICE_ACCOUNT:', GOOGLE_SERVICE_ACCOUNT);
    this.androidPublisher = new androidpublisher_v3.Androidpublisher({
      auth: new auth.GoogleAuth({
        credentials: GOOGLE_SERVICE_ACCOUNT,
        scopes: ['https://www.googleapis.com/auth/androidpublisher'],
      }),
    });
    this.authClient = this.androidPublisher.context._options.auth;
  }

  /** Verify a subscription purchase and retrieve its latest status */
  async getSubscriptionStatus(packageName: string, purchaseToken: string) {
    console.log('Fetching Google subscription status...2222');
    const res = await this.androidPublisher.purchases.subscriptionsv2.get({
      packageName,
      token: purchaseToken,
    });
    console.log('Subscription status response:', res);
    return res.data; // includes externalAccountIdentifiers?.obfuscatedExternalAccountId
  }

  /** Verify a one-time in-app product purchase (if needed) */
  async getProductPurchaseStatus(packageName: string, purchaseToken: string) {
    const res =
      await this.androidPublisher.purchases.productsv2.getproductpurchasev2({
        packageName,
        token: purchaseToken,
      });
    return res.data;
  }

  /** Validate a one-time product and read obfuscatedExternalAccountId (V2) */
  async getProductPurchaseV2(packageName: string, productToken: string) {
    const res =
      await this.androidPublisher.purchases.productsv2.getproductpurchasev2({
        packageName,
        token: productToken,
      });
    return res.data; // includes obfuscatedExternalAccountId
  }

  async acknowledgeProduct(
    packageName: string,
    productId: string,
    purchaseToken: string,
  ) {
    const res = await this.androidPublisher.purchases.products.acknowledge({
      packageName,
      productId,
      token: purchaseToken,
    });
    return res.data;
  }
}
