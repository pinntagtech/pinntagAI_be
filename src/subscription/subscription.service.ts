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
import { StripeService } from 'src/stripe/stripe.service';

@Injectable()
export class SubscriptionService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(SubscriptionProduct.name)
    private readonly subscriptionProductModel: Model<SubscriptionProduct>,
    @InjectModel(Subscription.name)
    private readonly subscriptionModel: Model<SubscriptionDocument>,
    @InjectModel(Transaction.name)
    private readonly transactionModel: Model<Transaction>,
    @InjectModel(FeatureLimit.name)
    private readonly featureLimitModel: Model<FeatureLimit>,
    private readonly stripeService: StripeService,
  ) {}

  async createProduct(user: DecodedUser, data: CreateSubscriptionProductDto) {
    try {
      const featureLimits = data.features.map(async (feature) => {
        const createdFeatureLimit = await this.featureLimitModel.create({
          ...feature,
        });
        return createdFeatureLimit._id;
      });
      const createdProduct = await this.subscriptionProductModel.create({
        ...data,
        createdBy: new mongoose.Types.ObjectId(user.id),
        features: await Promise.all(featureLimits),
      });
      const createdStripeProduct = await this.stripeService.createProduct(
        data.name,
        data.description,
        data.features ? { features: data.features } : {},
      );
      const updatedProduct =
        await this.subscriptionProductModel.findByIdAndUpdate(
          createdProduct._id,
          { stripeProductId: createdStripeProduct.id },
          { new: true },
        );
      return { success: true, data: updatedProduct };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async getProducts() {
    return await this.subscriptionProductModel
      .find()
      .select({
        createdAt: 0,
        updatedAt: 0,
        __v: 0,
      })
      .exec();
  }

  // async create(
  //   createSubscriptionDto: CreateSubscriptionDto,
  //   user: DecodedUser,
  // ) {
  //   if (!mongoose.isValidObjectId(createSubscriptionDto.product)) {
  //     return { success: false, message: 'Invalid product id' };
  //   } else {
  //     const subscriptionProduct = await this.subscriptionProductModel.findById(
  //       createSubscriptionDto.product,
  //     );
  //     if (!subscriptionProduct) {
  //       return { success: false, message: 'Product not found' };
  //     } else {
  //       let endDate = new Date();
  //       if (subscriptionProduct.durationType === 'monthly') {
  //         endDate.setMonth(endDate.getMonth() + subscriptionProduct.duration);
  //       } else if (subscriptionProduct.durationType === 'annual') {
  //         endDate.setFullYear(
  //           endDate.getFullYear() + subscriptionProduct.duration,
  //         );
  //       }
  //       const subscription = new this.subscriptionModel({
  //         user: new mongoose.Types.ObjectId(user.id),
  //         product: subscriptionProduct._id,
  //         startDate: new Date(),
  //         endDate,
  //       });
  //       await subscription.save();
  //       delete createSubscriptionDto.product;
  //       const transaction = await this.transactionModel.create({
  //         ...createSubscriptionDto,
  //         subscription: subscription._id,
  //         amount: subscriptionProduct.price * createSubscriptionDto.quantity,
  //         businessProfile: createSubscriptionDto.businessProfileId,
  //         user: new mongoose.Types.ObjectId(user.id),
  //       });
  //       const updatedSubscription = await this.subscriptionModel
  //         .findByIdAndUpdate(
  //           subscription._id,
  //           { transaction: transaction._id },
  //           { new: true },
  //         )
  //         .populate('product', 'name')
  //         .populate('transaction', TransactionPopulates.FOREIGN);

  //       await this.userModel.updateOne(
  //         { _id: new mongoose.Types.ObjectId(user.id) },
  //         {
  //           $set: { hasSubscribedForBusiness: true },
  //           $push: { subscriptions: subscription._id },
  //         },
  //       );
  //       return { success: true, subscription: updatedSubscription };
  //     }
  //   }
  // }

  async findAll(user: DecodedUser) {
    return await this.subscriptionModel
      .find({
        user: new mongoose.Types.ObjectId(user.id),
        endDate: { $gte: new Date() },
      })
      .populate('product', '-createdAt -updatedAt -__v')
      .populate('transaction', TransactionPopulates.FOREIGN)
      .sort({ createdAt: -1 });
  }

  async findOne(id: string, user: DecodedUser) {
    if (!mongoose.isValidObjectId(id)) {
      return { success: false, message: 'Invalid subscription id' };
    } else {
      const subscription = await this.subscriptionModel
        .findOne({
          _id: new mongoose.Types.ObjectId(id),
          user: new mongoose.Types.ObjectId(user.id),
        })
        .populate('product', 'name')
        .populate('transaction', TransactionPopulates.FOREIGN);
      if (!subscription) {
        return { success: false, message: 'Subscription not found' };
      } else {
        return { success: true, subscription };
      }
    }
  }

  update(id: number, updateSubscriptionDto: UpdateSubscriptionDto) {
    return `This action updates a #${id} subscription`;
  }

  remove(id: number) {
    return `This action removes a #${id} subscription`;
  }
}
