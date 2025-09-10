import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
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
import { SubscriptionStatus } from 'src/enums/user.enum';
import {
  WebhookSnapshot,
  WebhookSnapshotDocument,
} from 'src/user/models/webhook.model';
import { Business, BusinessDocument } from 'src/business/model/business.model';
import { SubscriptionService } from 'src/subscription/subscription.service';
import { FeatureLimitData } from 'src/subscription/dto/create-subscription-product.dto';

@Injectable()
export class StripeService {
  constructor(
    @InjectStripe() private readonly stripeClient: Stripe,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Transaction.name)
    private readonly transactionModel: Model<Transaction>,
    @InjectModel(Business.name)
    private readonly businessModel: Model<BusinessDocument>,
    @InjectModel(Subscription.name)
    private readonly subscriptionModel: Model<SubscriptionDocument>,
    @InjectModel(WebhookSnapshot.name)
    private readonly webhookSnapshotModel: Model<WebhookSnapshotDocument>,
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
    return await this.stripeClient.customers.create({
      email,
      name,
    });
  }
  // // Save a card to a customer in Stripe
  // async createPaymentMethod(customerId: string, paymentMethodId: string) {
  //   return await this.stripeClient.paymentMethods.attach(paymentMethodId, {
  //     customer: customerId,
  //   });
  // }

  async retrievePaymentMethods(customerId: string) {
    return await this.stripeClient.paymentMethods.list({
      customer: customerId,
      type: 'card',
    });
  }

  async removePaymentMethod(paymentMethodId: string) {
    return await this.stripeClient.paymentMethods.detach(paymentMethodId);
  }

  async findAllSubscriptions(): Promise<Subscription[]> {
    return this.subscriptionModel
      .find()
      .populate('user')
      .populate('businessProfile')
      .populate('product')
      .populate('transaction')
      .exec();
  }

  async getSubscriptionProducts() {
    const products = await this.stripeClient.products.list({
      active: true,
    });
    return await Promise.all(
      products.data.map(async (product) => {
        const prices = await this.stripeClient.prices.list({
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

  async createProduct(
    name: string,
    features: FeatureLimitData[],
    description?: string,
  ) {
    return await this.stripeClient.products.create({
      name,
      description,
      active: true,
      features: features.map((f) => ({ name: f.key + ' - ' + f.value })),
    });
  }

  async getProducts(): Promise<Stripe.Product[]> {
    const products = await this.stripeClient.products.list({
      active: true,
      limit: 100,
      expand: ['data.default_price'],
    });
    return products.data;
  }

  /** Ensure Stripe customer exists for the business */
  private async ensureStripeCustomer(businessId: string): Promise<string> {
    const business = await this.businessModel.findById(businessId);
    if (!business) {
      throw new Error(`Business with ID ${businessId} not found`);
    }
    if (business.stripeCustomerId) return business.stripeCustomerId;

    const customer = await this.stripeClient.customers.create({
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
    priceId: string;
    successUrl: string;
    cancelUrl: string;
    couponId?: string;
    promotionCode?: string;
  }): Promise<{ url: string }> {
    const {
      businessId,
      priceId,
      successUrl,
      cancelUrl,
      couponId,
      promotionCode,
    } = params;

    const business = await this.businessModel.findById(businessId);
    if (!business) throw new NotFoundException('Business not found');

    const customerId = await this.ensureStripeCustomer(business.id);

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      discounts: params.couponId ? [{ coupon: params.couponId }] : [],
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      metadata: {
        businessId: String(business._id),
      },
    };

    // Apply server-side discount if provided
    if (couponId) {
      sessionParams.discounts = [{ coupon: couponId }];
    } else if (promotionCode) {
      sessionParams.discounts = [{ promotion_code: promotionCode }];
    }

    try {
      const session =
        await this.stripeClient.checkout.sessions.create(sessionParams);
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
    const customerId = session.customer as string | null;
    const subscriptionId = session.subscription as string | null;
    const businessId = session.metadata?.businessId;

    if (!customerId || !subscriptionId || !businessId) return;

    // Find or create our internal Subscription record
    // Map Stripe price -> internal product/price if needed (you have that mapping).
    const stripeSub =
      await this.stripeClient.subscriptions.retrieve(subscriptionId);

    const priceId = stripeSub.items.data[0]?.price?.id as string | undefined;
    if (!priceId) return;

    // Here, you likely have SubscriptionPrice documents with stripePriceId; fetch them:
    const internalSub = await this.subscriptionModel.findOneAndUpdate(
      { stripeSubscriptionId: subscriptionId },
      {
        businessProfile: businessId,
        status: SubscriptionStatus.ACTIVE,
        startDate: new Date((stripeSub.current_period_start || 0) * 1000),
        endDate: new Date((stripeSub.current_period_end || 0) * 1000),
        stripeSubscriptionId: subscriptionId,
        // Optionally also store stripe customer on Business (already done in ensure)
      },
      { upsert: true, new: true },
    );
    const invoice = await this.stripeClient.invoices.retrieve(
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
          provider: SubscriptionServiceTypes.STRIPE,
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
          provider: SubscriptionServiceTypes.STRIPE,
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
    await this.stripeClient.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });
    const subscription = await this.stripeClient.subscriptions.create({
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
        await this.stripeClient.subscriptions.retrieve(subscriptionId);
      console.log(
        'Existing subscription metadata:',
        existingSubscription.metadata,
      );

      // Update the subscription metadata
      const updatedSubscription = await this.stripeClient.subscriptions.update(
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
    await this.stripeClient.paymentMethods.attach(paymentMethodId, {
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

      await this.stripeClient.subscriptions.update(
        subscription.id,
        updateParams,
      );
    } else if (newQuantity > maxPaidQuantity) {
      const { scheduleId, scheduleStartDate, scheduleEndDate } =
        subscription.metadata;
      const startDate = Number(scheduleStartDate);
      const endDate = Number(scheduleEndDate);

      const currentTime = Math.floor(Date.now() / 1000);
      let schedule: Stripe.Response<Stripe.SubscriptionSchedule> | null = null;
      if (!scheduleId || (scheduleId && currentTime >= endDate)) {
        schedule = await this.stripeClient.subscriptionSchedules.create({
          from_subscription: subscriptionId,
        });
      }

      await this.stripeClient.subscriptions.update(subscription.id, {
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

      await this.stripeClient.subscriptionSchedules.update(
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
        schedule = await this.stripeClient.subscriptionSchedules.create({
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

      await this.stripeClient.subscriptionSchedules.update(
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
    return await this.stripeClient.subscriptions.list({
      customer: customerId,
    });
  }

  async retrieveSubscription(subscriptionId: string) {
    return await this.stripeClient.subscriptions.retrieve(subscriptionId);
  }

  async cancelSubscription(subscriptionId: string) {
    return await this.stripeClient.subscriptions.cancel(subscriptionId);
  }

  async retriveInvoicesOfSubscription(subscriptionId: string) {
    return await this.stripeClient.invoices.list({
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

            const subscription = await this.stripeClient.subscriptions.retrieve(
              latestInvoice.subscription.toString(),
            );

            if (subscription.status === 'trialing') {
              console.log('webhook: Subscription Trial Active');
              return;
            }
            await this.transactionModel.create({
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
              businessProfile: new mongoose.Types.ObjectId(businessProfile),
              status: TransactionStatus.SUCCESS,
              transactionId: latestInvoice.id,
              subscription: new mongoose.Types.ObjectId(dbSubscriptionId),
              stripeSubscription: latestInvoice.subscription as any,
              invoicePdf: latestInvoice.invoice_pdf,
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
            const failedSubscription =
              await this.stripeClient.subscriptions.retrieve(
                failedInvoice.subscription.toString(),
              );
            await this.transactionModel.create({
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
              businessProfile: new mongoose.Types.ObjectId(businessProfileId),
              status: TransactionStatus.FAILED,
              transactionId: failedInvoice.id,
              subscription: new mongoose.Types.ObjectId(dbSubscriptionId),
              stripeSubscription: failedInvoice.subscription as any,
              invoicePdf: failedInvoice.invoice_pdf,
              isForProrate: this.isInvoiceProrate(failedInvoice),
              stripeLogs: event,
              startDate: new Date(
                failedSubscription.current_period_start * 1000,
              ),
              endDate: new Date(failedSubscription.current_period_end * 1000),
            });

            const subscription = await this.stripeClient.subscriptions.retrieve(
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
}
