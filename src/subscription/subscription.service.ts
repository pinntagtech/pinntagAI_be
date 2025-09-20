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
import { TransactionPopulates } from 'src/enums/user.enum';
import { CreateSubscriptionProductDto } from './dto/create-subscription-product.dto';
import { FeatureLimit } from './models/feature-limit.model';
import { StripeService } from 'src/subscription/stripe/stripe.service';
import { CreateSubscriptionPriceDto } from './dto/create-subscription-price.dto';
import {
  BillingInterval,
  SubscriptionPrice,
} from './models/subscription-price.model';

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
  aiText:  (v) => v === 'unlimited' ? 'Unlimited AI Text' : `${v} AI Text`,
  contentCreation: (v) => `${v} Content Creation`,
  dropPinn: (v) => `${v} DropPin${v === '1' ? '' : 's'}`,
  locations: (v) => `${v} Location${v === '1' ? '' : 's'}`,
  templates: (v) => v === 'enabled' ? 'Templates Enabled' : 'Templates Disabled',
  analytics: (v) => `${v} Analytics`,
  regions: (v) => v === 'enabled' ? 'Regions Enabled' : 'Regions Disabled',
  roles: (v) => v === 'enabled' ? 'Roles Enabled' : 'Roles Disabled',
  departments: (v) => v === 'enabled' ? 'Departments Enabled' : 'Departments Disabled',
  storage: (v) => `${v}GB Storage`,
};

  async getProducts(billingInterval?: string) {
    try {
      const products = await this.subscriptionProductModel.aggregate([
        // Step 1: Match only active products
        { $match: { isActive: true } },

        // Step 2: Lookup features
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

        // Step 4: Exclude fields from subscriptionProduct
        {
          $project: {
            updatedAt: 0,
            __v: 0,
          },
        },

        // Step 5: Sort
        { $sort: { createdAt: -1 } },
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

    return await this.subscriptionProductModel
      .find({ isActive: true })
      .populate('features', 'key value _id')
      .populate('prices', '-product -createdAt -updatedAt -__v')
      .select({
        updatedAt: 0,
        __v: 0,
      })
      .sort({ createdAt: -1 })
      .exec();
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
  // async findAll(user: DecodedUser) {
  //   return await this.subscriptionModel
  //     .find({
  //       user: new mongoose.Types.ObjectId(user.id),
  //       endDate: { $gte: new Date() },
  //     })
  //     .populate('product', '-createdAt -updatedAt -__v')
  //     .populate('transaction', TransactionPopulates.FOREIGN)
  //     .sort({ createdAt: -1 });
  // }

  // async findOne(id: string, user: DecodedUser) {
  //   if (!mongoose.isValidObjectId(id)) {
  //     return { success: false, message: 'Invalid subscription id' };
  //   } else {
  //     const subscription = await this.subscriptionModel
  //       .findOne({
  //         _id: new mongoose.Types.ObjectId(id),
  //         user: new mongoose.Types.ObjectId(user.id),
  //       })
  //       .populate('product', 'name')
  //       .populate('transaction', TransactionPopulates.FOREIGN);
  //     if (!subscription) {
  //       return { success: false, message: 'Subscription not found' };
  //     } else {
  //       return { success: true, subscription };
  //     }
  //   }
  // }

  // update(id: number, updateSubscriptionDto: UpdateSubscriptionDto) {
  //   return `This action updates a #${id} subscription`;
  // }

  // remove(id: number) {
  //   return `This action removes a #${id} subscription`;
  // }
}
