import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { isValidObjectId, Model } from 'mongoose';
import { Category, CategoryDocument } from './models/contentCategory.model';
import { AgeGroup, AgeGroupDocument } from './models/ageGroup.model';
import { SeederService } from './seeder/seeder.service';
import { SubscriptionProduct } from './subscription/models/subscription-product.model';
import { AppVersion, AppVersionDocument } from './models/appVersion.model';
import { User, UserDocument } from './user/models/user.model';
import { EventTypes } from './enums/event.enums';
// import {
//   BusinessProfile,
//   BusinessProfileDocument,
// } from './business-profile/models/businessProfile.model';
import { Token, TokenDocument } from './auth/models/token.model';
import { Client } from 'twilio/lib/base/BaseTwilio';
import OpenAI from 'openai';

import { Otp, OtpDocument } from './auth/models/otp.model';
import {
  PlatformConfig,
  PlatformConfigDocument,
} from './auth/models/platformConfig.model';
import { Drive, DriveDocument } from './drive/models/drive.model';
import { Admin, AdminDocument } from './admin/models/admin.model';
import { Business, BusinessDocument } from './business/model/business.model';
import { SeederConfig } from './models/seederConfig.model';
import { Tag } from './models/tags.model';
import {
  BusinessIndustry,
  BusinessIndustryDocument,
} from './business/model/businessIndustry.model';
import countries from 'country-calling-code';
import { PhoneNumberUtil, PhoneNumberType } from 'google-libphonenumber';
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
    @InjectModel(Business.name)
    private readonly businessModel: Model<BusinessDocument>,
    @InjectModel(Token.name) private readonly tokenModel: Model<TokenDocument>,
    @InjectModel(Otp.name) private readonly otpModel: Model<OtpDocument>,
    @InjectModel(PlatformConfig.name)
    private readonly platformConfigModel: Model<PlatformConfigDocument>,
    @InjectModel(Drive.name) private readonly driveModel: Model<DriveDocument>,
    @InjectModel(Admin.name) private readonly adminModel: Model<AdminDocument>,
    @InjectModel(Tag.name) private readonly tagModel: Model<Tag>,
    @InjectModel(SeederConfig.name)
    private readonly seederConfigModel: Model<SeederConfig>,
    @InjectModel(BusinessIndustry.name)
    private readonly businessIndustryModel: Model<BusinessIndustryDocument>,
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
    const foundPlatformConfig = await this.platformConfigModel.findOne().exec();
    if (!foundPlatformConfig) {
      const createdConfig = await this.platformConfigModel.create({
        distanceWeightage: 0.5,
        timeWeightage: 0.5,
      });
    }
    const businessProfiles = await this.businessModel
      .find({ isDeleted: { $exists: false } })
      .exec();
    const result1 = await Promise.all(
      businessProfiles.map(async (businessProfile) => {
        return await this.businessModel.updateOne(
          { _id: businessProfile._id },
          { isDeleted: false },
        );
      }),
    );

    const seederConfig = await this.seederConfigModel.findOne();
    if (!seederConfig || seederConfig.isSeederEnabled) {
      await this.seederService.seed();
      await this.seederConfigModel.findOneAndUpdate(
        { isSeederEnabled: true },
        { $set: { isSeederEnabled: false } },
        { upsert: true, new: true },
      );
    } else {
      console.log('Seeder is disabled, skipping seeding process.');
    }
  }

  async getCategories() {
    console.log('Inside Service');
    return await this.categoryModel
      .find()
      // .sort({ sortOrder: 1 })
      //sort with alphabatical order
      .sort({ title: 1 })
      .select({ updatedAt: 0, __v: 0 })
      .populate('createdBy', '_id name')
      .exec();
  }
  async getBusinessIndustries() {
    return await this.businessIndustryModel
      .find()
      .sort({ title: 1 })
      .select({ updatedAt: 0, __v: 0 })
      .populate('createdBy', '_id name')
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
  async generateText(prompt: string) {
    try {
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_KEY,
      });
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo', // Change model if needed
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      });
      return { response: response.choices[0].message.content };
    } catch (error) {
      console.error('OpenAI API Error:', error.message);
      return 'Error generating text.';
    }
  }

  async getTags(id: string) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid ID format');
    }
    let tags = await this.tagModel
      .find({ relatedId: new mongoose.Types.ObjectId(id) })
      .exec();
    if (!tags || tags.length === 0) {
      throw new NotFoundException('No tags found for the given ID');
    }

    const tagArray = tags.map((tag) => tag.title);

    return tagArray;
  }

  async getCountryCodes() {
    const isoCodes = countries.map((c) => c.isoCode2);
    const phoneUtil = PhoneNumberUtil.getInstance();
    const countryLengths: Record<string, {min: number, max: number}> = {};
    for (const code of isoCodes) {
      try {
        const desc = phoneUtil.getMetadataForRegion(code);
        if (!desc) continue;
        // Possible lengths of valid numbers (includes mobile/fixed line)
        const possibleLengths = desc?.general?.possibleLength || [];
        const lengths = desc.general?.possibleLength || [];
        const maxLen = possibleLengths.length ? Math.max(...possibleLengths) : null;
        console.log("MAXXXX LENNN:",maxLen)
      } catch (e) {
        // some territories may throw if not in metadata
        console.log('E:', e);
      }
    }

    console.log(countryLengths);

    return countries.map((c) => ({
      isoCode: c.isoCode2,
      countryCode: `+${c.countryCodes[0]}`, // +91, +1 etc.
      countryName: c.country,
      flagImage: `https://cdn.jsdelivr.net/npm/country-flag-icons/3x2/${c.isoCode2}.svg`,
    }));
  }

  // async createDrive(ownerId: string|mongoose.Types.ObjectId, ownerType: string): Promise<Drive> {
  //   const admin = await this.adminModel.findOne();
  //   const defaultSpace = admin?.driveDefaultSpace || 100;
  //   if(!isValidObjectId(ownerId)){
  //     throw new BadRequestException('Invalid ownerId format. Must be a valid MongoDB ObjectId.');
  //   }
  //   const foundDrive = await this.driveModel.findOne({owner:ownerId});
  //   if(foundDrive){
  //     return foundDrive;
  //   }
  //   let foundOwner = null;
  //   if (ownerType === Admin.name) {
  //     foundOwner = await this.adminModel.findById(ownerId);
  //   } else if (ownerType === User.name) {
  //     foundOwner = await this.userModel.findById(ownerId);
  //   } else if (ownerType === BusinessProfile.name) {
  //     foundOwner = await this.businessProfileModel.findById(ownerId);
  //   }

  //   if (!foundOwner) {
  //     throw new NotFoundException(`No ${ownerType} found with the given ownerId.`);
  //   }

  //     const newDrive = new this.driveModel({
  //       owner: new mongoose.Types.ObjectId(ownerId),
  //       ownerType,
  //       TotalSpace: defaultSpace,
  //       AvailableSpace: defaultSpace,
  //     });
  //     return newDrive.save();
  // }
}
