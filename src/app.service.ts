import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category, CategoryDocument } from './models/category.model';
import { AgeGroup, AgeGroupDocument } from './models/ageGroup.model';
import { SeederService } from './seeder/seeder.service';
import { SubscriptionProduct } from './subscription/models/subscriptionProduct.model';
import { AppVersion, AppVersionDocument } from './models/appVersion.model';
import { User, UserDocument } from './user/models/user.model';
import { EventTypes } from './enums/event.enums';
import {
  BusinessProfile,
  BusinessProfileDocument,
} from './business-profile/models/businessProfile.model';
import { Token, TokenDocument } from './auth/models/token.model';
@Injectable()
export class AppService implements OnModuleInit {
  constructor(
    @InjectModel(Category.name)
    private readonly categoryModel: Model<CategoryDocument>,
    @InjectModel(AgeGroup.name)
    private readonly ageGroupModel: Model<AgeGroupDocument>,
    @InjectModel(SubscriptionProduct.name)
    private readonly subscriptionProductModel: Model<SubscriptionProduct>,
    @InjectModel(AppVersion.name)
    private readonly appVersionModel: Model<AppVersionDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(BusinessProfile.name)
    private readonly businessProfileModel: Model<BusinessProfileDocument>,
    @InjectModel(Token.name) private readonly tokenModel: Model<TokenDocument>,
    private readonly seederService: SeederService,
  ) {}
  async onModuleInit() {
    // trim and lowercase to emails for all users
    const users = await this.userModel.find().select({ email: 1 }).exec();
    const result = await Promise.all(
      users.map(async (user) => {
        const email = user.email?.trim().toLowerCase();
        return await this.userModel.updateOne({ _id: user._id }, { email });
      }),
    );
    //Remove duplicate fcm tokens for all users
    users.forEach(async (user) => {
      const fcmTokens = await this.tokenModel
        .find({ userId: user._id })
        .sort({ createdAt: -1 })
        .exec();
      if (fcmTokens.length > 1) {
        const fcmTokenIds = fcmTokens.map((token) => token._id);
        const fcmTokenIdsToDelete = fcmTokenIds.slice(1);
        await this.tokenModel.deleteMany({ _id: { $in: fcmTokenIdsToDelete } });
      }
    });

    //Fetch All the business profiles which are not having isDeleted field in the document and append isDeleted field to the document with value false
    const businessProfiles = await this.businessProfileModel
      .find({ isDeleted: { $exists: false } })
      .exec();
    const result1 = await Promise.all(
      businessProfiles.map(async (businessProfile) => {
        return await this.businessProfileModel.updateOne(
          { _id: businessProfile._id },
          { isDeleted: false },
        );
      }),
    );
    await this.seederService.seed();
  }

  async getCategories() {
    return await this.categoryModel
      .find()
      .sort({ sortOrder: 1 })
      .select({ createdAt: 0, updatedAt: 0, __v: 0 })
      .exec();
  }

  async getAgeGroups() {
    return await this.ageGroupModel
      .find()
      .select({ updatedAt: 0, __v: 0 })
      .sort({ sortOrder: 1 });
  }

  async getSubscriptionProducts() {
    return await this.subscriptionProductModel
      .find()
      .select({ createdAt: 0, updatedAt: 0, __v: 0 });
  }

  async getAppVersion() {
    return await this.appVersionModel.find().select({ __v: 0, updatedAt: 0 });
  }
}
