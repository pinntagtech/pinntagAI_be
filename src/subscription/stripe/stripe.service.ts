import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model, mongo } from 'mongoose';
import { InjectStripe } from 'nestjs-stripe';
import {
  SubscriptionServiceTypes,
  TransactionStatus,
} from 'src/enums/auth.enums';
import { CreateSubscriptionDto } from 'src/user/dto/create-subscription.dto';
import { Transaction } from 'src/subscription/models/transaction.model';
import { User, UserDocument } from 'src/user/models/user.model';
import Stripe from 'stripe';
// import {
//   BusinessProfile,
//   BusinessProfileDocument,
// } from 'src/business-profile/models/businessProfile.model';
import {
  Subscription,
  SubscriptionDocument,
} from 'src/subscription/models/subscription.model';
import dayjs from 'dayjs';
import { SubscriptionSource, SubscriptionStatus } from 'src/enums/user.enum';
import {
  WebhookSnapshot,
  WebhookSnapshotDocument,
} from 'src/user/models/webhook.model';
import { Business, BusinessDocument } from 'src/business/model/business.model';
import { SubscriptionService } from 'src/subscription/subscription.service';
import { SubscriptionPrice } from '../models/subscription-price.model';
import { Coupon } from '../models/coupon.model';
import {
  PricingModel,
  SubscriptionProduct,
} from '../models/subscription-product.model';
import { CreateCouponDto } from './dtos/create-coupon.dto';
import { UpgradePlanDto } from './dtos/upgrage-plan.dto';
import { BusinessStatus } from 'src/business/enums/business.enum';
import {
  ConsumerPurchase,
  ConsumerPurchaseStatus,
} from '../models/consumer-purchase.model';
import { CreateFlashDealPaymentIntentDto } from './dtos/stripe-connect-charge.dto';
import { Event, EventDocument } from 'src/event/models/event.model';
import { EventTypes } from 'src/enums/event.enums';

@Injectable()
export class StripeService {
  constructor(
    @InjectStripe() private readonly stripe: Stripe,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Transaction.name)
    private readonly transactionModel: Model<Transaction>,
    @InjectModel(Business.name)
    private readonly businessModel: Model<BusinessDocument>,
    @InjectModel(Subscription.name)
    private readonly subscriptionModel: Model<SubscriptionDocument>,
    @InjectModel(WebhookSnapshot.name)
    private readonly webhookSnapshotModel: Model<WebhookSnapshotDocument>,
    @InjectModel(SubscriptionPrice.name)
    private readonly subscriptionPriceModel: Model<SubscriptionPrice>,
    @InjectModel(SubscriptionProduct.name)
    private readonly subscriptionProductModel: Model<SubscriptionProduct>,
    @InjectModel(Coupon.name) private readonly couponModel: Model<Coupon>,
    @InjectModel(ConsumerPurchase.name)
    private readonly consumerPurchaseModel: Model<ConsumerPurchase>,
    @InjectModel(Event.name) private readonly eventModel: Model<EventDocument>,
  ) {}

  public constructEventFromPayload(
    payload: Buffer,
    signature: string,
    endpointSecret: string,
  ): Stripe.Event {
    console.log('Payload for webhook verification...............');
    try {
      return Stripe.webhooks.constructEvent(payload, signature, endpointSecret);
    } catch (err: any) {
      throw new Error(
        `⚠️  Webhook signature verification failed11111111111: ${err.message}`,
      );
    }
  }

  async createCustomer(email: string, name: string) {
    return await this.stripe.customers.create({
      email,
      name,
    });
  }
  // // Save a card to a customer in Stripe
  // async createPaymentMethod(customerId: string, paymentMethodId: string) {
  //   return await this.stripe.paymentMethods.attach(paymentMethodId, {
  //     customer: customerId,
  //   });
  // }

  async retrievePaymentMethods(customerId: string) {
    return await this.stripe.paymentMethods.list({
      customer: customerId,
      type: 'card',
    });
  }

  async removePaymentMethod(paymentMethodId: string) {
    return await this.stripe.paymentMethods.detach(paymentMethodId);
  }

  async findAllSubscriptions(): Promise<Subscription[]> {
    return await this.subscriptionModel
      .find()
      .populate('user')
      .populate('business')
      .populate('product')
      .populate('transaction')
      .exec();
  }

  async getSubscriptionProducts() {
    const products = await this.stripe.products.list({
      active: true,
    });
    return await Promise.all(
      products.data.map(async (product) => {
        const prices = await this.stripe.prices.list({
          active: true,
          product: product.id,
        });
        return {
          ...product,
          prices: prices.data,
        };
      }),
    );
  }

  async createProduct(name: string, metadata: any, description?: string) {
    return await this.stripe.products.create({
      name,
      description,
      active: true,
      metadata: metadata as Stripe.MetadataParam,
    });
  }

  async editProduct(productId: string, updates: Stripe.ProductUpdateParams) {
    // Ensure default_price is only a string if present
    return await this.stripe.products.update(productId, updates);
  }

  async deactivateProduct(productId: string) {
    return await this.stripe.products.update(productId, {
      active: false,
    });
  }

  async updateProductMetadata(
    productId: string,
    metadata: Record<string, string>,
  ) {
    return await this.stripe.products.update(productId, {
      metadata,
    });
  }

  async getProducts(): Promise<Stripe.Product[]> {
    const products = await this.stripe.products.list({
      active: true,
      limit: 100,
      expand: ['data.default_price'],
    });
    return products.data;
  }

  async createPrice(params: {
    productId: string;
    unitAmount: number;
    currency: string;
    interval: 'month' | 'year';
    trialPeriodDays?: number;
    nickname?: string;
    metadata?: Record<string, string>;
  }) {
    const {
      productId,
      unitAmount,
      currency,
      interval,
      trialPeriodDays,
      nickname,
      metadata,
    } = params;
    const priceCreateParams: any = {
      product: productId,
      unit_amount: unitAmount,
      currency,
      recurring: {
        interval,
      },
      billing_scheme: 'per_unit',
    };
    if (nickname) {
      priceCreateParams.nickname = params.nickname;
    }
    if (metadata) {
      priceCreateParams.metadata = params.metadata;
    }
    return await this.stripe.prices.create(priceCreateParams);
  }

  async updatePriceMetadata(priceId: string, metadata: Record<string, string>) {
    return await this.stripe.prices.update(priceId, {
      metadata,
    });
  }

  /** Updates amount for a given currency.
   * If the currency matches the top-level currency of the Price, Stripe requires creating a new Price.
   * Returns the active Price to use going forward (new or updated).
   */
  async upsertPriceAmount(
    priceId: string,
    currency: string,
    unit_amount: number,
    opts?: {
      deactivateOld?: boolean; // default true
      copyLookupKey?: boolean; // copy old lookup_key to new Price
      newLookupKeySuffix?: string; // e.g. "-v2"
      prorationBehavior?: Stripe.SubscriptionUpdateParams.ProrationBehavior; // when switching subscriptions
    },
  ) {
    const settings = {
      deactivateOld: true,
      copyLookupKey: true,
      newLookupKeySuffix: '-v2',
      prorationBehavior: 'none' as const,
      ...(opts || {}),
    };

    const price = await this.stripe.prices.retrieve(priceId, {
      expand: ['recurring'],
    });

    const target = currency.toLowerCase();
    const isTopLevelCurrency = price.currency === target;

    // Case A: same as top-level currency -> must create a new Price
    if (isTopLevelCurrency) {
      const newPrice = await this.stripe.prices.create({
        product:
          typeof price.product === 'string' ? price.product : price.product.id,
        currency: target,
        unit_amount,
        nickname: price.nickname ?? undefined,
        tax_behavior: price.tax_behavior ?? undefined,
        billing_scheme: price.billing_scheme ?? undefined,
        // copy recurring settings if any (for subscriptions)
        ...(price.type === 'recurring' && price.recurring
          ? {
              recurring: {
                interval: price.recurring.interval,
                interval_count: price.recurring.interval_count ?? undefined,
                usage_type: price.recurring.usage_type ?? undefined,
                trial_period_days:
                  price.recurring.trial_period_days ?? undefined,
              },
            }
          : {}),
        metadata: price.metadata ?? {},
        lookup_key:
          settings.copyLookupKey && price.lookup_key
            ? `${price.lookup_key}${settings.newLookupKeySuffix}`
            : undefined,
      });

      if (settings.deactivateOld) {
        await this.stripe.prices.update(price.id, { active: false });
      }

      return { price: newPrice, createdNew: true };
    }

    // Case B: multi-currency price updating a non-top-level currency option
    const updated = await this.stripe.prices.update(priceId, {
      currency_options: { [target]: { unit_amount } },
    });

    return { price: updated, createdNew: false };
  }

  /** Replace the price on a subscription item */
  async switchSubscriptionItemPrice(
    subscriptionItemId: string,
    newPriceId: string,
    prorationBehavior: Stripe.SubscriptionItemUpdateParams.ProrationBehavior = 'none',
    quantity?: number,
  ) {
    return this.stripe.subscriptionItems.update(subscriptionItemId, {
      price: newPriceId,
      proration_behavior: prorationBehavior,
      ...(quantity !== undefined ? { quantity } : {}),
    });
  }

  /** Ensure Stripe customer exists for the business */
  private async ensureStripeCustomer(businessId: string): Promise<string> {
    const business = await this.businessModel.findById(businessId);
    if (!business) {
      throw new Error(`Business with ID ${businessId} not found`);
    }
    if (business.stripeCustomerId) return business.stripeCustomerId;

    const customer = await this.stripe.customers.create({
      name: business.name ?? undefined,
      email: business.email || business.email || undefined,
      metadata: { businessId: String(business._id) },
    });

    business.stripeCustomerId = customer.id;
    await business.save();
    return customer.id;
  }

  /** Create a hosted Checkout session (mode: subscription) */
  async createCheckoutSession(params: {
    businessId: string;
    productId: string;
    priceId: string;
    quantity?: number;
    successUrl: string;
    cancelUrl: string;
    couponCode?: string;
  }): Promise<{ url: string }> {
    const {
      businessId,
      productId,
      priceId,
      successUrl,
      cancelUrl,
      couponCode,
    } = params;

    const business = await this.businessModel.findById(businessId);
    if (!business) throw new NotFoundException('Business not found');

    const productDoc = await this.subscriptionProductModel.findById(productId);
    if (!productDoc)
      throw new NotFoundException('Subscription product not found');

    if (productDoc.pricingModel === 'per_location') {
      if (
        !params.quantity ||
        params.quantity < productDoc.minLocations ||
        params.quantity > productDoc.maxLocations!
      ) {
        throw new BadRequestException(
          'Quantity must be between min and max locations allowed for this product',
        );
      }
    } else if (productDoc.pricingModel === 'flat') {
      params.quantity = 1;
    }

    const customerId = await this.ensureStripeCustomer(business.id);
    const priceDoc = await this.subscriptionPriceModel.findById(priceId);
    if (!priceDoc) throw new NotFoundException('Subscription price not found');
    const price = await this.stripe.prices.retrieve(priceDoc.stripePriceId, {
      expand: ['product'],
    });
    if (!price.active || price.type !== 'recurring') {
      throw new BadRequestException('Invalid subscription price');
    }

    let discounts: Stripe.Checkout.SessionCreateParams.Discount[] | undefined;

    if (couponCode) {
      const coupon = await this.couponModel.findOne({ code: couponCode });
      if (!coupon) {
        throw new BadRequestException('Invalid coupon code');
      }
      if (coupon.isBlacklisted) {
        throw new BadRequestException('This coupon code is not valid');
      }
      if (coupon.redeemBy && dayjs().isAfter(dayjs(coupon.redeemBy))) {
        throw new BadRequestException('This coupon code has expired');
      }
      if (coupon.maxRedemptions && coupon.usedCount >= coupon.maxRedemptions) {
        throw new BadRequestException(
          'This coupon code has reached its maximum redemptions',
        );
      }

      //stripe discount
      discounts = [{ coupon: couponCode }];
    }

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: price.id, quantity: params.quantity || 1 }],
      discounts,
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      metadata: {
        businessId: String(business._id),
      },
      subscription_data: {
        metadata: { businessId: String(business._id), priceId: price.id },
        // billing_cycle_anchor: Math.floor(Date.now() / 1000),
        // proration_behavior: 'none',
      },

      // ui_mode: 'hosted',
      // Optional extras:
      // allow_promotion_codes: true, // if you want user-entered codes instead
      // automatic_tax: { enabled: true }, // if Stripe Tax configured
      // billing_address_collection: 'auto',
      // customer_update: { address: 'auto' },
      // tax_id_collection: { enabled: true }, // if you collect VAT/GST
    };
    const idempotencyKey = `checkout:${crypto.randomUUID()}`;
    try {
      const session = await this.stripe.checkout.sessions.create(
        sessionParams,
        {
          idempotencyKey,
        },
      );
      if (!session.url)
        throw new InternalServerErrorException(
          'Stripe returned no session URL',
        );
      return { url: session.url };
    } catch (err: any) {
      throw new InternalServerErrorException(
        `Stripe session error: ${err.message}`,
      );
    }
  }

  async fetchCheckoutSession(sessionId: string) {
    try {
      const session = await this.stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['customer', 'subscription', 'payment_intent'],
      });
      return session;
    } catch (err: any) {
      throw new InternalServerErrorException(
        `Stripe session fetch error: ${err.message}`,
      );
    }
  }

  /** Webhook: verify signature, store snapshot, fan-out handling */
  async handleStripeWebhook(event: Stripe.Event) {
    // Save raw snapshot (optional but recommended for audit)
    console.log('Saving webhook snapshot for event:', event.type);
    const createdSnapshot = await this.webhookSnapshotModel.create({
      source: 'stripe',
      data: event,
    });
    console.log(
      `Webhook snapshot saved with ID: ${createdSnapshot._id} for event: ${event.type}`,
    );

    // Route by event type
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await this.onCheckoutCompleted(session);
        break;
      }
      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        await this.onInvoicePaid(invoice);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await this.onPaymentSucceeded(invoice);
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await this.onInvoiceFailed(invoice);
        break;
      }
      case 'customer.subscription.created': {
        const sub = event.data.object as Stripe.Subscription;
        await this.onSubscriptionCreated(sub);
        break;
      }
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        await this.onSubscriptionUpdated(sub);
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        await this.onSubscriptionDeleted(sub);
        break;
      }
      case 'payment_intent.created': {
        const pi = event.data.object as Stripe.PaymentIntent;
        await this.onFlashDealPaymentCreated(pi);
        break;
      }
      case 'payment_intent.succeeded': {
        const pi = event.data.object as Stripe.PaymentIntent;
        await this.paymentIntentSucceeded(pi);
        break;
      }
      case 'payment_intent.payment_failed': {
        const pi = event.data.object as Stripe.PaymentIntent;
        await this.onFlashDealPaymentFailed(pi);
        break;
      }
      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        await this.chargeRefunded(charge);
        break;
      }
      case 'account.updated': {
        const acct = event.data.object as Stripe.Account;
        await this.onConnectAccountUpdated(acct);
        break;
      }

      // Optional but useful for Connect onboarding completion
      // case 'account.updated': {
      //   const account = event.data.object as Stripe.Account;
      //   await this.onConnectAccountUpdated(account);
      //   break;
      // }
      default:
        // noop
        break;
    }
  }

  async handleStripeConnectWebhook(event: Stripe.Event) {
    // Save raw snapshot (optional but recommended for audit)
    console.log('Saving webhook snapshot for event:', event.type);
    const createdSnapshot = await this.webhookSnapshotModel.create({
      source: 'stripe',
      data: event,
    });
    console.log(
      `Webhook snapshot saved with ID: ${createdSnapshot._id} for event: ${event.type}`,
    );

    // Route by event type
    switch (event.type) {

      case 'payment_intent.created': {
          const pi = event.data.object as Stripe.PaymentIntent;
        await this.paymentIntentCreated(pi);
        break;
      }

      case 'payment_intent.succeeded': {
        const pi = event.data.object as Stripe.PaymentIntent;
        await this.paymentIntentSucceeded(pi);
        break;
      }
      case 'payment_intent.payment_failed': {
        const pi = event.data.object as Stripe.PaymentIntent;
        await this.onFlashDealPaymentFailed(pi);
        break;
      }

      case 'charge.succeeded': {
        const charge = event.data.object as Stripe.Charge;
        await this.chargeSucceeded(charge);
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        await this.chargeRefunded(charge);
        break;
      }

      case 'account.updated': {
        const acct = event.data.object as Stripe.Account;
        await this.onConnectAccountUpdated(acct);
        break;
      }
      case 'account.external_account.updated': {
        const acct = event.data.object as Stripe.ExternalAccount;
        await this.externalAccountUpdate(acct);
      }

      // Optional but useful for Connect onboarding completion
      // case 'account.updated': {
      //   const account = event.data.object as Stripe.Account;
      //   await this.onConnectAccountUpdated(account);
      //   break;
      // }
      default:
        // noop
        break;
    }
  }
  private async externalAccountUpdate(account: Stripe.ExternalAccount) {
    const accountId = account.account;
    const business = await this.businessModel.findOne({
      stripeAccountId: accountId,
    });
    const isBankAccount = account?.object === 'bank_account';
    await this.businessModel.updateOne(
      { _id: business._id },
      {
        $set: {
          stripeAccountStatus: {
            bank_name: isBankAccount
              ? ((account as Stripe.BankAccount).bank_name ?? '')
              : '',
            last4: account?.last4 ?? '',
          },
        },
      },
    );
  }

  private async onConnectAccountUpdated(account: Stripe.Account) {
    const businessId = account.metadata?.businessId;
    if (!businessId) return;

    const requirementsDue = account.requirements?.currently_due?.length ?? 0;

    const onboardingComplete =
      !!account.details_submitted &&
      !!account.charges_enabled &&
      !!account.payouts_enabled &&
      requirementsDue === 0;

    const firstExternalAccount = account.external_accounts?.data[0];
    const isBankAccount = firstExternalAccount?.object === 'bank_account';

    await this.businessModel.updateOne(
      { _id: businessId },
      {
        $set: {
          stripeOnboardingComplete: onboardingComplete,
          stripeAccountStatus: {
            charges_enabled: account.charges_enabled,
            payouts_enabled: account.payouts_enabled,
            details_submitted: account.details_submitted,
            currently_due: account.requirements?.currently_due ?? [],
            disabled_reason: account.requirements?.disabled_reason ?? null,
            bank_name: isBankAccount
              ? ((firstExternalAccount as Stripe.BankAccount).bank_name ?? '')
              : '',
            last4: firstExternalAccount?.last4 ?? '',
          },
        },
      },
    );
  }

  /** When hosted checkout completes */
  private async onCheckoutCompleted(session: Stripe.Checkout.Session) {
    console.log('Checkout completed for session:::', session);
    // console.log('Checkout completed for session:::', JSON.stringify(session));
    const customerId = session.customer as string | null;
    const subscriptionId = session.subscription as string | null;
    const businessId = session.metadata?.businessId;
    const couponId = session.metadata?.couponId;
    console.log('Customer ID from session metadata: ', customerId);
    console.log('Subscription ID from session metadata: ', subscriptionId);
    console.log(`Coupon ID from session metadata: ${couponId}`);
    console.log(`Business ID from session metadata: ${businessId}`);
    if (!customerId || !subscriptionId || !businessId) return;

    console.log('Checkout completed - processing subscription... 1 ');

    // Find or create our internal Subscription record
    // Map Stripe price -> internal product/price if needed (you have that mapping).
    const stripeSub = await this.stripe.subscriptions.retrieve(subscriptionId);

    const priceId = stripeSub.items.data[0]?.price?.id as string | undefined;
    console.log('Price ID from subscription items: ', priceId);
    if (!priceId) return;
    const internalSubPrice = await this.subscriptionPriceModel.findOne({
      stripePriceId: priceId,
    });
    if (!internalSubPrice) return;
    console.log('Checkout completed - processing subscription... 1 ');

    const invoice = await this.stripe.invoices.retrieve(
      stripeSub.latest_invoice as string,
    );
    // const paymentMethod = stripeSub.default_payment_method;
    // await this.stripe.customers.update(customerId, {
    //   invoice_settings: {
    //     default_payment_method:
    //       typeof paymentMethod === 'string'
    //         ? paymentMethod
    //         : paymentMethod?.id || undefined,
    //   },
    // });
    console.log('SESSIONNN ID:', session.id);
    const fullSession = await this.stripe.checkout.sessions.retrieve(
      session.id,
      {
        expand: ['invoice', 'invoice.payment_intent', 'subscription'],
      },
    );
    // console.log("FULL SESSIONNNN:",JSON.stringify(fullSession));
    const invoice2 = fullSession.invoice as Stripe.Invoice;
    const pi = invoice2.payment_intent as Stripe.PaymentIntent;

    const pm = pi.payment_method as string;

    await this.stripe.customers.update(fullSession.customer as string, {
      invoice_settings: { default_payment_method: pm },
    });

    await this.stripe.subscriptions.update(subscriptionId as string, {
      default_payment_method: pm,
    });

    // Here, you likely have SubscriptionPrice documents with stripePriceId; fetch them:
    const internalSub = await this.subscriptionModel.findOneAndUpdate(
      { stripeSubscriptionId: subscriptionId },
      {
        business: new mongoose.Types.ObjectId(businessId),
        status: SubscriptionStatus.ACTIVE,
        price: internalSubPrice._id,
        product: internalSubPrice.product,
        startDate: new Date((stripeSub.current_period_start || 0) * 1000),
        endDate: new Date((stripeSub.current_period_end || 0) * 1000),
        invoiceStartDate: new Date(
          (stripeSub.current_period_start || 0) * 1000,
        ),
        invoiceEndDate: new Date((stripeSub.current_period_end || 0) * 1000),
        stripeSubscriptionId: subscriptionId,
        isTrialActive: false,
        locationsAllowed:
          internalSubPrice.pricingModel === PricingModel.FLAT
            ? internalSubPrice.maxLocations
            : invoice.lines?.data?.[0]?.quantity,
        // Optionally also store stripe customer on Business (already done in ensure)
      },
      { upsert: true, new: true },
    );
    await this.businessModel.updateOne(
      { _id: new mongoose.Types.ObjectId(businessId) },
      {
        $set: {
          activeSubscription: new mongoose.Types.ObjectId(internalSub.id),
          status: BusinessStatus.SUBSCRIPTION,
        },
      },
    );

    // Upsert by stripeInvoiceId to make it idempotent
    await this.transactionModel.updateOne(
      { stripeInvoiceId: invoice.id }, // unique key
      {
        $setOnInsert: {
          description: `Initial invoice (pending) for subscription ${subscriptionId}`,
          amountMinor: invoice.total, // prefer storing minor units; or amount: invoice.total/100
          currency: invoice.currency?.toUpperCase(), // normalize 'usd' -> 'USD'
          quantity: invoice.lines?.data?.[0]?.quantity ?? 1,
          business: new mongoose.Types.ObjectId(businessId),
          status: TransactionStatus.PENDING,
          subscription: internalSub._id, // <-- use internal subscription _id
          platform: SubscriptionSource.STRIPE,
          transactionDate: new Date(
            (invoice.created ?? Date.now() / 1000) * 1000,
          ),
          success: false,
          startDate: invoice.lines?.data?.[0]?.period?.start
            ? new Date(invoice.lines.data[0].period.start * 1000)
            : undefined,
          endDate: invoice.lines?.data?.[0]?.period?.end
            ? new Date(invoice.lines.data[0].period.end * 1000)
            : undefined,
          stripeInvoiceId: invoice.id,
          stripeSubscriptionId: subscriptionId,
        },
      },
      { upsert: true },
    );
  }

  private async onInvoicePaid(invoice: Stripe.Invoice) {
    // invoice.subscription, invoice.customer, invoice.total, invoice.currency, invoice.id
    const subscriptionId = invoice.subscription as string | null;
    if (!subscriptionId) return;

    const internalSub = await this.subscriptionModel.findOneAndUpdate(
      { stripeSubscriptionId: subscriptionId },
      {
        status: SubscriptionStatus.ACTIVE,
        endDate: invoice.lines?.data?.[0]?.period?.end
          ? new Date(invoice.lines.data[0].period.end * 1000)
          : undefined,
      },
    );

    let updateObj = {
      description: `Invoice paid for subscription ${subscriptionId}`,
      amountMinor: invoice.total, // or amount: invoice.total/100
      currency: invoice.currency?.toUpperCase(),
      // quantity: invoice.lines?.data?.[0]?.quantity ?? 1,
      quantity:
        invoice.lines?.data?.[invoice.lines.data.length - 1]?.quantity ?? 1,
      status: TransactionStatus.SUCCESS, // mark success now
      success: true,
      transactionDate: invoice.status_transitions?.paid_at
        ? new Date(invoice.status_transitions.paid_at * 1000)
        : new Date(),
      startDate: invoice.lines?.data?.[0]?.period?.start
        ? new Date(invoice.lines.data[0].period.start * 1000)
        : undefined,
      endDate: invoice.lines?.data?.[0]?.period?.end
        ? new Date(invoice.lines.data[0].period.end * 1000)
        : undefined,
    };

    if (invoice.discount && invoice.discount.coupon) {
      const couponCode = invoice.discount.coupon.id;
      const coupon = await this.couponModel.findOne({ code: couponCode });
      if (coupon) {
        await this.couponModel.updateOne(
          { _id: coupon._id },
          {
            $addToSet: { usedBy: internalSub.business },
            $inc: { usedCount: 1 },
          },
        );
        updateObj['coupon'] = coupon._id;
      }
    }
    await this.transactionModel.updateOne(
      { stripeInvoiceId: invoice.id },
      {
        $set: {
          ...updateObj,
        },
        $setOnInsert: {
          platform: SubscriptionSource.STRIPE,
          stripeSubscriptionId: subscriptionId,
        },
      },
      { upsert: true },
    );
  }

  private async onInvoiceFailed(invoice: Stripe.Invoice) {
    const subscriptionId = invoice.subscription as string | null;
    if (!subscriptionId) return;

    await this.subscriptionModel.findOneAndUpdate(
      { stripeSubscriptionId: subscriptionId },
      { status: SubscriptionStatus.PAST_DUE },
    );
    // Optionally notify the business to update payment method
  }

  private async onSubscriptionDeleted(sub: Stripe.Subscription) {
    await this.subscriptionModel.findOneAndUpdate(
      { stripeSubscriptionId: sub.id },
      { status: SubscriptionStatus.EXPIRED, endDate: new Date() },
    );
  }

  private async onSubscriptionCreated(sub: Stripe.Subscription) {
    await this.subscriptionModel.findOneAndUpdate(
      { stripeSubscriptionId: sub.id },
      {
        status:
          sub.status === 'active'
            ? SubscriptionStatus.ACTIVE
            : sub.status === 'past_due'
              ? SubscriptionStatus.PAST_DUE
              : sub.status === 'canceled'
                ? SubscriptionStatus.CANCELLED
                : SubscriptionStatus.EXPIRED,
        startDate: sub.current_period_start
          ? new Date(sub.current_period_start * 1000)
          : undefined,
        endDate: sub.current_period_end
          ? new Date(sub.current_period_end * 1000)
          : undefined,
        locationsAllowed: sub.items.data[0]?.quantity,
      },
    );
  }

  private async onSubscriptionUpdated(sub: Stripe.Subscription) {
    const newProduct = await this.subscriptionProductModel.findOne({
      stripeProductId: sub.items.data[0]?.price.product as string,
    });
    const newPrice = await this.subscriptionPriceModel.findOne({
      stripePriceId: sub.items.data[0]?.price.id as string,
    });
    if (newProduct && newPrice) {
      await this.subscriptionModel.findOneAndUpdate(
        { stripeSubscriptionId: sub.id },
        {
          status:
            sub.status === 'active'
              ? SubscriptionStatus.ACTIVE
              : sub.status === 'past_due'
                ? SubscriptionStatus.PAST_DUE
                : sub.status === 'canceled'
                  ? SubscriptionStatus.CANCELLED
                  : SubscriptionStatus.EXPIRED,
          endDate: sub.current_period_end
            ? new Date(sub.current_period_end * 1000)
            : undefined,
          locationsAllowed: sub.items.data[0]?.quantity,
          product: newProduct._id,
          price: newPrice._id,
        },
      );
    }
  }

  private async onPaymentSucceeded(invoice: Stripe.Invoice) {
    // invoice.subscription, invoice.customer, invoice.total, invoice.currency, invoice.id
    const subscriptionId = invoice.subscription as string | null;
    if (!subscriptionId) return;

    const internalSub = await this.subscriptionModel.findOneAndUpdate(
      { stripeSubscriptionId: subscriptionId },
      {
        status: SubscriptionStatus.ACTIVE,
        endDate: invoice.lines?.data?.[0]?.period?.end
          ? new Date(invoice.lines.data[0].period.end * 1000)
          : undefined,
      },
    );

    let updateObj = {
      description: `Invoice paid for subscription ${subscriptionId}`,
      amountMinor: invoice.total, // or amount: invoice.total/100
      currency: invoice.currency?.toUpperCase(),
      // quantity: invoice.lines?.data?.[0]?.quantity ?? 1,
      quantity:
        invoice.lines?.data?.[invoice.lines.data.length - 1]?.quantity ?? 1,
      status: TransactionStatus.SUCCESS, // mark success now
      success: true,
      transactionDate: invoice.status_transitions?.paid_at
        ? new Date(invoice.status_transitions.paid_at * 1000)
        : new Date(),
      startDate: invoice.lines?.data?.[0]?.period?.start
        ? new Date(invoice.lines.data[0].period.start * 1000)
        : undefined,
      endDate: invoice.lines?.data?.[0]?.period?.end
        ? new Date(invoice.lines.data[0].period.end * 1000)
        : undefined,
    };

    if (invoice.discount && invoice.discount.coupon) {
      const couponCode = invoice.discount.coupon.id;
      const coupon = await this.couponModel.findOne({ code: couponCode });
      if (coupon) {
        await this.couponModel.updateOne(
          { _id: coupon._id },
          {
            $addToSet: { usedBy: internalSub.business },
            $inc: { usedCount: 1 },
          },
        );
        updateObj['coupon'] = coupon._id;
      }
    }
    await this.transactionModel.updateOne(
      { stripeInvoiceId: invoice.id },
      {
        $set: {
          ...updateObj,
        },
        $setOnInsert: {
          platform: SubscriptionSource.STRIPE,
          stripeSubscriptionId: subscriptionId,
        },
      },
      { upsert: true },
    );
  }

  private async onFlashDealPaymentCreated(pi: Stripe.PaymentIntent) {
    // Only process FlashDeal payments
    if (pi.metadata?.type !== 'FLASHDEAL') return;

    const paymentIntentId = pi.id;

    // Create a new purchase record in DB
    await this.consumerPurchaseModel.create({
      consumer: new mongoose.Types.ObjectId(pi.metadata.consumerId),
      flashDeal: new mongoose.Types.ObjectId(pi.metadata.flashDealId),
      paymentIntentId,
      amountMinor: pi.amount,
      currency: pi.currency.toUpperCase(),
      status: ConsumerPurchaseStatus.RESERVED,
      latestStripeSnapshot: pi,
    });
  }

  private async paymentIntentCreated(pi: Stripe.PaymentIntent) {
    // Only process FlashDeal payments
    if (pi.metadata?.type !== 'FLASHDEAL') return;
    const business = await this.businessModel.findOne({_id: new mongoose.Types.ObjectId(pi.metadata.businessId)});

    const paymentIntentId = pi.id;

    // Mark paid in DB
    await this.consumerPurchaseModel.updateOne(
      { paymentIntentId },
      {
        $set: {
          paymentIntentId: pi.id,
          stripeAccountId:business.stripeAccountId,
          status: ConsumerPurchaseStatus.REQUIRES_PAYMENT,
          latestStripeSnapshot: pi,
          chargeId:pi.latest_charge,
        },
      },
    );

    // Generate redemption token/QR etc (your logic)
    // await this.flashDealService.issueRedemption(pi.metadata.flashDealId, pi.metadata.consumerId);
  }
  private async paymentIntentSucceeded(pi: Stripe.PaymentIntent) {
    // Only process FlashDeal payments
    if (pi.metadata?.type !== 'FLASHDEAL') return;

    const paymentIntentId = pi.id;
    const consumerPurchase = await this.consumerPurchaseModel.findOne({_id: new mongoose.Types.ObjectId(pi.metadata.purchaseId)});


    // Mark paid in DB
    await this.consumerPurchaseModel.updateOne(
      { paymentIntentId,
         status: { $ne: ConsumerPurchaseStatus.PAID },
       },
      {
        $set: {
          status: ConsumerPurchaseStatus.PAID,
          paidAt: new Date(),
          latestStripeSnapshot: pi,
        },
      },
    );
    await this.eventModel.updateOne(
      { _id: pi.metadata.flashDealId },
      { $inc: { itemQuantity: -consumerPurchase.quantity } },
    );

    // Generate redemption token/QR etc (your logic)
    // await this.flashDealService.issueRedemption(pi.metadata.flashDealId, pi.metadata.consumerId);
  }

  private async onFlashDealPaymentFailed(pi: Stripe.PaymentIntent) {
    if (pi.metadata?.type !== 'FLASHDEAL') return;

    await this.consumerPurchaseModel.updateOne(
      { paymentIntentId: pi.id },
      {
        $set: {
          status: 'failed',
          failedAt: new Date(),
          latestStripeSnapshot: pi,
        },
      },
    );
  }

  private async chargeRefunded(charge: Stripe.Charge) {
    // charge.payment_intent can be string | PaymentIntent
    const piId =
      typeof charge.payment_intent === 'string'
        ? charge.payment_intent
        : charge.payment_intent?.id;

    if (!piId) return;

    // Optional: verify this belongs to a FlashDeal purchase
    const purchase = await this.consumerPurchaseModel.findOne({
      paymentIntentId: piId,
    });
    if (!purchase) return;
    await this.consumerPurchaseModel.updateOne(
      { paymentIntentId: piId },
      {
        $set: { status: 'refunded', refundedAt: new Date() },
      },
    );
  }
  private async chargeSucceeded(charge: Stripe.Charge) {
    // charge.payment_intent can be string | PaymentIntent
    const piId =
      typeof charge.payment_intent === 'string'
        ? charge.payment_intent
        : charge.payment_intent?.id;

    if (!piId) return;

    // Optional: verify this belongs to a FlashDeal purchase
    const purchase = await this.consumerPurchaseModel.findOne({
      paymentIntentId: piId,
    });
    if (!purchase) return;
    await this.consumerPurchaseModel.updateOne(
      { paymentIntentId: piId },
      {
        $set: { receipt:charge.receipt_url,latestStripeSnapshot: charge },
      },
    );
  }

  async createSubscription(
    customerId: string,
    data: CreateSubscriptionDto,
    dbSubscriptionId: any,
  ) {
    const { paymentMethodId, priceId } = data;
    let metadata = {};
    if (data.businessProfileId) {
      metadata = {
        businessProfileId: data.businessProfileId,
        businessProfile: data.businessProfileId,
        existingLocationCount: data.quantity,
        dbSubscriptionId: dbSubscriptionId.toString(),
        newLocationCount: data.quantity,
      };
    }
    await this.stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });
    const subscription = await this.stripe.subscriptions.create({
      customer: customerId,
      items: [
        {
          price: priceId,
          quantity: data.quantity,
        },
      ],
      payment_settings: {
        payment_method_options: {
          card: {
            request_three_d_secure: 'any',
          },
        },
        payment_method_types: ['card'],
        save_default_payment_method: 'on_subscription',
      },
      metadata,
      expand: ['latest_invoice.payment_intent'],
      default_payment_method: paymentMethodId,
      collection_method: 'charge_automatically',
      // days_until_due: 0,
      trial_period_days: Number(process.env.STRIPE_TRIAL_PERIOD_DAYS) || 30,
    });
    if (data.saveCard) {
      await this.userModel.updateOne(
        { stripeCustomerId: customerId },
        { $addToSet: { savedCards: paymentMethodId } },
      );
    }
    return subscription;
  }

  async fetchAndUpdateSubscriptionMetadata(subscriptionId, metadataUpdates) {
    try {
      // Fetch existing subscription details
      const existingSubscription =
        await this.stripe.subscriptions.retrieve(subscriptionId);
      console.log(
        'Existing subscription metadata:',
        existingSubscription.metadata,
      );

      // Update the subscription metadata
      const updatedSubscription = await this.stripe.subscriptions.update(
        subscriptionId,
        {
          metadata: {
            ...(existingSubscription.metadata || {}),
            ...metadataUpdates,
          },
        },
      );

      console.log(
        'Updated subscription metadata:',
        updatedSubscription.metadata,
      );

      return {
        before: existingSubscription,
        after: updatedSubscription,
      };
    } catch (error) {
      console.error('Error fetching or updating subscription metadata:', error);
      throw error;
    }
  }

  async createProrateSubscription(
    customerId: string,
    subscriptionId: string,
    data: CreateSubscriptionDto,
    dbSubscriptionId: string,
    existingLocationCount: number,
  ) {
    const { paymentMethodId, priceId } = data;
    await this.stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });
    const subscription = await this.retrieveSubscription(subscriptionId);
    const updatedExistingCount = Math.max(
      existingLocationCount,
      Number((subscription.metadata as any).existingLocationCount),
    );
    const currentQuantity = subscription.items.data[0].quantity;
    if (data.quantity == currentQuantity) {
      throw new Error('No location count change provided!');
    }

    const newQuantity = data.quantity;

    const maxPaidQuantity = parseInt(
      (subscription.metadata as any).existingLocationCount,
    );

    const isTrial = subscription.status === 'trialing';

    if (isTrial) {
      const updateParams = {
        items: [
          {
            id: subscription.items.data[0].id,
            price: priceId,
            quantity: data.quantity,
          },
        ],
        metadata: {
          dbSubscriptionId,
          businessProfile: data.businessProfileId,
          existingLocationCount: Math.max(newQuantity, updatedExistingCount),
          newLocationCount: data.quantity,
        },
      };

      await this.stripe.subscriptions.update(subscription.id, updateParams);
    } else if (newQuantity > maxPaidQuantity) {
      const { scheduleId, scheduleStartDate, scheduleEndDate } =
        subscription.metadata;
      const startDate = Number(scheduleStartDate);
      const endDate = Number(scheduleEndDate);

      const currentTime = Math.floor(Date.now() / 1000);
      let schedule: Stripe.Response<Stripe.SubscriptionSchedule> | null = null;
      if (!scheduleId || (scheduleId && currentTime >= endDate)) {
        schedule = await this.stripe.subscriptionSchedules.create({
          from_subscription: subscriptionId,
        });
      }

      await this.stripe.subscriptions.update(subscription.id, {
        items: [
          {
            id: subscription.items.data[0].id,
            price: priceId,
            quantity: data.quantity,
          },
        ],
        proration_behavior:
          subscription.status !== 'trialing'
            ? 'always_invoice'
            : 'create_prorations',
        proration_date:
          subscription.status !== 'trialing' &&
          updatedExistingCount > data.quantity
            ? subscription.current_period_end
            : undefined,
        metadata: {
          dbSubscriptionId,
          businessProfile: data.businessProfileId,
          existingLocationCount: Math.max(newQuantity, updatedExistingCount),
          newLocationCount: newQuantity,
          scheduleStartDate: schedule
            ? schedule.current_phase.start_date
            : startDate,
          scheduleEndDate: schedule ? schedule.current_phase.end_date : endDate,
          scheduleId: schedule ? schedule.id : scheduleId,
        },
      });

      await this.stripe.subscriptionSchedules.update(
        schedule ? schedule.id : scheduleId,
        {
          phases: [
            {
              items: [{ price: priceId, quantity: newQuantity }], // Current phase remains at 4 locations
              start_date: schedule
                ? schedule.current_phase.start_date
                : startDate,
              end_date: schedule ? schedule.current_phase.end_date : endDate, // Ends immediately, without modifying the current period
            },
            {
              items: [{ price: priceId, quantity: newQuantity }], // Future phase sets to 3 locations
              iterations: 1, // One billing cycle at 3 locations
            },
          ],
        },
      );
    } else {
      const { scheduleId, scheduleStartDate, scheduleEndDate } =
        subscription.metadata;
      const startDate = Number(scheduleStartDate);
      const endDate = Number(scheduleEndDate);

      const currentTime = Math.floor(Date.now() / 1000);
      let schedule: Stripe.Response<Stripe.SubscriptionSchedule> | null = null;
      if (!scheduleId || (scheduleId && currentTime >= endDate)) {
        schedule = await this.stripe.subscriptionSchedules.create({
          from_subscription: subscriptionId,
        });
      }

      await this.fetchAndUpdateSubscriptionMetadata(subscription.id, {
        scheduleStartDate: schedule
          ? schedule.current_phase.start_date
          : startDate,
        scheduleEndDate: schedule ? schedule.current_phase.end_date : endDate,
        scheduleId: schedule ? schedule.id : scheduleId,
        newLocationCount: newQuantity,
      });

      await this.stripe.subscriptionSchedules.update(
        schedule ? schedule.id : scheduleId,
        {
          phases: [
            {
              items: [{ price: priceId, quantity: maxPaidQuantity }], // Current phase remains at 4 locations
              start_date: schedule
                ? schedule.current_phase.start_date
                : startDate,
              end_date: schedule ? schedule.current_phase.end_date : endDate, // Ends immediately, without modifying the current period
            },
            {
              items: [{ price: priceId, quantity: newQuantity }], // Future phase sets to 3 locations
              iterations: 1, // One billing cycle at 3 locations
            },
          ],
        },
      );

      console.log('Subscription schedule created:', schedule);
    }

    if (data.saveCard) {
      await this.userModel.updateOne(
        { stripeCustomerId: customerId },
        { $addToSet: { savedCards: paymentMethodId } },
      );
    }
    return subscription;
  }

  async retrieveSubscriptions(customerId: string) {
    return await this.stripe.subscriptions.list({
      customer: customerId,
    });
  }

  async retrieveSubscription(subscriptionId: string) {
    return await this.stripe.subscriptions.retrieve(subscriptionId);
  }

  async cancelSubscription(businessId: string) {
    const business = await this.businessModel.findById(businessId);
    if (!business) {
      return {
        success: false,
        message: 'Business Not found',
      };
    }
    const activeSub = await this.subscriptionModel.findOne({
      _id: new mongoose.Types.ObjectId(business.activeSubscription),
    });
    if (!activeSub || !activeSub.stripeSubscriptionId) {
      return {
        success: false,
        message: 'Active Subscription not found',
      };
    }

    const data = await this.stripe.subscriptions.cancel(
      activeSub.stripeSubscriptionId,
    );
    console.log('cancel subscription data:', data);
    if (data && data.id) {
      await this.subscriptionModel.updateOne(
        { _id: new mongoose.Types.ObjectId(business.activeSubscription) },
        { $set: { isCancelled: true } },
      );
      return {
        sucess: true,
        message: 'Subscription cancelled',
      };
    }

    return {
      success: true,
      message: 'Technical Problem in cancelling your subscription',
    };
  }

  async retriveInvoicesOfSubscription(subscriptionId: string) {
    return await this.stripe.invoices.list({
      subscription: subscriptionId,
    });
  }

  async webhook(event: Stripe.Event) {
    console.log(`Received event: `, event);
    await this.webhookSnapshotModel.create({
      snapshot: event,
    });
    try {
      switch (event.type) {
        //handle only the subscription events
        case 'invoice.payment_succeeded':
          {
            const latestInvoice = event.data.object as Stripe.Invoice;
            const user = await this.userModel.findOne({
              stripeCustomerId: latestInvoice.customer,
            });
            const {
              businessProfile,
              dbSubscriptionId,
              existingLocationCount,
              newLocationCount,
            } = latestInvoice.subscription_details.metadata;

            const subscription = await this.stripe.subscriptions.retrieve(
              latestInvoice.subscription.toString(),
            );

            if (subscription.status === 'trialing') {
              console.log('webhook: Subscription Trial Active');
              return;
            }
            await this.transactionModel.create({
              platform: SubscriptionSource.STRIPE,
              description: 'Subscription payment',
              amount: (latestInvoice.amount_paid / 100).toFixed(2),
              currency: latestInvoice.currency,
              quantity:
                existingLocationCount !== undefined &&
                newLocationCount !== undefined
                  ? Math.abs(
                      Number(existingLocationCount) - Number(newLocationCount),
                    ) || existingLocationCount
                  : 1,
              user: user._id,
              business: new mongoose.Types.ObjectId(businessProfile),
              status: TransactionStatus.SUCCESS,
              stripeInvoiceId: latestInvoice.id,
              subscription: new mongoose.Types.ObjectId(dbSubscriptionId),
              stripeSubscription: latestInvoice.subscription as any,
              invoiceFileUrl: latestInvoice.invoice_pdf,
              isForProrate: this.isInvoiceProrate(latestInvoice),
              stripeLogs: event,
              startDate: new Date(subscription.current_period_start * 1000),
              endDate: new Date(subscription.current_period_end * 1000),
            });

            if (businessProfile && newLocationCount !== undefined) {
              await this.businessModel.updateOne(
                { _id: new mongoose.Types.ObjectId(businessProfile) },
                {
                  // $addToSet: { subscriptions: createdSubscription._id },
                  $set: { locationCount: Number(newLocationCount) },
                },
              );
            }

            const subscriptionItem = subscription.items.data[0];
            const price = subscriptionItem.price;
            const recurring = price.recurring;
            // Fetch and display the current billing period
            const currentPeriodStart = subscription.current_period_start;
            const currentPeriodEnd = subscription.current_period_end;

            if (recurring) {
              const interval = recurring.interval; // month, year

              const startDate = new Date(currentPeriodStart * 1000);
              const endDate = new Date(currentPeriodEnd * 1000);
              const invoiceStartDate = endDate;
              const invoiceEndDate = dayjs(currentPeriodEnd * 1000)
                .add(1, interval)
                .toDate();

              // update date in subscription model
              await this.subscriptionModel.findOneAndUpdate(
                {
                  stripeSubscriptionId: subscription.id,
                },
                {
                  $set: {
                    startDate,
                    endDate,
                    invoiceEndDate,
                    invoiceStartDate,
                    status:
                      subscription.status === 'past_due' ||
                      subscription.status === 'incomplete'
                        ? SubscriptionStatus.PAUSED
                        : SubscriptionStatus.ACTIVE,
                  },
                },
              );
              await this.fetchAndUpdateSubscriptionMetadata(subscription.id, {
                existingLocationCount: Number(newLocationCount),
              });
            }
          }
          break;

        case 'invoice.payment_failed':
          {
            const failedInvoice = event.data.object as Stripe.Invoice;
            const failedUser = await this.userModel.findOne({
              stripeCustomerId: failedInvoice.customer,
            });
            const {
              businessProfileId,
              dbSubscriptionId,
              existingLocationCount,
              newLocationCount,
            } = failedInvoice.subscription_details.metadata;
            const failedSubscription = await this.stripe.subscriptions.retrieve(
              failedInvoice.subscription.toString(),
            );
            await this.transactionModel.create({
              platform: SubscriptionSource.STRIPE,
              description: 'Subscription payment',
              amount: (failedInvoice.amount_paid / 100).toFixed(2),
              currency: failedInvoice.currency,
              quantity:
                existingLocationCount !== undefined &&
                newLocationCount !== undefined
                  ? Math.abs(
                      Number(existingLocationCount) - Number(newLocationCount),
                    )
                  : 1,
              user: failedUser._id,
              business: new mongoose.Types.ObjectId(businessProfileId),
              status: TransactionStatus.FAILED,
              stripeInvoiceId: failedInvoice.id,
              subscription: new mongoose.Types.ObjectId(dbSubscriptionId),
              stripeSubscriptionId: failedInvoice.subscription as any,
              invoiceFileUrl: failedInvoice.invoice_pdf,
              isForProrate: this.isInvoiceProrate(failedInvoice),
              stripeLogs: event,
              startDate: new Date(
                failedSubscription.current_period_start * 1000,
              ),
              endDate: new Date(failedSubscription.current_period_end * 1000),
            });

            const subscription = await this.stripe.subscriptions.retrieve(
              failedInvoice.subscription.toString(),
            );
            if (
              subscription.status === 'past_due' ||
              subscription.status === 'incomplete'
            ) {
              await this.subscriptionModel.findOneAndUpdate(
                { stripeSubscriptionId: subscription.id },
                {
                  $set: {
                    status: SubscriptionStatus.PAUSED,
                  },
                },
              );
            }
          }
          break;
        case 'customer.subscription.updated':
          {
            const subscription = event.data.object;
            const updateObject: any = {};

            if (subscription.status === 'trialing') {
              // update business location count
              const quantity = (subscription as any).quantity;
              const dbSubscription = await this.subscriptionModel
                .findOne({ stripeSubscriptionId: subscription.id })
                .lean();
              if (!dbSubscription) {
                break;
              }
              const { business } = dbSubscription;

              console.log(
                `db subs, user, businesProfile`,
                dbSubscription,
                business,
              );
              if (business) {
                await this.businessModel.updateOne(
                  { _id: new mongoose.Types.ObjectId(business) },
                  {
                    $set: { locationCount: Number(quantity) },
                  },
                );
              }
            }

            if (subscription.status !== 'trialing') {
              // mark subscription trial as complete
              updateObject.isTrialActive = false;
            }

            if (
              subscription.status === 'past_due' ||
              subscription.status === 'incomplete'
            ) {
              // Handle subscription updates (e.g., upgrade success, pending status)
              // Handle pending or incomplete payment status
              updateObject.status = SubscriptionStatus.PAUSED;
            }

            if (Object.keys(updateObject).length > 0) {
              await this.subscriptionModel.findOneAndUpdate(
                { stripeSubscriptionId: subscription.id },
                {
                  $set: updateObject,
                },
              );
            }
          }
          break;
        default:
          console.log('Unhandled event', event.type);
          return 'unhandled event type';
      }
    } catch (err) {
      console.log('error: ', err);
    }
  }

  isInvoiceProrate(invoice: Stripe.Invoice): boolean {
    let isForProrate = false;
    // Check if the invoice has proration line items
    for (const lineItem of invoice.lines.data) {
      if (lineItem.proration) {
        isForProrate = true;
        break;
      }
    }
    return isForProrate;
  }

  async createCoupon(couponData: CreateCouponDto) {
    const {
      code,
      percentOff,
      amountOff,
      duration,
      durationInMonths,
      maxRedemptions,
      redeemBy,
    } = couponData;

    const couponParams: Stripe.CouponCreateParams = {
      id: code,
      duration: duration,
      duration_in_months: durationInMonths,
      max_redemptions: maxRedemptions,
    };

    if (couponData.type === 'percent' && percentOff) {
      couponParams.percent_off = percentOff;
    } else if (couponData.type === 'flat' && couponData.amountOff) {
      couponParams.amount_off = couponData.amountOff;
      couponParams.currency = 'usd'; // Set your desired currency
    }
    if (redeemBy) {
      couponParams.redeem_by = Math.floor(new Date(redeemBy).getTime() / 1000);
    }
    console.log('Creating coupon with params:', couponParams);

    try {
      const coupon = await this.stripe.coupons.create(couponParams);
      console.log('Created coupon:', coupon);
      return coupon;
    } catch (err: any) {
      throw new InternalServerErrorException(
        `Stripe coupon creation error: ${err.message}`,
      );
    }
  }

  async createCheckoutSessionForUpgradationPlan(
    businessId: string,
    data: UpgradePlanDto,
  ) {
    if (data.statusCode === 204) {
      if (!data.newProductId || !data.newPriceId) {
        throw new BadRequestException(
          'New Product ID and Price ID are required for upgrade',
        );
      }
    }
    if (data.statusCode === 205) {
      if (!data.quantity) {
        throw new BadRequestException(
          'Quantity is required for scaling locations',
        );
      }
    }
    if (data.statusCode === 206) {
      if (!data.newProductId || !data.newPriceId || !data.quantity) {
        throw new BadRequestException(
          'New Product ID and Price ID and quantity are required for upgrade',
        );
      }
    }

    const business = await this.businessModel.findById(businessId);
    if (!business) {
      throw new NotFoundException('Business not found');
    }
    console.log('business active subscription:', business.activeSubscription);
    const subscription = await this.subscriptionModel.findOne({
      _id: new mongoose.Types.ObjectId(business.activeSubscription),
    });
    console.log(
      'subscription stripe found:',
      subscription.stripeSubscriptionId,
    );
    if (!subscription || !subscription.stripeSubscriptionId) {
      throw new NotFoundException('Active subscription not found');
    }
    const subscriptionItem = await this.stripe.subscriptions.retrieve(
      subscription.stripeSubscriptionId,
      {
        expand: ['items'],
      },
    );
    const subscriptionItemId = subscriptionItem.items.data[0].id;
    console.log('subscription item id:', subscriptionItemId);

    if (data.statusCode === 204) {
      return await this.stripe.subscriptionItems.update(subscriptionItemId, {
        price: data.newPriceId,
        proration_behavior: 'always_invoice',
      });
    } else if (data.statusCode === 205) {
      return await this.stripe.subscriptionItems.update(subscriptionItemId, {
        quantity: data.quantity,
        proration_behavior: 'always_invoice',
      });
    } else if (data.statusCode === 206) {
      return await this.stripe.subscriptionItems.update(subscriptionItemId, {
        price: data.newPriceId,
        quantity: data.quantity,
        proration_behavior: 'always_invoice', // bill the extra immediately
      });
    }
  }

  async createConnectOnboardingLink(businessId: string) {
    const business = await this.businessModel.findById(businessId);
    if (!business?.stripeAccountId)
      throw new BadRequestException('Business has no stripeAccountId');

    const base = process.env.APP_BASE_URL!;
    const link = await this.stripe.accountLinks.create({
      account: business.stripeAccountId,
      refresh_url: `${base}/stripe_connect/success`,
      return_url: `${base}/stripe_connect/refresh`,
      // refresh_url: `https://dev.business.pinntag.com/dashboard/subscription/refresh`,
      // return_url: `https://dev.business.pinntag.com/dashboard/subscription/return`,
      type: 'account_onboarding',
    });

    return { url: link.url };
  }

  async createStripeExpressLoginLink(businessId: string) {
    const business = await this.businessModel.findById(businessId);
    if (!business?.stripeAccountId) {
      throw new BadRequestException('Business has no stripeAccountId');
    }

    const loginLink = await this.stripe.accounts.createLoginLink(
      business.stripeAccountId,
    );

    return { url: loginLink.url };
  }

  async createConnectExpressAccount(params: {
    businessId: string;
    country: string; // US/GB/IN...
    email: string;
    businessType: 'individual' | 'company';
  }) {
    const business = await this.businessModel.findById(params.businessId);
    if (!business) throw new BadRequestException('Business not found');

    if (business.stripeAccountId) {
      return { stripeAccountId: business.stripeAccountId };
    }

    const account = await this.stripe.accounts.create({
      type: 'express',
      country: params.country,
      email: params.email,
      business_type: params.businessType,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      metadata: { businessId: params.businessId },
    });

    business.stripeAccountId = account.id;
    business.stripeOnboardingComplete = false;
    await business.save();

    return { stripeAccountId: account.id };
  }
  async syncAccountStatus(businessId: string) {
    const business = await this.businessModel.findById(businessId);
    if (!business?.stripeAccountId)
      throw new BadRequestException('Business has no stripeAccountId');

    const stripeAccountId = business.stripeAccountId;
    const account = await this.stripe.accounts.retrieve(stripeAccountId);

    // A common “ready” condition: charges_enabled and payouts_enabled true
    const onboardingComplete =
      !!(account as any).charges_enabled && !!(account as any).payouts_enabled;

    const firstExternalAccount = account.external_accounts?.data[0];
    const isBankAccount = firstExternalAccount?.object === 'bank_account';

    await this.businessModel.updateOne(
      { _id: businessId },
      {
        $set: {
          stripeOnboardingComplete: onboardingComplete,
          stripeAccountStatus: {
            charges_enabled: account.charges_enabled,
            payouts_enabled: account.payouts_enabled,
            details_submitted: account.details_submitted,
            currently_due: account.requirements?.currently_due ?? [],
            disabled_reason: account.requirements?.disabled_reason ?? null,
            bank_name: isBankAccount
              ? ((firstExternalAccount as Stripe.BankAccount).bank_name ?? '')
              : '',
            last4: firstExternalAccount?.last4 ?? '',
          },
        },
      },
    );

    return { account, onboardingComplete };
  }

  private calcPlatformFee(amount: number) {
    const bps = Number(process.env.STRIPE_PLATFORM_FEE_BPS || 0);
    // fee in smallest currency unit
    return Math.floor((amount * bps) / 10000);
  }

  async createFlashDealPaymentIntent(
    userId: string,
    dto: CreateFlashDealPaymentIntentDto,
  ) {
    console.log('DTO:', dto);
    // 1) Validate business + connected account
    const flashDeal = await this.eventModel.findById(dto.flashDealId);
    if (!flashDeal) throw new BadRequestException('Flash Deal not found');

    const business = await this.businessModel.findById(
      flashDeal.businessProfile,
    );
    if (!business) throw new BadRequestException('Business not found');
    if (!business.stripeAccountId) {
      throw new BadRequestException(
        'Business is not onboarded to Stripe Connect',
      );
    }

    // Optional guard: ensure onboarding complete if you want
    // if (!business.stripeOnboardingComplete) throw new BadRequestException('Business Stripe onboarding incomplete');

    // 2) Create a local purchase record FIRST (recommended)
    const consumerId = userId || 'UNKNOWN_CONSUMER'; // ideally from JWT

    if (flashDeal.itemQuantity <= 0) {
      throw new BadRequestException('Flash Deal is sold out');
    }
    if (flashDeal.type !== EventTypes.FLASHDEAL) {
      throw new BadRequestException('Event is not a Flash Deal');
    }

    let amount = flashDeal.itemPrice * 100 * dto.quantity;

    const purchase = await this.consumerPurchaseModel.create({
      deal: new mongoose.Types.ObjectId(dto.flashDealId),
      business: new mongoose.Types.ObjectId(flashDeal.businessProfile),
      consumer: new mongoose.Types.ObjectId(consumerId),
      amount: amount,
      currency: flashDeal.currency.toLowerCase(),
      status: 'requires_payment',
      quantity: dto.quantity
    });

    // 3) Create destination charge PaymentIntent
    const applicationFee = this.calcPlatformFee(amount);

    const pi = await this.stripe.paymentIntents.create(
      {
        amount: amount,
        currency: flashDeal.currency.toLowerCase(),
        automatic_payment_methods: { enabled: true },

        // Connect split:
        application_fee_amount: applicationFee,
        transfer_data: {
          destination: business.stripeAccountId,
        },

        metadata: {
          purchaseId: purchase.id,
          flashDealId: dto.flashDealId,
          businessId: flashDeal.businessProfile.toString(),
          consumerId,
          type: 'FLASHDEAL',
        },
      },
      //     {
      //   // ✅ idempotency prevents double-charges if your API retries
      //   idempotencyKey: `flashdeal_${dto.flashDealId}_${consumerId}`,
      // },
    );

    // Store PI id for webhook reconciliation
    // (Implement update method if you want; or store in create)
    // For brevity: assume purchaseRepo can update by PI
    // If you don't have that, store it in your purchase record schema.
    // Here’s a common quick way:
    // await this.purchaseRepo.updateStatusByPaymentIntentId(pi.id, 'requires_payment').catch(() => {});
    // Better: have purchaseRepo.attachPaymentIntent(purchase.id, pi.id)

    return {
      clientSecret: pi.client_secret,
      paymentIntentId: pi.id,
      purchaseId: purchase.id,
    };
  }
}
