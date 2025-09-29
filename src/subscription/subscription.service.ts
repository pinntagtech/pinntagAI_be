import { Injectable } from '@nestjs/common';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { InjectModel } from '@nestjs/mongoose';
import {
  Subscription,
  SubscriptionDocument,
} from './models/subscription.model';
import mongoose, { Model } from 'mongoose';
import { SubscriptionProduct } from './models/subscription-product.model';
import { DecodedUser } from 'src/auth/interfaces/decodedUser.interface';
import { Transaction } from 'src/subscription/models/transaction.model';
import { User, UserDocument } from 'src/user/models/user.model';
import {
  SubscriptionSource,
  SubscriptionStatus,
  TransactionPopulates,
} from 'src/enums/user.enum';
import { CreateSubscriptionProductDto } from './dto/create-subscription-product.dto';
import { FeatureLimit, FeatureLimitList } from './models/feature-limit.model';
import { StripeService } from 'src/subscription/stripe/stripe.service';
import { CreateSubscriptionPriceDto } from './dto/create-subscription-price.dto';
import {
  BillingInterval,
  SubscriptionPrice,
} from './models/subscription-price.model';
import { Business, BusinessDocument } from 'src/business/model/business.model';
import { EventStatus, EventTypes } from 'src/enums/event.enums';
import { Event, EventDocument } from 'src/event/models/event.model';
import { Outlet, OutletDocument } from 'src/outlet/model/outlet.model';
import { Drive, DriveDocument } from 'src/drive/models/drive.model';

export interface UsageLimitResponse {
  maxLimit: number | string;
  consumed: number;
  remaining: number | string;
  percentage: number;
  isLimitExceeded: boolean;
}
@Injectable()
export class SubscriptionService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(SubscriptionProduct.name)
    private readonly subscriptionProductModel: Model<SubscriptionProduct>,
    @InjectModel(Subscription.name)
    private readonly subscriptionModel: Model<SubscriptionDocument>,
    @InjectModel(SubscriptionPrice.name)
    private readonly subscriptionPriceModel: Model<SubscriptionPrice>,
    @InjectModel(Transaction.name)
    private readonly transactionModel: Model<Transaction>,
    @InjectModel(FeatureLimit.name)
    private readonly featureLimitModel: Model<FeatureLimit>,
    @InjectModel(Business.name)
    private readonly businessModel: Model<BusinessDocument>,
    @InjectModel(Event.name) private readonly eventModel: Model<EventDocument>,
    @InjectModel(Outlet.name)
    private readonly outletModel: Model<OutletDocument>,
    @InjectModel(Drive.name) private readonly driveModel: Model<DriveDocument>,
    private readonly stripeService: StripeService,
  ) {}

  async getAllSubscriptions(user: DecodedUser) {
    const subscriptions = await this.subscriptionModel
      .find({
        business: new mongoose.Types.ObjectId(user.businessProfile),
      })
      .populate('product', '-createdAt -updatedAt -__v')
      .populate('transaction', TransactionPopulates.FOREIGN)
      .sort({ createdAt: -1 });
    return subscriptions;
  }

  async createProduct(user: DecodedUser, data: CreateSubscriptionProductDto) {
    try {
      const createdProduct = await this.subscriptionProductModel.create({
        name: data.name,
        description: data.description,
        createdBy: new mongoose.Types.ObjectId(user.id),
        isRecommended: data.isRecommended || false,
      });
      const createdStripeProduct = await this.stripeService.createProduct(
        data.name,
        data.features,
        data.description,
      );
      console.log('Created Stripe Product:', createdStripeProduct);
      let featureLimits = [];
      for (const feature of Object.keys(data.features)) {
        const createdFeatureLimit = await this.featureLimitModel.create({
          key: feature,
          value: data.features[feature],
          product: createdProduct._id,
        });
        featureLimits.push(createdFeatureLimit._id);
      }
      const createdFeatureLimits = featureLimits;
      const updatedProduct =
        await this.subscriptionProductModel.findByIdAndUpdate(
          createdProduct._id,
          {
            stripeProductId: createdStripeProduct.id,
            features: createdFeatureLimits,
          },
          { new: true },
        );
      return {
        success: true,
        message: 'Product created successfully',
        data: updatedProduct,
      };
    } catch (error) {
      console.error('Error creating product:', error);
      return { success: false, message: 'Something went wrong' };
    }
  }
  featureLabels: Record<string, (v: string) => string> = {
    aiImage: (v) => `${v} AI Image${v === '1' ? '' : 's'}`,
    aiText: (v) => (v === 'unlimited' ? 'Unlimited AI Text' : `${v} AI Text`),
    contentCreation: (v) => `${v} Content Creation`,
    dropPinn: (v) => `${v} DropPin${v === '1' ? '' : 's'}`,
    locations: (v) => `${v} Location${v === '1' ? '' : 's'}`,
    templates: (v) =>
      v === 'enabled' ? 'Templates Enabled' : 'Templates Disabled',
    analytics: (v) => `${v} Analytics`,
    regions: (v) => (v === 'enabled' ? 'Regions Enabled' : 'Regions Disabled'),
    roles: (v) => (v === 'enabled' ? 'Roles Enabled' : 'Roles Disabled'),
    departments: (v) =>
      v === 'enabled' ? 'Departments Enabled' : 'Departments Disabled',
    storage: (v) => `${v}GB Storage`,
  };

  async getProducts(user: DecodedUser, billingInterval?: string) {
    try {
      const userSubscription = await this.subscriptionModel.findOne({
        business: new mongoose.Types.ObjectId(user.businessProfile),
      });
      const products = await this.subscriptionProductModel.aggregate([
        // Step 1: Match only active products
        { $match: { isActive: true } },
        {
          $lookup: {
            from: 'featurelimits', // collection name in MongoDB
            localField: 'features',
            foreignField: '_id',
            as: 'features',
            pipeline: [
              { $project: { key: 1, value: 1 } }, // only keep needed fields
            ],
          },
        },
        // Step 3: Lookup prices
        {
          $lookup: {
            from: 'subscriptionprices', // collection name in MongoDB
            localField: 'prices',
            foreignField: '_id',
            as: 'prices',
            pipeline: [
              {
                $match: {
                  billingInterval: billingInterval
                    ? billingInterval
                    : 'monthly',
                },
              },
              {
                $project: {
                  product: 0,
                  createdAt: 0,
                  updatedAt: 0,
                  __v: 0,
                },
              },
            ],
          },
        },
        {
          $addFields: {
            isCurrentPlan: {
              $and: [
                { $eq: ['$_id', userSubscription?.product] },
                { $in: ['$_id', [userSubscription?.product]] },
              ],
            },
          },
        },

        // Step 4: Exclude fields from subscriptionProduct
        {
          $project: {
            updatedAt: 0,
            __v: 0,
          },
        },

        // Step 5: Sort
        {
          $sort: { 'prices.price': 1 },
        },
      ]);

      const enrichedProducts = products.map((product) => {
        const enrichedFeatures = product.features.map((feature) => {
          const label = this.featureLabels[feature.key];
          return {
            ...feature,
            label: label ? label(feature.value) : feature.value,
          };
        });
        return {
          ...product,
          features: enrichedFeatures,
        };
      });

      return enrichedProducts;
    } catch (error) {
      console.error('Error fetching products:', error);
      return [];
    }
  }

  async createProductPrice(
    user: DecodedUser,
    id: string,
    data: CreateSubscriptionPriceDto,
  ) {
    try {
      if (!mongoose.isValidObjectId(id)) {
        return { success: false, message: 'Invalid product id' };
      }
      const subscriptionProduct =
        await this.subscriptionProductModel.findById(id);
      if (!subscriptionProduct) {
        return { success: false, message: 'Product not found' };
      }
      const createdPrice = await this.stripeService.createPrice({
        productId: subscriptionProduct.stripeProductId,
        unitAmount: data.price * 100, // converting to smallest currency unit
        currency: data.currency,
        interval:
          data.billingInterval == BillingInterval.MONTHLY ? 'month' : 'year',
        metadata: {
          isCustom: data.isCustom ? 'true' : 'false',
        },
        nickname: `${subscriptionProduct.name} - ${data.billingInterval} - ${data.currency.toUpperCase()}${(data.price / 100).toFixed(2)}`,
        trialPeriodDays: undefined,
      });
      console.log('Created Stripe Price:', createdPrice);
      const newSubscriptionPrice = await this.subscriptionPriceModel.create({
        product: subscriptionProduct._id,
        billingInterval: data.billingInterval,
        currency: data.currency,
        stripePriceId: createdPrice.id,
        isCustom: data.isCustom || false,
        price: data.price,
        appleProductId: data.appleProductId,
        googleProductId: data.googleProductId,
      });
      await this.subscriptionProductModel.findByIdAndUpdate(
        subscriptionProduct._id,
        {
          $push: { prices: newSubscriptionPrice._id },
        },
      );
      return {
        success: true,
        message: 'Product price created successfully',
        data: newSubscriptionPrice,
      };
    } catch (error) {
      console.error('Error creating product price:', error);
      return { success: false, message: 'Something went wrong' };
    }
  }

  async toggleProduct(user: DecodedUser, id: string) {
    try {
      if (!mongoose.isValidObjectId(id)) {
        return { success: false, message: 'Invalid product id' };
      }
      const subscriptionProduct =
        await this.subscriptionProductModel.findById(id);
      if (!subscriptionProduct) {
        return { success: false, message: 'Product not found' };
      }
      const updatedProduct =
        await this.subscriptionProductModel.findByIdAndUpdate(
          id,
          { isActive: !subscriptionProduct.isActive },
          { new: true },
        );
      await this.stripeService.deactivateProduct(
        subscriptionProduct.stripeProductId,
      );
      return {
        success: true,
        message: 'Product toggled successfully',
        data: updatedProduct,
      };
    } catch (error) {
      console.error('Error toggling product:', error);
      return { success: false, message: 'Something went wrong' };
    }
  }

  async createFreeCheckoutSession(user: DecodedUser) {
    try {
      const createSubscription = {
        business: new mongoose.Types.ObjectId(user.businessProfile),
        source: SubscriptionSource.FREE,
        startDate: new Date(),
        endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
        invoiceStartDate: new Date(),
        invoiceEndDate: new Date(
          new Date().setFullYear(new Date().getFullYear() + 1),
        ),
        isCancelled: false,
        isTrialActive: false,
        status: SubscriptionStatus.ACTIVE,
        iapPlatform: 'none',
      };
      const freeSubscriptionProduct =
        await this.subscriptionProductModel.findOne({ isFree: true });
      if (!freeSubscriptionProduct) {
        return {
          success: false,
          message: 'Free subscription product not found',
        };
      }

      const freeSubscription = await this.subscriptionModel.create({
        ...createSubscription,
        product: freeSubscriptionProduct._id,
      });
      return { success: true, data: freeSubscription };
    } catch (error) {
      console.error('Error creating free checkout session:', error);
      return { success: false, message: 'Something went wrong' };
    }
  }

  async fetchFeatureLimits(
    businessProfile: string,
    title: string,
    dataCount: number,
  ) {
    try {
      const business = await this.businessModel.findById(businessProfile);
      if (!business) return { success: false, message: 'Business not found' };
      console.log('Business Active Subscription:', business.activeSubscription);
      const [subscription] = await this.subscriptionModel.aggregate([
        { $match: { _id: business.activeSubscription } },
        {
          $lookup: {
            from: 'featurelimits',
            localField: 'product',
            foreignField: 'product',
            as: 'featureLimits',
          },
        },
      ]);

      const limits = new Map<string, string>();
      for (const f of subscription.featureLimits) limits.set(f.key, f.value);

      let data: any;
      switch (title) {
        case FeatureLimitList.AI_IMAGE:
          data = await this.aiImageLimit(limits);
          break;
        case FeatureLimitList.AI_TEXT:
          data = await this.aiTextLimit(limits);
          break;
        case FeatureLimitList.CONTENT_CREATION:
          data = await this.contentCreationLimit(
            limits,
            this.eventModel,
            businessProfile,
          );
          break;
        case FeatureLimitList.DEPARTMENT:
          data = await this.departmentLimit(limits);
          break;
        case FeatureLimitList.DROP_PIN:
          data = await this.dropPinLimit(
            limits,
            this.eventModel,
            businessProfile,
          );
          break;
        case FeatureLimitList.LOCATIONS:
          data = await this.locationsLimit(
            limits,
            this.outletModel,
            businessProfile,
            dataCount,
          );
          break;
        case FeatureLimitList.REGIONS:
          data = await this.regionsLimit(limits);
          break;
        case FeatureLimitList.ROLES:
          data = await this.rolesLimit(limits);
          break;
        case FeatureLimitList.STORAGE:
          data = await this.storageLimit(
            limits,
            this.driveModel,
            business.creator.toString(),
          );
          break;
        case FeatureLimitList.TEMPLATES:
          data = await this.templatesLimit(limits);
          break;
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error fetching feature limits:', error);
      return { success: false, message: 'Something went wrong' };
    }
  }

  responseData(maxLimit: string, consumed: number): UsageLimitResponse {
    const remaining = Number(maxLimit) - Number(consumed);
    const percentage = (Number(consumed) / Number(maxLimit)) * 100;
    return {
      maxLimit,
      consumed,
      remaining,
      percentage,
      isLimitExceeded: remaining <= 0,
    };
  }

  async aiImageLimit(limits: Map<string, string>) {
    return this.responseData(limits.get(FeatureLimitList.AI_IMAGE) ?? '0', 0);
  }

  async aiTextLimit(limits: Map<string, string>) {
    const val = limits.get(FeatureLimitList.AI_TEXT);
    if (val === 'enabled') return { isLimitExceeded: false };
    if (val === 'disabled') return { isLimitExceeded: true };
    return { isLimitExceeded: true };
  }

  async contentCreationLimit(
    limits: Map<string, string>,
    eventModel: mongoose.Model<EventDocument>,
    businessProfile: string,
  ) {
    const content = await eventModel.countDocuments({
      businessProfile: new mongoose.Types.ObjectId(businessProfile),
      type: { $ne: EventTypes.DROPPED_PIN },
      status: EventStatus.PUBLISHED,
    });
    return this.responseData(
      limits.get(FeatureLimitList.CONTENT_CREATION) ?? '0',
      content,
    );
  }

  async departmentLimit(limits: Map<string, string>) {
    const val = limits.get(FeatureLimitList.DEPARTMENT);
    return { isLimitExceeded: val === 'disabled' };
  }

  async dropPinLimit(
    limits: Map<string, string>,
    eventModel: mongoose.Model<EventDocument>,
    businessProfile: string,
  ) {
    const count = await eventModel.countDocuments({
      businessProfile: new mongoose.Types.ObjectId(businessProfile),
      type: EventTypes.DROPPED_PIN,
      status: EventStatus.PUBLISHED,
    });
    return this.responseData(
      limits.get(FeatureLimitList.DROP_PIN) ?? '0',
      count,
    );
  }

  async locationsLimit(
    limits: Map<string, string>,
    outletModel: mongoose.Model<OutletDocument>,
    businessProfile: string,
    dataCount: number,
  ) {
    return this.responseData(
      limits.get(FeatureLimitList.LOCATIONS) ?? '0',
      dataCount,
    );
  }

  async regionsLimit(limits: Map<string, string>) {
    const val = limits.get(FeatureLimitList.REGIONS);
    return { isLimitExceeded: val === 'disabled' };
  }

  async rolesLimit(limits: Map<string, string>) {
    const val = limits.get(FeatureLimitList.ROLES);
    return { isLimitExceeded: val === 'disabled' };
  }

  async storageLimit(
    limits: Map<string, string>,
    driveModel: mongoose.Model<DriveDocument>,
    creatorId: string,
  ) {
    const drive = await driveModel.findOne({ owner: creatorId });
    if (!drive) return { isLimitExceeded: true };
    return this.responseData(String(drive.TotalSpace), drive.AvailableSpace);
  }

  async templatesLimit(limits: Map<string, string>) {
    const val = limits.get(FeatureLimitList.TEMPLATES);
    return { isLimitExceeded: val === 'disabled' };
  }
}
