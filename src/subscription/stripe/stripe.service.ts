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
import { SubscriptionProduct } from '../models/subscription-product.model';
import { CreateCouponDto } from './dtos/create-coupon.dto';

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
  ) {}

  public constructEventFromPayload(
    payload: Buffer,
    signature: string,
    endpointSecret: string,
  ): Stripe.Event {
    try {
      return Stripe.webhooks.constructEvent(payload, signature, endpointSecret);
    } catch (err: any) {
      throw new Error(
        `⚠️  Webhook signature verification failed: ${err.message}`,
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

  async createProduct(name: string, metadata: Object, description?: string) {
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
  ) {
    return this.stripe.subscriptionItems.update(subscriptionItemId, {
      price: newPriceId,
      proration_behavior: prorationBehavior,
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
      if( coupon.maxRedemptions && coupon.usedCount >= coupon.maxRedemptions){
        throw new BadRequestException('This coupon code has reached its maximum redemptions');
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
    await this.webhookSnapshotModel.create({
      source: 'stripe',
      data: event,
    });

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
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await this.onInvoiceFailed(invoice);
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
      default:
        // noop
        break;
    }
  }

  /** When hosted checkout completes */
  private async onCheckoutCompleted(session: Stripe.Checkout.Session) {
    console.log(`Checkout completed for session: ${session}`);
    const customerId = session.customer as string | null;
    const subscriptionId = session.subscription as string | null;
    const businessId = session.metadata?.businessId;
    const couponId = session.metadata?.couponId;
    console.log(`Coupon ID from session metadata: ${couponId}`);
    if (!customerId || !subscriptionId || !businessId) return;

    // Find or create our internal Subscription record
    // Map Stripe price -> internal product/price if needed (you have that mapping).
    const stripeSub = await this.stripe.subscriptions.retrieve(subscriptionId);

    const priceId = stripeSub.items.data[0]?.price?.id as string | undefined;
    if (!priceId) return;
    const internalSubPrice = await this.subscriptionPriceModel.findOne({
      stripePriceId: priceId,
    });
    if (!internalSubPrice) return;

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
        // Optionally also store stripe customer on Business (already done in ensure)
      },
      { upsert: true, new: true },
    );
    await this.businessModel.updateOne(
      { _id: new mongoose.Types.ObjectId(businessId) },
      {
        $set: {
          activeSubscription: new mongoose.Types.ObjectId(internalSub.id),
        },
      },
    );
    const invoice = await this.stripe.invoices.retrieve(
      stripeSub.latest_invoice as string,
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

    await this.subscriptionModel.findOneAndUpdate(
      { stripeSubscriptionId: subscriptionId },
      {
        status: SubscriptionStatus.ACTIVE,
        endDate: invoice.lines?.data?.[0]?.period?.end
          ? new Date(invoice.lines.data[0].period.end * 1000)
          : undefined,
      },
    );

    await this.transactionModel.updateOne(
      { stripeInvoiceId: invoice.id },
      {
        $set: {
          description: `Invoice paid for subscription ${subscriptionId}`,
          amountMinor: invoice.total, // or amount: invoice.total/100
          currency: invoice.currency?.toUpperCase(),
          quantity: invoice.lines?.data?.[0]?.quantity ?? 1,
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

  private async onSubscriptionUpdated(sub: Stripe.Subscription) {
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
    const { code, percentOff,amountOff,duration, durationInMonths, maxRedemptions, redeemBy } =
      couponData;

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
      console.log("Created coupon:", coupon);
      return coupon;
    } catch (err: any) {
      throw new InternalServerErrorException(
        `Stripe coupon creation error: ${err.message}`,
      );
    }
  }
}
