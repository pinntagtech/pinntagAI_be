import { Injectable } from '@nestjs/common';
import { CreateRewardDto, UpdateRewardDto } from './dto/create-reward.dto';
import { DecodedUser } from 'src/auth/interfaces/decodedUser.interface';
import { InjectModel } from '@nestjs/mongoose';
import {
  BusinessUser,
  BusinessUserDocument,
} from 'src/business/model/businessUser.model';
import mongoose, { Model, PipelineStage } from 'mongoose';
import { Business, BusinessDocument } from 'src/business/model/business.model';
import { DriveService } from 'src/drive/drive.service';
import { Folder } from 'src/drive/models/folder.model';
import { Reward, RewardDocument } from './model/reward.model';
import { S3Service } from 'src/s3.service';
import { manipulateImageName } from 'src/helpers/upload.helpers';
import {
  ActivityType,
  ClaimStatus,
  RedemptionMode,
  RewardStatus,
} from './enums/rewards.enum';
import {
  EventLocation,
  EventLocationDocument,
} from 'src/event/models/eventLocation.model';
import { Outlet, OutletDocument } from 'src/outlet/model/outlet.model';
import {
  FileCategory,
  FileCategoryDocument,
} from 'src/drive/models/fileCategory.model';
import {
  BusinessPopulates,
  LocationPopulates,
  UserPopulates,
} from 'src/enums/user.enum';
import {
  RewardLocation,
  RewardLocationDocument,
} from './model/rewardLocation.model';
import { GetDashboardDto } from 'src/auth/dto/getDashboard.dto';
import { GetRewardDashboardDto } from './dto/get-rewards-dashboard.dto';
import { BusinessIndustry } from 'src/business/model/businessIndustry.model';
import { User, UserDocument } from 'src/user/models/user.model';
import { UserReward, UserRewardDocument } from './model/userReward.model';
import { NotificationTypes } from 'src/enums/event.enums';
import { TokenTypes } from 'src/enums/auth.enums';
import { Token } from 'aws-sdk';
import { TokenDocument } from 'src/auth/models/token.model';
import { FirebaseService } from 'src/notification/firebase.service';
import { UserService } from 'src/user/user.service';
import {
  Notification,
  NotificationDocument,
} from 'src/notification/models/notification.model';
import { UserDetail } from 'aws-sdk/clients/iam';
import { GenerateRewardUrlDto } from './dto/generate-reward-url.dto';
import { getStringDateTzWithTime } from 'src/helpers/event.helpers';
import { DynamicLinkService } from 'src/notification/dynamicLink.service';
import { from } from 'rxjs';
import { BusinessService } from 'src/business/business.service';
import { File, FileDocument } from 'src/drive/models/file.model';

@Injectable()
export class RewardsService {
  constructor(
    // @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(BusinessUser.name)
    private readonly businessUserModel: Model<BusinessUserDocument>,
    // @InjectModel(Event.name) private readonly eventModel: Model<Event>,
    @InjectModel(Business.name)
    private readonly businessModel: Model<BusinessDocument>,
    @InjectModel(Reward.name)
    private readonly rewardModel: Model<RewardDocument>,
    @InjectModel(EventLocation.name)
    private readonly eventLocationModel: Model<EventLocationDocument>,
    @InjectModel(Outlet.name)
    private readonly outletModel: Model<OutletDocument>,
    @InjectModel(FileCategory.name)
    private readonly fileCategoryModel: Model<FileCategoryDocument>,
    @InjectModel(RewardLocation.name)
    private readonly rewardLocationModel: Model<RewardLocationDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(UserReward.name)
    private readonly userRewardModel: Model<UserRewardDocument>,
    @InjectModel(Token.name) private readonly tokenModel: Model<TokenDocument>,
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
    @InjectModel(File.name) private readonly fileModel: Model<FileDocument>,

    // @InjectModel(File.name) private readonly fileModel: Model<File>,
    // @InjectModel(FileCategory.name)
    // private readonly fileCategoryModel: Model<FileCategory>,
    private readonly driveService: DriveService,
    private readonly s3Service: S3Service,
    private readonly userService: UserService,
    private readonly dynamicLinkService: DynamicLinkService,
    private readonly firebaseService: FirebaseService,
    private readonly businessService: BusinessService,
  ) {}

  // Create Offer

  async createReward(
    data: CreateRewardDto,
    user: DecodedUser,
    images: Express.Multer.File[],
    qrCode: Express.Multer.File,
  ) {
    try {
      const EndDate = new Date(
        new Date(data.endDate).setHours(23, 59, 59, 999),
      );
      console.log('createReward data:', data);

      const userId = user.id;
      const businessUser = await this.businessUserModel.findById(userId);
      if (!businessUser) return { success: false, message: 'User not found.' };

      if (!user.businessProfile)
        return { success: false, message: 'Business Profile not found.' };

      const business = await this.businessModel.findById(user.businessProfile);
      if (!business) return { success: false, message: 'Business not found.' };

      const businessFolder = await this.driveService.createFolder(userId, {
        parentDirectory: business.drivePath,
        parentType: Folder.name,
        folderName: data.title,
      });
      const now = new Date(data.startDate).setHours(0, 0, 0, 0);
      // if (new Date(data.startDate) < new Date(now)) {
      //   return { success: false, message: 'Start date cannot be in the past.' };
      // }
      if (EndDate < new Date(data.startDate)) {
        return {
          success: false,
          message: 'End date must be after start date.',
        };
      }

      const createObj = {
        ...data,
        businessProfile: new mongoose.Types.ObjectId(user.businessProfile),
        drivePath: new mongoose.Types.ObjectId(businessFolder.data._id),
        creatorType: BusinessUser.name,
        user: new mongoose.Types.ObjectId(userId),
        schedule: {
          startDate: new Date(data.startDate),
          endDate: EndDate,
        },
      };

      const reward = await this.rewardModel.create(createObj);

      const QR_ImageCategory = await this.fileCategoryModel.findOne({
        name: 'Content QR',
      });

      // Generate QR if applicable
      let generatedQR: any = null;
      if (data.activityType === ActivityType.CHECK_IN) {
        generatedQR = await this.driveService.generateQrCode(
          reward.id,
          reward.title,
          userId,
          QR_ImageCategory.id,
          businessFolder.data.id,
        );
        console.log('Generated QR Code:', generatedQR);
      }

      // Handle QR Code upload (if any)
      let QRCodeDetails = null;
      if (qrCode) {
        QRCodeDetails = await this.driveService.uploadAndCreateFile(
          qrCode[0],
          businessFolder.data.id,
          Folder.name,
          userId,
          QR_ImageCategory._id,
        );
      }

      // Upload images async (fire and forget)
      await this.driveService.multiImageUpload(
        userId,
        businessFolder.data.id,
        images,
      );

      // Handle locations if Check-In activity
      let locationIds: mongoose.Types.ObjectId[] = [];
      if (data.activityType === ActivityType.CHECK_IN) {
        let providedLocations: string[] = [];

        if (typeof data.locations === 'string') {
          providedLocations = data.locations
            .split(',')
            .map((id) => id.trim())
            .filter(Boolean);
        } else if (Array.isArray(data.locations)) {
          providedLocations = data.locations;
        }
        providedLocations = [...new Set(providedLocations)];

        if (providedLocations.length === 0) {
          return { success: false, message: 'Please provide locations.' };
        }

        for (const loc of providedLocations) {
          if (!mongoose.isValidObjectId(loc)) {
            return { success: false, message: `Invalid location id: "${loc}"` };
          }
          const outletDoc = await this.outletModel.findById(loc);
          if (!outletDoc) {
            return {
              success: false,
              message: `Outlet with id "${loc}" not found.`,
            };
          }
        }

        for (const loc of providedLocations) {
          const outletDoc = await this.outletModel.findById(loc);
          if (!outletDoc) {
            return {
              success: false,
              message: `Outlet with id "${loc}" not found.`,
            };
          }
          // const isLocationExists = await this.rewardLocationModel.findOne({
          //   reward: reward._id,
          //   businessLocationId: outletDoc._id,
          // });
          // if (isLocationExists) continue;

          const createdLocation = await this.rewardLocationModel.create({
            reward: reward._id,
            businessLocationId: outletDoc._id,
            location: {
              type: 'Point',
              coordinates: [outletDoc.longitude, outletDoc.latitude],
            },
            accuracy: outletDoc.accuracy,
            address1: outletDoc.address1,
            address2: outletDoc.address2 || '',
            city: outletDoc.city,
            state: outletDoc.state,
            zip: outletDoc.postalCode,
            website: outletDoc.website,
            email: outletDoc.email,
            phone: outletDoc.phone,
          });

          locationIds.push(createdLocation._id);
        }
      }

      const updateRewardObj: any = {
        locations: locationIds,
        status: RewardStatus.PUBLISHED,
        QR_CODE: QRCodeDetails?._id || null,
      };

      if (generatedQR) {
        updateRewardObj['activityQrCode'] = generatedQR.data.metaData.url;
      }

      const updatedReward = await this.rewardModel.findByIdAndUpdate(
        reward._id,
        { $set: updateRewardObj },
        { new: true },
      );

      // Notify followers
      if (reward.notifyFollowers) {
        const followersRes = await this.userService.getFollowers(
          user.businessProfile,
        );
        const followers = followersRes?.followers || [];

        if (followers.length > 0) {
          const message = `${business.name} published a new Reward called ${reward.title}`;

          for (const follower of followers) {
            const fcmTokens = await this.tokenModel.find({
              user: follower.follower['_id'],
              type: TokenTypes.FCM,
            });

            for (const token of fcmTokens) {
              this.firebaseService.sendNotification(
                token.token,
                reward.title,
                message,
                { data: NotificationTypes.EVENT, id: reward.id },
              );
            }

            this.notificationModel.create({
              user: follower.follower['_id'],
              userType: User.name,
              message,
              type: NotificationTypes.REWARD,
              reward: reward._id,
              targetType: Business.name,
              targetUser: new mongoose.Types.ObjectId(user.businessProfile),
            });
          }
        }
      }

      return {
        success: true,
        message: 'Reward created successfully',
        data: updatedReward,
      };
    } catch (error) {
      console.error('Error in createReward:', error);
      return { success: false, message: 'Something went wrong.' };
    }
  }

  async updateReward(
    id: string,
    data: UpdateRewardDto,
    user: DecodedUser,
    images: Express.Multer.File[],
    qrCode: Express.Multer.File,
  ) {
    try {
      console.log('Update Reward data:', data);
      const reward = await this.rewardModel.findById(id);
      if (!reward) return { success: false, message: 'Reward not found.' };

      let updateObj = {
        ...data,
      };

      if (data.startDate && data.endDate) {
        // if (new Date(data.startDate) < new Date()) {
        //   return {
        //     success: false,
        //     message: 'Start date must be in the future.',
        //   };
        // }
        // if (new Date(data.endDate) < new Date(data.startDate)) {
        //   return {
        //     success: false,
        //     message: 'End date must be after start date.',
        //   };
        // }
        const EndDate = new Date(
          new Date(data.endDate).setHours(23, 59, 59, 999),
        );
        const now = new Date(data.startDate).setHours(0, 0, 0, 0);
        if (new Date(data.startDate) < new Date(now)) {
          return {
            success: false,
            message: 'Start date cannot be in the past.',
          };
        }
        if (EndDate < new Date(data.startDate)) {
          return {
            success: false,
            message: 'End date must be after start date.',
          };
        }

        updateObj['schedule'] = {
          startDate: new Date(data.startDate),
          endDate: new Date(data.endDate),
        };
      }

      if (data.locations) {
        let locationIds: mongoose.Types.ObjectId[] = [];
        if (reward.activityType === ActivityType.CHECK_IN) {
          let providedLocations: string[] = [];

          if (typeof data.locations === 'string') {
            providedLocations = data.locations
              .split(',')
              .map((id) => id.trim())
              .filter(Boolean);
          } else if (Array.isArray(data.locations)) {
            providedLocations = data.locations;
          }
          providedLocations = [...new Set(providedLocations)];

          for (const loc of providedLocations) {
            if (!mongoose.isValidObjectId(loc)) {
              return {
                success: false,
                message: `Invalid location id: "${loc}"`,
              };
            }
            const outletDoc = await this.outletModel.findById(loc);
            if (!outletDoc) {
              return {
                success: false,
                message: `Outlet with id "${loc}" not found.`,
              };
            }
          }
          await this.rewardLocationModel.deleteMany({
            reward: reward._id,
          });
          await this.rewardModel.updateOne(
            { _id: reward._id },
            { $set: { locations: [] } },
          );

          for (const loc of providedLocations) {
            const outletDoc = await this.outletModel.findById(loc);
            if (!outletDoc) {
              return {
                success: false,
                message: `Outlet with id "${loc}" not found.`,
              };
            }

            const createdLocation = await this.rewardLocationModel.create({
              reward: reward._id,
              businessLocationId: outletDoc._id,
              location: {
                type: 'Point',
                coordinates: [outletDoc.longitude, outletDoc.latitude],
              },
              accuracy: outletDoc.accuracy,
              address1: outletDoc.address1,
              address2: outletDoc.address2 || '',
              city: outletDoc.city,
              state: outletDoc.state,
              zip: outletDoc.postalCode,
              website: outletDoc.website,
              email: outletDoc.email,
              phone: outletDoc.phone,
            });

            locationIds.push(createdLocation._id);
          }
        }
        updateObj['locations'] = locationIds;
      }
      console.log('Update Obj:::', updateObj);

      const updatedReward = await this.rewardModel.findOneAndUpdate(
        { _id: new mongoose.Types.ObjectId(id) },
        { $set: updateObj },
        { new: true },
      );

      const QR_ImageCategory = await this.fileCategoryModel.findOne({
        name: 'Content QR',
      });

      // Handle QR Code upload (if any)
      let QRCodeDetails = null;
      if (qrCode) {
        QRCodeDetails = await this.driveService.uploadAndCreateFile(
          qrCode[0],
          String(reward.drivePath),
          Folder.name,
          user.id,
          QR_ImageCategory._id,
        );
      }

      // Upload images async (fire and forget)
      if (images.length) {
        console.log('Updating Images:::', images.length);
        this.driveService.deleteBufferAndMultiImageUpload(
          user,
          reward.drivePath.toString(),
          '',
          images,
        );
      }

      // Handle locations if Check-In activity

      return {
        success: true,
        message: 'Reward updated successfully',
        data: updatedReward,
      };
    } catch (error) {
      console.error('Error in updateReward:', error);
      return { success: false, message: 'Something went wrong.' };
    }
  }

  async getRewardByIdBusiness(id: string, user: DecodedUser) {
    try {
      // const foundReward = await this.rewardModel
      //   .findById(id)
      //   .populate('locations', LocationPopulates.FOREIGN)
      //   .populate('QR_CODE', 'metaData')
      //   .populate('user', UserPopulates.FOREIGN)
      //   .populate('businessProfile', BusinessPopulates.FOREIGN)
      //   .populate({
      //     path: 'businessProfile',
      //     populate: {
      //       path: 'businessIndustry',
      //       model: BusinessIndustry.name,
      //       select: ' _id title darkIcon lightIcon',
      //     },
      //   })
      //   .populate('locations', LocationPopulates.FOREIGN)
      //   .populate('files');

      const QR_ImageCategory = await this.fileCategoryModel.findOne({
        name: 'Content QR',
      });
      const pipeline = [
        { $match: { _id: new mongoose.Types.ObjectId(id) } },
        // QR_CODE
        {
          $lookup: {
            from: 'files', // collection name for File model
            localField: 'QR_CODE',
            foreignField: '_id',
            as: 'QR_CODE',
          },
        },
        { $unwind: { path: '$QR_CODE', preserveNullAndEmptyArrays: true } },
        // user
        {
          $lookup: {
            from: 'businessusers', // adjust to actual collection name
            localField: 'user',
            foreignField: '_id',
            as: 'user',
          },
        },
        { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },

        // businessProfile
        {
          $lookup: {
            from: 'businesses',
            localField: 'businessProfile',
            foreignField: '_id',
            as: 'businessProfile',
          },
        },
        {
          $unwind: {
            path: '$businessProfile',
            preserveNullAndEmptyArrays: true,
          },
        },

        // businessIndustry inside businessProfile
        {
          $lookup: {
            from: 'businessindustries',
            localField: 'businessProfile.businessIndustry',
            foreignField: '_id',
            as: 'businessProfile.businessIndustry',
          },
        },
        {
          $unwind: {
            path: '$businessProfile.businessIndustry',
            preserveNullAndEmptyArrays: true,
          },
        },

        // locations (repeated populate—only include once in aggregation)
        {
          $lookup: {
            from: 'rewardlocations', // adjust to the actual collection name for locations
            localField: 'locations',
            foreignField: '_id',
            as: 'locations',
            pipeline: [
              {
                $lookup: {
                  from: 'outlets',
                  localField: 'businessLocationId',
                  foreignField: '_id',
                  as: 'businessLocation',
                },
              },
              {
                $unwind: {
                  path: '$businessLocation',
                  preserveNullAndEmptyArrays: true,
                },
              },
            ],
          },
        },

        // files
        {
          $lookup: {
            from: 'files', // assuming this is the same collection as QR_CODE
            let: { folderId: '$drivePath' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$parentDirectory', '$$folderId'] },
                      {
                        $ne: [
                          '$category',
                          new mongoose.Types.ObjectId(QR_ImageCategory.id),
                        ],
                      },
                    ],
                  },
                },
              },
            ],
            as: 'files',
          },
        },
        // {
        //   $project: {
        //     'businessProfile.businessIndustry._id': 1,
        //     'businessProfile.businessIndustry.title': 1,
        //     'businessProfile.businessIndustry.darkIcon': 1,
        //     'businessProfile.businessIndustry.lightIcon': 1,
        //     // other reward fields will be included by default
        //   },
        // },
      ];

      // console.log('latitude:', latitude, 'longitude:', longitude);
      // let pipeline: PipelineStage[] = [
      //   {
      //     $geoNear: {
      //       near: {
      //         type: 'Point',
      //         coordinates: [parseFloat(longitude), parseFloat(latitude)],
      //       },
      //       distanceField: 'distance',
      //       maxDistance: 100000000 * 1000,
      //       spherical: true,
      //     },
      //   },
      //   {
      //     $lookup: {
      //       from: 'rewards',
      //       localField: 'reward',
      //       foreignField: '_id',
      //       as: 'reward',
      //     },
      //   },
      //   { $unwind: '$reward' },
      //   {
      //     $match: {
      //       'reward._id': new mongoose.Types.ObjectId(id),
      //     },
      //   },
      //   {
      //     $lookup: {
      //       from: 'files',
      //       localField: 'reward.QR_CODE',
      //       foreignField: '_id',
      //       as: 'QR_CODE',
      //     },
      //   },
      //   { $unwind: { path: '$QR_CODE', preserveNullAndEmptyArrays: true } },
      //   {
      //     $lookup: {
      //       from: 'files', // assuming this is the same collection as QR_CODE
      //       let: { folderId: '$reward.drivePath' },
      //       pipeline: [
      //         {
      //           $match: {
      //             $expr: {
      //               $and: [
      //                 { $eq: ['$parentDirectory', '$$folderId'] },
      //                 {
      //                   $ne: ['$category', QR_ImageCategory._id],
      //                 },
      //               ],
      //             },
      //           },
      //         },
      //       ],
      //       as: 'files',
      //     },
      //   },
      //   {
      //     $group: {
      //       _id: '$reward._id',
      //       status: { $first: '$reward.status' },
      //       title: { $first: '$reward.title' },
      //       activityType: { $first: '$reward.activityType' },
      //       rewardType: { $first: '$reward.rewardType' },
      //       targetCount: { $first: '$reward.targetCount' },
      //       redemptionMode: { $first: '$reward.redemptionMode' },
      //       locations: { $first: '$reward.locations' },
      //       drivePath: { $first: '$reward.drivePath' },
      //       files: { $first: '$files' },
      //       QR_CODE: { $first: '$QR_CODE' },
      //       rewardExpiration: { $first: '$reward.rewardExpiration' },
      //       description: { $first: '$reward.description' },
      //       schedule: { $first: '$reward.schedule' },
      //       createdAt: { $first: '$reward.createdAt' },
      //       updatedAt: { $first: '$reward.updatedAt' },
      //       __v: { $first: '$reward.__v' },
      //       user: { $first: '$reward.user' },
      //       businessProfile: { $first: '$reward.businessProfile' },
      //       distance: { $first: { $divide: ['$distance', 1609.34] } },
      //     },
      //   },
      //   {
      //     $lookup: {
      //       from: 'businessusers', // adjust to actual collection name
      //       localField: 'user',
      //       foreignField: '_id',
      //       as: 'user',
      //     },
      //   },
      //   { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },

      //   // businessProfile
      //   {
      //     $lookup: {
      //       from: 'businesses',
      //       localField: 'businessProfile',
      //       foreignField: '_id',
      //       as: 'businessProfile',
      //     },
      //   },
      //   {
      //     $unwind: {
      //       path: '$businessProfile',
      //       preserveNullAndEmptyArrays: true,
      //     },
      //   },

      //   // businessIndustry inside businessProfile
      //   {
      //     $lookup: {
      //       from: 'businessindustries',
      //       localField: 'businessProfile.businessIndustry',
      //       foreignField: '_id',
      //       as: 'businessProfile.businessIndustry',
      //     },
      //   },
      //   {
      //     $unwind: {
      //       path: '$businessProfile.businessIndustry',
      //       preserveNullAndEmptyArrays: true,
      //     },
      //   },

      //   // locations (repeated populate—only include once in aggregation)
      //   {
      //     $lookup: {
      //       from: 'rewardlocations', // adjust to the actual collection name for locations
      //       localField: 'locations',
      //       foreignField: '_id',
      //       as: 'locations',
      //       pipeline: [
      //         {
      //           $lookup: {
      //             from: 'outlets',
      //             localField: 'businessLocationId',
      //             foreignField: '_id',
      //             as: 'businessLocation',
      //           },
      //         },
      //         {
      //           $unwind: {
      //             path: '$businessLocation',
      //             preserveNullAndEmptyArrays: true,
      //           },
      //         },
      //       ],
      //     },
      //   },
      //   {
      //     $project: {
      //       'user.password': 0,
      //     },
      //   },
      // ];

      const foundRewardAgg = await this.rewardModel.aggregate(pipeline);
      console.log('FOUNDREWARDAGGGG:::', foundRewardAgg);

      if (!foundRewardAgg || foundRewardAgg.length === 0) {
        return {
          success: false,
          message: 'Reward not found.',
        };
      }
      return {
        success: true,
        message: 'Reward found.',
        data: foundRewardAgg[0],
      };
    } catch (error) {
      console.log('Error in getRewardById:', error);
      return {
        success: false,
        message: 'Something went wrong.',
      };
    }
  }

  async getRewardByIdConsumer(
    id: string,
    user: DecodedUser,
    latitude: string,
    longitude: string,
  ) {
    try {
      // const foundReward = await this.rewardModel
      //   .findById(id)
      //   .populate('locations', LocationPopulates.FOREIGN)
      //   .populate('QR_CODE', 'metaData')
      //   .populate('user', UserPopulates.FOREIGN)
      //   .populate('businessProfile', BusinessPopulates.FOREIGN)
      //   .populate({
      //     path: 'businessProfile',
      //     populate: {
      //       path: 'businessIndustry',
      //       model: BusinessIndustry.name,
      //       select: ' _id title darkIcon lightIcon',
      //     },
      //   })
      //   .populate('locations', LocationPopulates.FOREIGN)
      //   .populate('files');

      const QR_ImageCategory = await this.fileCategoryModel.findOne({
        name: 'Content QR',
      });
      // const pipeline = [
      //   { $match: { _id: new mongoose.Types.ObjectId(id) } },
      //   // QR_CODE
      //   {
      //     $lookup: {
      //       from: 'files', // collection name for File model
      //       localField: 'QR_CODE',
      //       foreignField: '_id',
      //       as: 'QR_CODE',
      //     },
      //   },
      //   { $unwind: { path: '$QR_CODE', preserveNullAndEmptyArrays: true } },
      //   // user
      //   {
      //     $lookup: {
      //       from: 'businessusers', // adjust to actual collection name
      //       localField: 'user',
      //       foreignField: '_id',
      //       as: 'user',
      //     },
      //   },
      //   { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },

      //   // businessProfile
      //   {
      //     $lookup: {
      //       from: 'businesses',
      //       localField: 'businessProfile',
      //       foreignField: '_id',
      //       as: 'businessProfile',
      //     },
      //   },
      //   {
      //     $unwind: {
      //       path: '$businessProfile',
      //       preserveNullAndEmptyArrays: true,
      //     },
      //   },

      //   // businessIndustry inside businessProfile
      //   {
      //     $lookup: {
      //       from: 'businessindustries',
      //       localField: 'businessProfile.businessIndustry',
      //       foreignField: '_id',
      //       as: 'businessProfile.businessIndustry',
      //     },
      //   },
      //   {
      //     $unwind: {
      //       path: '$businessProfile.businessIndustry',
      //       preserveNullAndEmptyArrays: true,
      //     },
      //   },

      //   // locations (repeated populate—only include once in aggregation)
      //   {
      //     $lookup: {
      //       from: 'rewardlocations', // adjust to the actual collection name for locations
      //       localField: 'locations',
      //       foreignField: '_id',
      //       as: 'locations',
      //       pipeline: [
      //         {
      //           $lookup: {
      //             from: 'outlets',
      //             localField: 'businessLocationId',
      //             foreignField: '_id',
      //             as: 'businessLocation',
      //           },
      //         },
      //         {
      //           $unwind: { path: '$businessLocation', preserveNullAndEmptyArrays: true }
      //         }
      //       ]
      //     },
      //   },

      //   // files
      //   {
      //     $lookup: {
      //       from: 'files', // assuming this is the same collection as QR_CODE
      //       let: { folderId: '$drivePath' },
      //       pipeline: [
      //         {
      //           $match: {
      //             $expr: {
      //               $and: [
      //                 { $eq: ['$parentDirectory', '$$folderId'] },
      //                 {
      //                   $ne: [
      //                     '$category',
      //                     new mongoose.Types.ObjectId(QR_ImageCategory.id),
      //                   ],
      //                 },
      //               ],
      //             },
      //           },
      //         },
      //       ],
      //       as: 'files',
      //     },
      //   },
      //   // {
      //   //   $project: {
      //   //     'businessProfile.businessIndustry._id': 1,
      //   //     'businessProfile.businessIndustry.title': 1,
      //   //     'businessProfile.businessIndustry.darkIcon': 1,
      //   //     'businessProfile.businessIndustry.lightIcon': 1,
      //   //     // other reward fields will be included by default
      //   //   },
      //   // },
      // ];
      console.log('latitde:', latitude, 'longitude:', longitude);
      let pipeline: PipelineStage[] = [
        {
          $geoNear: {
            near: {
              type: 'Point',
              coordinates: [parseFloat(longitude), parseFloat(latitude)],
            },
            distanceField: 'distance',
            maxDistance: 100000000 * 1000,
            spherical: true,
          },
        },
        {
          $lookup: {
            from: 'rewards',
            localField: 'reward',
            foreignField: '_id',
            as: 'reward',
          },
        },
        { $unwind: '$reward' },
        {
          $match: {
            'reward._id': new mongoose.Types.ObjectId(id),
          },
        },
        {
          $lookup: {
            from: 'files',
            localField: 'reward.QR_CODE',
            foreignField: '_id',
            as: 'QR_CODE',
          },
        },
        { $unwind: { path: '$QR_CODE', preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: 'files', // assuming this is the same collection as QR_CODE
            let: { folderId: '$reward.drivePath' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$parentDirectory', '$$folderId'] },
                      {
                        $ne: ['$category', QR_ImageCategory._id],
                      },
                    ],
                  },
                },
              },
            ],
            as: 'files',
          },
        },
        {
          $group: {
            _id: '$reward._id',
            status: { $first: '$reward.status' },
            title: { $first: '$reward.title' },
            activityType: { $first: '$reward.activityType' },
            rewardType: { $first: '$reward.rewardType' },
            targetCount: { $first: '$reward.targetCount' },
            redemptionMode: { $first: '$reward.redemptionMode' },
            locations: { $first: '$reward.locations' },
            drivePath: { $first: '$reward.drivePath' },
            files: { $first: '$files' },
            QR_CODE: { $first: '$QR_CODE' },
            rewardExpiration: { $first: '$reward.rewardExpiration' },
            description: { $first: '$reward.description' },
            schedule: { $first: '$reward.schedule' },
            createdAt: { $first: '$reward.createdAt' },
            updatedAt: { $first: '$reward.updatedAt' },
            __v: { $first: '$reward.__v' },
            user: { $first: '$reward.user' },
            businessProfile: { $first: '$reward.businessProfile' },
            distance: { $first: { $divide: ['$distance', 1609.34] } },
          },
        },
        {
          $lookup: {
            from: 'businessusers', // adjust to actual collection name
            localField: 'user',
            foreignField: '_id',
            as: 'user',
          },
        },
        { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },

        // businessProfile
        {
          $lookup: {
            from: 'businesses',
            localField: 'businessProfile',
            foreignField: '_id',
            as: 'businessProfile',
          },
        },
        {
          $unwind: {
            path: '$businessProfile',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: 'follows', // make sure it's the actual collection name
            let: {
              userId: new mongoose.Types.ObjectId(user.id), // assuming userId is available in the scope
              targetId: '$businessProfile._id',
              targetType: Business.name,
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$follower', '$$userId'] },
                      { $eq: ['$followerType', 'User'] },
                      { $eq: ['$following', '$$targetId'] },
                      { $eq: ['$followingType', '$$targetType'] },
                      { $eq: ['$isBlocked', false] },
                    ],
                  },
                },
              },
            ],
            as: 'userFollow',
          },
        },
        {
          $addFields: {
            isFollowedByMe: {
              $gt: [{ $size: '$userFollow' }, 0],
            },
          },
        },

        // businessIndustry inside businessProfile
        {
          $lookup: {
            from: 'businessindustries',
            localField: 'businessProfile.businessIndustry',
            foreignField: '_id',
            as: 'businessProfile.businessIndustry',
          },
        },
        {
          $unwind: {
            path: '$businessProfile.businessIndustry',
            preserveNullAndEmptyArrays: true,
          },
        },

        // locations (repeated populate—only include once in aggregation)
        {
          $lookup: {
            from: 'rewardlocations', // adjust to the actual collection name for locations
            localField: 'locations',
            foreignField: '_id',
            as: 'locations',
            pipeline: [
              {
                $lookup: {
                  from: 'outlets',
                  localField: 'businessLocationId',
                  foreignField: '_id',
                  as: 'businessLocation',
                },
              },
              {
                $unwind: {
                  path: '$businessLocation',
                  preserveNullAndEmptyArrays: true,
                },
              },
            ],
          },
        },

        //Add a distance key to every object inside locations
        {
          $addFields: {
            locations: {
              $map: {
                input: '$locations',
                as: 'location',
                in: {
                  $mergeObjects: [
                    '$$location',
                    {
                      distance: '$distance',
                    },
                  ],
                },
              },
            },
          },
        },
        {
          $project: {
            'user.password': 0,
          },
        },
      ];

      const foundRewardAgg = await this.rewardLocationModel.aggregate(pipeline);

      if (!foundRewardAgg || foundRewardAgg.length === 0) {
        return {
          success: false,
          message: 'Reward not found.',
        };
      }
      return {
        success: true,
        message: 'Reward found.',
        data: foundRewardAgg[0],
      };
    } catch (error) {
      console.log('Error in getRewardById:', error);
      return {
        success: false,
        message: 'Something went wrong.',
      };
    }
  }

  async getAllRewards(
    user: DecodedUser,
    status: string,
    search: string,
    page: number,
    limit: number,
  ) {
    try {
      const userId = user.id;
      if (!user.businessProfile) {
        return {
          success: false,
          message: 'Business not found.',
        };
      }
      const business = await this.businessModel.findById(user.businessProfile);
      if (!business) {
        return {
          success: false,
          message: 'Business not found.',
        };
      }
      console.log('Business details:', business);
      // const rewards = await this.rewardModel
      //   .find({ businessProfile: business._id })
      //   .populate('locations', LocationPopulates.FOREIGN)
      //   .populate('QR_CODE', 'metaData')
      //   // .populate('drivePath')
      //   .populate('user', UserPopulates.FOREIGN)
      //   .populate('businessProfile', BusinessPopulates.FOREIGN)
      //   .populate('files');
      // if (!rewards || rewards.length === 0) {
      //   return {
      //     success: false,
      //     message: 'No rewards found.',
      //   };
      // }

      const QR_ImageCategory = await this.fileCategoryModel.findOne({
        name: 'Content QR',
      });
      let match: any = { businessProfile: business._id };
      if (status === 'active') {
        match['schedule.endDate'] = { $gte: new Date() };
      } else if (status === 'expired') {
        match['schedule.endDate'] = { $lt: new Date() };
      }
      if (search) {
        // Search matching business profile name
        match['$or'] = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
        ];
      }
      const pipeline: any = [
        { $match: match },
        { $sort: { createdAt: -1 } },
        // QR_CODE
        {
          $lookup: {
            from: 'files', // collection name for File model
            localField: 'QR_CODE',
            foreignField: '_id',
            as: 'QR_CODE',
          },
        },
        { $unwind: { path: '$QR_CODE', preserveNullAndEmptyArrays: true } },
        // user
        {
          $lookup: {
            from: 'businessusers', // adjust to actual collection name
            localField: 'user',
            foreignField: '_id',
            as: 'user',
          },
        },
        { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },

        // businessProfile
        {
          $lookup: {
            from: 'businesses',
            localField: 'businessProfile',
            foreignField: '_id',
            as: 'businessProfile',
          },
        },
        {
          $unwind: {
            path: '$businessProfile',
            preserveNullAndEmptyArrays: true,
          },
        },

        // businessIndustry inside businessProfile
        {
          $lookup: {
            from: 'businessindustries',
            localField: 'businessProfile.businessIndustry',
            foreignField: '_id',
            as: 'businessProfile.businessIndustry',
          },
        },
        {
          $unwind: {
            path: '$businessProfile.businessIndustry',
            preserveNullAndEmptyArrays: true,
          },
        },

        // locations (repeated populate—only include once in aggregation)
        {
          $lookup: {
            from: 'rewardlocations', // adjust to the actual collection name for locations
            localField: 'locations',
            foreignField: '_id',
            as: 'locations',
          },
        },

        // files
        {
          $lookup: {
            from: 'files', // assuming this is the same collection as QR_CODE
            let: { folderId: '$drivePath' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$parentDirectory', '$$folderId'] },
                      {
                        $ne: [
                          '$category',
                          new mongoose.Types.ObjectId(QR_ImageCategory.id),
                        ],
                      },
                    ],
                  },
                },
              },
            ],
            as: 'files',
          },
        },
        {
          $lookup: {
            from: 'userrewards',
            let: { rewardId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$rewardId', '$$rewardId'] },
                      {
                        $eq: ['$claimStatus', ClaimStatus.ACTIVE],
                      },
                    ],
                  },
                },
              },
            ],
            as: 'activeRewards',
          },
        },
        {
          $addFields: {
            activeParticipants: { $size: '$activeRewards' },
          },
        },
        // {
        //   $project: {
        //     'businessProfile.businessIndustry._id': 1,
        //     'businessProfile.businessIndustry.title': 1,
        //     'businessProfile.businessIndustry.darkIcon': 1,
        //     'businessProfile.businessIndustry.lightIcon': 1,
        //     // other reward fields will be included by default
        //   },
        // },
      ];

      const foundRewardAgg = await this.rewardModel.aggregate(pipeline);
      const total = await this.rewardModel.countDocuments({
        businessProfile: business._id,
      });

      return {
        success: true,
        message: 'Rewards found successfully.',
        data: foundRewardAgg,
        total: total,
        pages: Math.ceil(total / limit),
        page: page,
        limit: limit,
      };
    } catch (error) {
      console.log('Error in getAllRewards:', error);
      return {
        success: false,
        message: 'Something went wrong.',
      };
    }
  }

  async getDashboardRewards(
    user: DecodedUser,
    data: GetRewardDashboardDto,
    search: string,
    activityType: string[],
    distance: number,
    page: number,
    limit: number,
  ) {
    try {
      const now = new Date();
      let consumerId = user.id;
      let skip = (page - 1) * limit;
      const QR_ImageCategory = await this.fileCategoryModel.findOne({
        name: 'Content QR',
      });

      let match = {};
      if (search) {
        // Search matching business profile name
        const matchingBusinesses = await this.businessModel.find({
          name: { $regex: search, $options: 'i' },
        });
        // keep the search queries as it is, just add the business profile ids to the match query if the event creatorType is BusinessProfile
        const businessProfileIds = matchingBusinesses.map(
          (business) => business._id,
        );
        match['$or'] = [
          { 'reward.title': { $regex: search, $options: 'i' } },
          { 'reward.description': { $regex: search, $options: 'i' } },
          { 'reward.businessProfile': { $in: businessProfileIds } },
        ];
      }
      if (data.startDate) {
        match['reward.schedule.startDate'] = {
          $gte: new Date(data.startDate),
        };
      }
      if (data.endDate) {
        match['reward.schedule.endDate'] = {
          $lte: new Date(data.endDate),
        };
      } else {
        match['reward.schedule.endDate'] = { $gte: now };
      }
      if (activityType.length > 0) {
        console.log('ADDING ACTIVITY TYPE TO MATCH:::', activityType);
        match['reward.activityType'] = { $in: activityType };
      }
      if (data.rewardType && data.rewardType.length > 0) {
        match['reward.rewardType'] = { $in: data.rewardType };
      }


      let pipeline: PipelineStage[] = [
        {
          $geoNear: {
            near: {
              type: 'Point',
              coordinates: [
                parseFloat(data.longitude),
                parseFloat(data.latitude),
              ],
            },
            distanceField: 'distance',
            maxDistance: distance * 1609.34,
            spherical: true,
          },
        },
        {
          $lookup: {
            from: 'rewards',
            localField: 'reward',
            foreignField: '_id',
            as: 'reward',
          },
        },
        { $unwind: '$reward' },
        {
          $lookup: {
            from: 'userrewards',
            let: { rewardId: '$reward._id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$rewardId', '$$rewardId'] },
                      {
                        $eq: [
                          '$userId',
                          new mongoose.Types.ObjectId(consumerId),
                        ],
                      },
                    ],
                  },
                },
              },
            ],
            as: 'claimed',
          },
        },
        {
          $addFields: {
            isEnrolled: {
              $cond: {
                if: { $gt: [{ $size: '$claimed' }, 0] },
                then: true,
                else: false,
              },
            },
          },
        },
        {
          $match: {
            ...match,
            'reward.status': RewardStatus.PUBLISHED,
          },
        },
        {
          $lookup: {
            from: 'files',
            localField: 'reward.QR_CODE',
            foreignField: '_id',
            as: 'QR_CODE',
          },
        },
        { $unwind: { path: '$QR_CODE', preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: 'files', // assuming this is the same collection as QR_CODE
            let: { folderId: '$reward.drivePath' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$parentDirectory', '$$folderId'] },
                      {
                        $ne: ['$category', QR_ImageCategory._id],
                      },
                    ],
                  },
                },
              },
            ],
            as: 'files',
          },
        },
        {
          $group: {
            _id: '$reward._id',
            status: { $first: '$reward.status' },
            title: { $first: '$reward.title' },
            activityType: { $first: '$reward.activityType' },
            rewardType: { $first: '$reward.rewardType' },
            targetCount: { $first: '$reward.targetCount' },
            redemptionMode: { $first: '$reward.redemptionMode' },
            locations: { $first: '$reward.locations' },
            drivePath: { $first: '$reward.drivePath' },
            files: { $first: '$files' },
            QR_CODE: { $first: '$QR_CODE' },
            rewardExpiration: { $first: '$reward.rewardExpiration' },
            description: { $first: '$reward.description' },
            schedule: { $first: '$reward.schedule' },
            createdAt: { $first: '$reward.createdAt' },
            updatedAt: { $first: '$reward.updatedAt' },
            __v: { $first: '$reward.__v' },
            user: { $first: '$reward.user' },
            businessProfile: { $first: '$reward.businessProfile' },
            distance: { $first: { $divide: ['$distance', 1609.34] } },
            isEnrolled: { $first: '$isEnrolled'}
          },
        },
        {
          $lookup: {
            from: 'businesses',
            localField: 'businessProfile',
            foreignField: '_id',
            as: 'businessProfile',
          },
        },
        {
          $unwind: {
            path: '$businessProfile',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: 1,
            status: 1,
            title: 1,
            activityType: 1,
            rewardType: 1,
            targetCount: 1,
            redemptionMode: 1,
            locations: 1,
            drivePath: 1,
            files: 1,
            QR_CODE: 1,
            rewardExpiration: 1,
            description: 1,
            schedule: 1,
            createdAt: 1,
            updatedAt: 1,
            __v: 1,
            user: 1,
            businessProfile: {
              _id: '$businessProfile._id',
              name: '$businessProfile.name',
              businessIndustry: '$businessProfile.businessIndustry',
            },
            isEnrolled: 1,
          },
        },
        { $sort: { createdAt: -1, distance: 1, _id: 1 } },
        {
          $facet: {
            data: [{ $skip: skip }, { $limit: limit }],
            totalCount: [{ $count: 'count' }],
          },
        },
      ];

      const result = await this.rewardLocationModel.aggregate(pipeline);
      console.log('REWARDSS DATA:::', result);

      // const result = await this.rewardModel
      //   .find()
      //   .populate('locations', LocationPopulates.FOREIGN)
      //   .populate('QR_CODE', 'metaData')
      //   // .populate('drivePath')
      //   .populate('user', UserPopulates.FOREIGN)
      //   .populate('businessProfile', BusinessPopulates.FOREIGN)
      //   .populate('files')
      //   .skip((page - 1) * limit)
      //   .limit(limit);
      return {
        success: true,
        message: 'Rewards found successfully.',
        data: result[0].data,
        total: result[0].totalCount[0]?.count || 0,
        pages: Math.ceil((result[0].totalCount[0]?.count || 0) / limit),
        page: page,
        limit: limit,
      };
    } catch (error) {
      console.log('Error in getDashboardRewards:', error);
      return {
        success: false,
        message: 'Something went wrong.',
      };
    }
  }

  async enrollReward(rewardId: string, user: DecodedUser) {
    try {
      const userId = user.id;
      const userDetails = await this.userModel.findById(userId);
      if (!userDetails) {
        return {
          success: false,
          message: 'User not found.',
        };
      }

      const reward = await this.rewardModel.findById(rewardId);
      if (!reward) {
        return {
          success: false,
          message: 'Reward not found.',
        };
      }
      const isAlreadyEnrolled = await this.userRewardModel.findOne({
        userId: new mongoose.Types.ObjectId(userId),
        rewardId: new mongoose.Types.ObjectId(rewardId),
      });
      console.log('isAlreadyEnrolled:', isAlreadyEnrolled);
      if (isAlreadyEnrolled) {
        return {
          success: false,
          message: 'Already enrolled in this reward.',
        };
      }

      let enrollReward = await this.userRewardModel.create({
        userId: new mongoose.Types.ObjectId(userId),
        businessProfile: new mongoose.Types.ObjectId(reward.businessProfile),
        rewardId: new mongoose.Types.ObjectId(rewardId),
        target: reward.targetCount,
      });
      let message = `User ${userDetails.name} enrolled in reward ${reward.title}`;

      this.businessService.businessNotification(
        user.id,
        rewardId,
        NotificationTypes.REWARD,
        message,
      );

      return {
        success: true,
        message: 'Reward enrolled successfully',
        data: enrollReward,
      };
    } catch (error) {
      console.log('Error in enrollReward:', error);
      return {
        success: false,
        message: 'Something went wrong.',
      };
    }
  }
  async getUserRewards(
    user: DecodedUser,
    claimStatus: string,
    page: number,
    limit: number,
  ) {
    try {
      if (!Object.values(ClaimStatus).includes(claimStatus)) {
        return {
          success: false,
          message: 'Invalid claim status.',
        };
      }
      const userId = user.id;
      const userDetails = await this.userModel.findById(userId);
      if (!userDetails) {
        return {
          success: false,
          message: 'User not found.',
        };
      }
      const QR_ImageCategory = await this.fileCategoryModel.findOne({
        name: 'Content QR',
      });
      const rewards = await this.userRewardModel.aggregate([
        {
          $match: {
            userId: new mongoose.Types.ObjectId(userId),
            claimStatus: claimStatus,
          },
        },
        {
          $lookup: {
            from: 'users', // the collection name for User model
            localField: 'userId',
            foreignField: '_id',
            as: 'user',
          },
        },
        {
          $lookup: {
            from: 'rewards', // the collection name for Reward model
            localField: 'rewardId',
            foreignField: '_id',
            as: 'reward',
          },
        },
        {
          $unwind: { path: '$reward', preserveNullAndEmptyArrays: true },
        },
        {
          $unwind: {
            path: '$user',
            preserveNullAndEmptyArrays: true, // optional if user might not exist
          },
        },
        {
          $lookup: {
            from: 'files',
            localField: 'reward.QR_CODE',
            foreignField: '_id',
            as: 'QR_CODE',
          },
        },
        { $unwind: { path: '$QR_CODE', preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: 'files', // assuming this is the same collection as QR_CODE
            let: { folderId: '$reward.drivePath' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$parentDirectory', '$$folderId'] },
                      {
                        $ne: [
                          '$category',
                          new mongoose.Types.ObjectId(QR_ImageCategory.id),
                        ],
                      },
                    ],
                  },
                },
              },
            ],
            as: 'files',
          },
        },
        {
          $lookup: {
            from: 'businesses',
            localField: 'businessProfile',
            foreignField: '_id',
            as: 'businessProfile',
          },
        },
        {
          $unwind: {
            path: '$businessProfile',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: 1,
            rewardId: '$reward._id',
            userId: 1,
            claimStatus: '$reward.claimStatus',
            files: 1,
            title: '$reward.title',
            rewardType: '$reward.rewardType',
            targetCount: '$reward.targetCount',
            redemptionMode: '$reward.redemptionMode',
            activityType: '$reward.activityType',
            rewardExpiration: '$reward.rewardExpiration',
            description: '$reward.description',
            schedule: '$reward.schedule',
            user: {
              _id: '$user._id',
              name: '$user.name', // only include 'name' from populated user
            },
            QR_CODE: {
              _id: '$QR_CODE._id',
              metaData: {
                name: '$QR_CODE.metaData.name',
                url: '$QR_CODE.metaData.url',
              },
            },
            businessProfile: {
              _id: '$businessProfile._id',
              name: '$businessProfile.name',
            },
          },
        },
        { $skip: (page - 1) * limit },
        { $limit: limit },
      ]);

      const total = await this.userRewardModel.countDocuments({
        userId: new mongoose.Types.ObjectId(userId),
        claimStatus: claimStatus,
      });
      return {
        success: true,
        message: 'Rewards found successfully.',
        data: rewards,
        total: total,
        pages: Math.ceil(total / limit),
        page: page,
        limit: limit,
      };
    } catch (error) {
      console.log('Error in getUserRewards:', error);
      return {
        success: false,
        message: 'Something went wrong.',
      };
    }
  }
  async claimReward(user: DecodedUser, userRewardId: string) {
    try {
      const userId = user.id;
      const userDetails = await this.userModel.findById(userId);
      if (!userDetails) {
        return {
          success: false,
          message: 'User not found.',
        };
      }
      const userReward = await this.userRewardModel.findById(userRewardId);
      if (!userReward) {
        return {
          success: false,
          message: 'User reward not found.',
        };
      }

      const reward = await this.rewardModel
        .findById(userReward.rewardId)
        .populate('QR_CODE');
      if (!reward) {
        return {
          success: false,
          message: 'Reward not found.',
        };
      }
      const userRewardLink = await this.userRewardModel.findOne({
        userId: new mongoose.Types.ObjectId(userId),
        rewardId: new mongoose.Types.ObjectId(reward._id),
      });
      if (userRewardLink.claimStatus === ClaimStatus.CLAIMED) {
        return {
          success: false,
          message: 'Already claimed this reward.',
        };
      }
      if (
        userRewardLink.claimStatus === ClaimStatus.EXPIRED ||
        reward.schedule.endDate < new Date()
      ) {
        return {
          success: false,
          message: 'Reward has expired.',
        };
      }
      if (userRewardLink.progress < reward.targetCount) {
        return {
          success: false,
          message: 'Reward not yet completed.',
        };
      }

      await this.userRewardModel.findByIdAndUpdate(userRewardLink._id, {
        $set: {
          claimStatus: ClaimStatus.CLAIMED,
          claimedAt: new Date(),
        },
      });
      let message = `User ${userDetails.name} claimed in reward ${reward.title}`;
      this.businessService.businessNotification(
        user.id,
        reward.id,
        NotificationTypes.REWARD,
        message,
      );

      return {
        success: true,
        message: 'Reward claimed successfully.',
        // data: userRewardLink,
      };
    } catch (error) {
      console.log('Error in claimReward:', error);
      return {
        success: false,
        message: 'Something went wrong.',
      };
    }
  }
  async getUserRewardById(
    id: string,
    user: DecodedUser,
    latitude: string,
    longitude: string,
  ) {
    try {
      if (!id || !user) {
        throw new Error('Invalid parameters');
      }
      const userReward = await this.userRewardModel.findOne({
        userId: new mongoose.Types.ObjectId(user.id),
        rewardId: new mongoose.Types.ObjectId(id),
      });
      if (!userReward) {
        return {
          success: false,
          message: 'Please Enroll first',
        };
      }

      const QR_ImageCategory = await this.fileCategoryModel.findOne({
        name: 'Content QR',
      });
      console.log('latitde:', latitude, 'longitude:', longitude);
      let pipeline: PipelineStage[] = [
        {
          $geoNear: {
            near: {
              type: 'Point',
              coordinates: [parseFloat(longitude), parseFloat(latitude)],
            },
            distanceField: 'distance',
            maxDistance: 100000000 * 1000,
            spherical: true,
          },
        },
        {
          $lookup: {
            from: 'rewards',
            localField: 'reward',
            foreignField: '_id',
            as: 'reward',
          },
        },
        { $unwind: '$reward' },
        {
          $match: {
            'reward._id': new mongoose.Types.ObjectId(id),
          },
        },
        {
          $lookup: {
            from: 'files',
            localField: 'reward.QR_CODE',
            foreignField: '_id',
            as: 'QR_CODE',
          },
        },
        { $unwind: { path: '$QR_CODE', preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: 'files', // assuming this is the same collection as QR_CODE
            let: { folderId: '$reward.drivePath' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$parentDirectory', '$$folderId'] },
                      {
                        $ne: ['$category', QR_ImageCategory._id],
                      },
                    ],
                  },
                },
              },
            ],
            as: 'files',
          },
        },
        {
          $group: {
            _id: '$reward._id',
            status: { $first: '$reward.status' },
            title: { $first: '$reward.title' },
            activityType: { $first: '$reward.activityType' },
            rewardType: { $first: '$reward.rewardType' },
            targetCount: { $first: '$reward.targetCount' },
            redemptionMode: { $first: '$reward.redemptionMode' },
            locations: { $first: '$reward.locations' },
            drivePath: { $first: '$reward.drivePath' },
            files: { $first: '$files' },
            QR_CODE: { $first: '$QR_CODE' },
            rewardExpiration: { $first: '$reward.rewardExpiration' },
            description: { $first: '$reward.description' },
            schedule: { $first: '$reward.schedule' },
            createdAt: { $first: '$reward.createdAt' },
            updatedAt: { $first: '$reward.updatedAt' },
            __v: { $first: '$reward.__v' },
            user: { $first: '$reward.user' },
            businessProfile: { $first: '$reward.businessProfile' },
            distance: { $first: { $divide: ['$distance', 1609.34] } },
          },
        },
        {
          $lookup: {
            from: 'businessusers', // adjust to actual collection name
            localField: 'user',
            foreignField: '_id',
            as: 'user',
          },
        },
        { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },

        // businessProfile
        {
          $lookup: {
            from: 'businesses',
            localField: 'businessProfile',
            foreignField: '_id',
            as: 'businessProfileDetails',
          },
        },
        {
          $unwind: {
            path: '$businessProfileDetails',
            preserveNullAndEmptyArrays: true,
          },
        },

        // businessIndustry inside businessProfile
        {
          $lookup: {
            from: 'businessindustries',
            localField: 'businessProfile.businessIndustry',
            foreignField: '_id',
            as: 'businessProfile.businessIndustry',
          },
        },
        {
          $unwind: {
            path: '$businessProfile.businessIndustry',
            preserveNullAndEmptyArrays: true,
          },
        },

        // locations (repeated populate—only include once in aggregation)
        {
          $lookup: {
            from: 'rewardlocations', // adjust to the actual collection name for locations
            localField: 'locations',
            foreignField: '_id',
            as: 'locations',
            pipeline: [
              {
                $lookup: {
                  from: 'outlets',
                  localField: 'businessLocationId',
                  foreignField: '_id',
                  as: 'businessLocation',
                },
              },
              {
                $unwind: {
                  path: '$businessLocation',
                  preserveNullAndEmptyArrays: true,
                },
              },
            ],
          },
        },

        //Add a distance key to every object inside locations
        {
          $addFields: {
            locations: {
              $map: {
                input: '$locations',
                as: 'location',
                in: {
                  $mergeObjects: [
                    '$$location',
                    {
                      distance: '$distance',
                    },
                  ],
                },
              },
            },
          },
        },

        {
          $lookup: {
            from: 'userrewards',
            pipeline: [
              {
                $match: {
                  rewardId: new mongoose.Types.ObjectId(id),
                  userId: new mongoose.Types.ObjectId(user.id),
                },
              },
            ],
            as: 'userReward',
          },
        },
        {
          $unwind: {
            path: '$userReward',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: 1,
            status: 1,
            title: 1,
            activityType: 1,
            rewardType: 1,
            targetCount: 1,
            redemptionMode: 1,
            locations: 1,
            files: 1,
            rewardExpiration: 1,
            description: 1,
            schedule: 1,
            createdAt: 1,
            distance: 1,
            businessProfileDetails: {
              _id: '$businessProfileDetails._id',
              name: '$businessProfileDetails.name',
              cover: '$businessProfileDetails.cover',
              logo: '$businessProfileDetails.logo',
              email: '$businessProfileDetails.email',
              phone: '$businessProfileDetails.phone',
              countryCode: '$businessProfileDetails.countryCode',
              website: '$businessProfileDetails.website',
              followersCount: '$businessProfileDetails.followersCount',
              description: '$businessProfileDetails.description',
            },
            progress: '$userReward.progress',
            claimStatus: '$userReward.claimStatus',
          },
        },
      ];

      const foundRewardAgg = await this.rewardLocationModel.aggregate(pipeline);

      if (!foundRewardAgg || foundRewardAgg.length === 0) {
        return {
          success: false,
          message: 'Reward not found.',
        };
      }

      return {
        success: true,
        message: 'Reward found.',
        data: foundRewardAgg[0],
      };
    } catch (error) {
      console.log('Error in getRewardById:', error);
      return {
        success: false,
        message: 'Something went wrong.',
      };
    }
  }

  async getLogistics(user: DecodedUser) {
    try {
      const userId = user.id;
      const businessId = user.businessProfile;
      if (!businessId) {
        return {
          success: false,
          message: 'Business not found.',
        };
      }
      const logistics = await this.userRewardModel.aggregate([
        {
          $match: {
            businessProfile: new mongoose.Types.ObjectId(businessId),
            claimStatus: ClaimStatus.ACTIVE,
          },
        },
        {
          $count: 'activeParticipants',
        },
        {
          $group: {
            _id: '$rewardId',
            activeRewards: { $sum: 1 },
            activeParticipants: { $first: '$activeParticipants' },
          },
        },
      ]);
      console.log('Logistics:', logistics);
      return {
        success: true,
        message: 'Logistics found successfully.',
        data: logistics[0],
      };
    } catch (error) {
      console.log('Error in getLogistics:', error);
      return {
        success: false,
        message: 'Something went wrong.',
      };
    }
  }
  async getBusinessRewardById(
    id: string,
    user: DecodedUser,
    claimStatus: string,
  ) {
    let matchQuery: any = {
      businessProfile: new mongoose.Types.ObjectId(user.businessProfile),
      rewardId: new mongoose.Types.ObjectId(id),
    };
    if (claimStatus) {
      matchQuery.claimStatus = claimStatus; // Add claim status filter if provided
    }
    const [result] = await this.userRewardModel.aggregate([
      {
        $match: matchQuery,
      },
      {
        $lookup: {
          from: 'rewards',
          localField: 'rewardId',
          foreignField: '_id',
          as: 'reward',
        },
      },
      { $unwind: '$reward' },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $facet: {
          data: [
            {
              $project: {
                _id: 1,
                userId: 1,
                claimStatus: 1,
                progress: 1,
                rewardId: '$reward._id',
                title: '$reward.title',
                rewardType: '$reward.rewardType',
                targetCount: '$reward.targetCount',
                redemptionMode: '$reward.redemptionMode',
                activityType: '$reward.activityType',
                rewardExpiration: '$reward.rewardExpiration',
                description: '$reward.description',
                user: {
                  _id: '$user._id',
                  name: '$user.name',
                  email: '$user.email',
                  phone: '$user.phone',
                  profilePhoto: '$user.profilePhoto',
                },
              },
            },
          ],
          claimStatusCounts: [
            {
              $group: {
                _id: '$claimStatus',
                count: { $sum: 1 },
              },
            },
          ],
        },
      },
    ]);

    console.log('result:', result);
    return {
      success: true,
      message: 'Rewards found successfully.',
      data: result.data,
      claimStatusCounts: result.claimStatusCounts,
    };
  }

  async handleScanReward(rewardId: string, userId: string) {
    try {
      const foundReward = await this.rewardModel.findById(rewardId);
      if (!foundReward) {
        return {
          success: false,
          message: 'Reward Expired',
        };
      }
      if (foundReward.schedule.endDate < new Date()) {
        return {
          success: false,
          message: 'Reward Expired',
        };
      }
      if (foundReward.status !== RewardStatus.PUBLISHED) {
        return {
          success: false,
          message: 'Reward is closed.',
        };
      }

      const user = await this.userModel.findById(userId);
      if (!user) {
        return {
          success: false,
          message: 'User not found.',
        };
      }
      const userReward = await this.userRewardModel.findOne({
        userId: new mongoose.Types.ObjectId(userId),
        rewardId: new mongoose.Types.ObjectId(rewardId),
      });
      if (!userReward) {
        return {
          success: false,
          message: 'Please Enroll this reward first.',
        };
      }
      if (userReward.progress >= userReward.target) {
        return {
          success: false,
          message: 'Reward already completed.',
        };
      }
      const updatedReward = await this.userRewardModel.findOneAndUpdate(
        {
          _id: userReward._id,
        },
        {
          $inc: { progress: 1 },
        },
      );
      return {
        success: true,
        message: 'Reward scanned successfully.',
        data: updatedReward,
      };
    } catch (error) {
      console.log('Error in handleScanReward:', error);
      return {
        success: false,
        message: 'Something went wrong.',
      };
    }
  }

  async generateRewardUrl({
    title,
    description,
    imageUrl,
    rewardId,
  }: GenerateRewardUrlDto) {
    if (!mongoose.isValidObjectId(rewardId)) {
      return {
        success: false,
        message: 'Please provide a valid reward id',
        rewardUrl: undefined,
      };
    }
    const successResponse = {
      success: true,
      message: 'rewardUrl successfully generated',
      rewardUrl: '',
      rewardDescription: '${title} by ${rewardId} brought to you by PinnTag.',
    };

    const rewardInfo = await this.rewardModel.findById(rewardId);
    const rewardUrl = `${process.env.EVENT_BASE_URL}${rewardId.toString()}`;
    let eventDescription = '';

    //fetch the schedule whose date is greater than or equal to the current date
    const now = new Date();
    const todaysDate = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    ).toISOString();

    if (rewardInfo.schedule) {
      let requiredSchedule = rewardInfo.schedule.startDate;
      eventDescription = getStringDateTzWithTime(new Date(requiredSchedule));
    }
    let business = await this.businessModel.findById(
      rewardInfo.businessProfile,
    );
    const result = await this.dynamicLinkService.generateShortLink(rewardUrl, {
      title,
      description: eventDescription,
      imageUrl,
      businessName: business.name,
    });
    const { shortLink } = result;
    await this.rewardModel.findByIdAndUpdate(rewardId, {
      $set: {
        rewardUrl: shortLink,
      },
    });
    successResponse.rewardUrl = shortLink;

    // if (eventInfo.eventUrl) {
    //   console.log(`IS it working ${eventInfo}`);
    //   successResponse.eventUrl = eventInfo.eventUrl;
    // } else {
    //   const eventUrl = `${process.env.EVENT_BASE_URL}${eventId.toString()}`;
    //   const result = await this.dynamicLinkService.generateShortLink(eventUrl, {
    //     title: title,
    //     description: description,
    //     imageUrl: imageUrl,
    //   });
    //   const { shortLink } = result;
    //   await this.eventModel.findByIdAndUpdate(eventId, {
    //     $set: {
    //       eventUrl: shortLink,
    //     },
    //   });
    //   successResponse.eventUrl = shortLink;
    // }
    console.log('Title, Description, ImageUrl:', title, description, imageUrl);
    console.log('Success Response:', successResponse);

    return successResponse;
  }
  async deleteReward(rewardId: string, userId: string) {
    try {
      if (!mongoose.isValidObjectId(rewardId)) {
        return {
          success: false,
          message: 'Please provide a valid reward id',
        };
      }
      const reward = await this.rewardModel.findById(rewardId);

      if (!reward) {
        return {
          success: false,
          message: 'Reward not found',
        };
      }
      const result = await this.rewardModel.deleteOne({
        _id: new mongoose.Types.ObjectId(rewardId),
      });
      await this.rewardLocationModel.deleteMany({
        reward: new mongoose.Types.ObjectId(rewardId),
      });
      await this.userRewardModel.deleteMany({
        rewardId: new mongoose.Types.ObjectId(rewardId),
      });
      await this.fileModel.deleteMany({
        parentDirectory: new mongoose.Types.ObjectId(reward.drivePath),
      });
      return {
        success: true,
        message: 'Reward deleted successfully.',
      };
    } catch (error) {
      console.error('Error deleting reward:', error);
      return {
        success: false,
        message: 'Something went wrong.',
      };
    }
  }
}
