import { Injectable } from '@nestjs/common';
import { CreateRewardDto } from './dto/create-reward.dto';
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
import { ActivityType, ClaimStatus, RewardStatus } from './enums/rewards.enum';
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
import { Notification, NotificationDocument } from 'src/notification/models/notification.model';
import { UserDetail } from 'aws-sdk/clients/iam';

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
        

    // @InjectModel(File.name) private readonly fileModel: Model<File>,
    // @InjectModel(FileCategory.name)
    // private readonly fileCategoryModel: Model<FileCategory>,
    private readonly driveService: DriveService,
    private readonly s3Service: S3Service,
    private readonly userService: UserService,
    private readonly firebaseService: FirebaseService,
  ) {}

  // Create Offer

  async createReward(
    data: CreateRewardDto,
    user: DecodedUser,
    images: Express.Multer.File[],
    qrCode: Express.Multer.File,
  ) {
    try {
      console.log('createReward data:', data);
  
      const userId = user.id;
      const businessUser = await this.businessUserModel.findById(userId);
      if (!businessUser) return { success: false, message: 'User not found.' };
  
      if (!user.businessProfile) return { success: false, message: 'Business Profile not found.' };
  
      const business = await this.businessModel.findById(user.businessProfile);
      if (!business) return { success: false, message: 'Business not found.' };
  
      const businessFolder = await this.driveService.createFolder(userId, {
        parentDirectory: business.drivePath,
        parentType: Folder.name,
        folderName: data.title,
      });
  
      const createObj = {
        ...data,
        businessProfile: new mongoose.Types.ObjectId(user.businessProfile),
        drivePath: new mongoose.Types.ObjectId(businessFolder.data._id),
        creatorType: BusinessUser.name,
        user: new mongoose.Types.ObjectId(userId),
        schedule: {
          startDate: new Date(data.startDate),
          endDate: new Date(data.endDate),
        },
      };
  
      const reward = await this.rewardModel.create(createObj);
  
      const QR_ImageCategory = await this.fileCategoryModel.findOne({ name: 'Content QR' });
  
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
      this.driveService.multiImageUpload(userId, businessFolder.data.id, images);
  
      // Handle locations if Check-In activity
      let locationIds: mongoose.Types.ObjectId[] = [];
      if (data.activityType === ActivityType.CHECK_IN) {
        let providedLocations: string[] = [];
  
        if (typeof data.locations === 'string') {
          providedLocations = data.locations.split(',').map(id => id.trim()).filter(Boolean);
        } else if (Array.isArray(data.locations)) {
          providedLocations = data.locations;
        }
  
        if (providedLocations.length === 0) {
          return { success: false, message: 'Please provide locations.' };
        }
  
        for (const loc of providedLocations) {
          if (!mongoose.isValidObjectId(loc)) {
            return { success: false, message: `Invalid location id: "${loc}"` };
          }
          const outletDoc = await this.outletModel.findById(loc);
          if (!outletDoc) {
            return { success: false, message: `Outlet with id "${loc}" not found.` };
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
  
      const updateRewardObj: any = {
        locations: locationIds,
        rewardSchedule: {
          startDate: new Date(data.startDate),
          endDate: new Date(data.endDate),
        },
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
        const followersRes = await this.userService.getFollowers(user.businessProfile);
        const followers = followersRes?.followers || [];
  
        if (followers.length > 0) {
          const message = `${business.name} published a new Reward called ${reward.title}`;
  
          for (const follower of followers) {
            const fcmTokens = await this.tokenModel.find({
              userId: follower.follower['_id'],
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
  
            await this.notificationModel.create({
              type: NotificationTypes.REWARD,
              reward: reward._id,
              targetType: Business.name,
              targetUser: user.businessProfile,
              message,
              user: follower.follower['_id'],
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
  

  async getRewardById(id: string, user: DecodedUser, latitude?: string, longitude?: string) {
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

      const foundRewardAgg = await this.rewardModel.aggregate(pipeline);

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

  async getAllRewards(user: DecodedUser, page: number, limit: number) {
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
      const pipeline: any = [
        { $match: { businessProfile: business._id } },
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
    distance: number,
    page: number,
    limit: number,
  ) {
    try {
      const now = new Date();
      let startDate = data.startDate ? new Date(data.startDate) : now;
      let endDate = data.endDate
        ? new Date(data.endDate)
        : new Date(now.setFullYear(now.getFullYear() + 2));
      // let query = {};
      // // if()
      let consumerId = user.id;
      console.log('Consumer ID:', consumerId);
      let skip = (page - 1) * limit;
      const QR_ImageCategory = await this.fileCategoryModel.findOne({
        name: 'Content QR',
      });
      console.log("CONTENT_QRRR:", QR_ImageCategory);
      let pipeline: PipelineStage[] = [
        {
          $geoNear: {
            near: {
              type: 'Point',
              coordinates: [Number(data.longitude), Number(data.latitude)],
            },
            distanceField: 'distance',
            maxDistance: distance * 1000,
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
        { $sort: { 'reward.createdAt': -1 } }, // Sort by creation date of the reward
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
          $match: {
            'reward.status': RewardStatus.PUBLISHED,
            claimed: { $eq: [] },
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
                          QR_ImageCategory._id,
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
          },
        },
        {
          $facet: {
            data: [{ $skip: skip }, { $limit: limit }],
            totalCount: [{ $count: 'count' }],
          },
        },
      ];

      const result = await this.rewardLocationModel.aggregate(pipeline);

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
      const fcmTokens = await this.tokenModel.find({
        userId: userDetails._id,
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

      await this.notificationModel.create({
        type: NotificationTypes.REWARD,
        reward: reward._id,
        targetType: Business.name,
        targetUser: reward.businessProfile,
        message,
        user: userDetails._id,
      });

      
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
          $project: {
            _id: 1,
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
          },
        },
        { $skip: (page - 1) * limit },
        { $limit: limit },
      ]);

      const total = await this.userRewardModel.countDocuments({
        userId: new mongoose.Types.ObjectId(userId),
        claimStatus: claimStatus,
      });
      if (!rewards || rewards.length === 0) {
        return {
          success: false,
          message: 'No rewards found.',
        };
      }
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
      const fcmTokens = await this.tokenModel.find({
        userId: userDetails._id,
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

      await this.notificationModel.create({
        type: NotificationTypes.REWARD,
        reward: reward._id,
        targetType: Business.name,
        targetUser: reward.businessProfile,
        message,
        user: userDetails._id,
      });


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
  async getUserRewardById(id: string, user: DecodedUser) {
    try {
      const QR_ImageCategory = await this.fileCategoryModel.findOne({
        name: 'Content QR',
      });
      const foundReward = await this.userRewardModel.aggregate([
        {
          $match: {
            _id: new mongoose.Types.ObjectId(id),
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
          $unwind: { path: '$reward' },
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
            from: 'rewardlocations',
            localField: 'reward.locations',
            foreignField: '_id',
            as: 'locations',
          },
        },
        {
          $lookup: {
            from: 'businesses',
            localField: 'reward.businessProfile',
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
            from: 'businessindustries',
            localField: 'businessProfile.businessIndustry',
            foreignField: '_id',
            as: 'businessIndustry',
          },
        },
        {
          $unwind: {
            path: '$businessIndustry',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: '$reward._id',
            status: '$reward.status',
            claimStatus: '$claimStatus',
            claimedAt: '$claimedAt',
            title: '$reward.title',
            rewardType: '$reward.rewardType',
            activityType: '$reward.activityType',
            locations: '$locations',
            targetCount: '$reward.targetCount',
            redemptionMode: '$reward.redemptionMode',
            progress: '$progress',
            schedule: '$reward.schedule',
            drivePath: '$reward.drivePath',
            rewardExpiration: '$reward.rewardExpiration',
            description: '$reward.description',
            createdAt: '$reward.createdAt',
            updatedAt: '$reward.updatedAt',
            __v: '$reward.__v',
            rewardSchedule: '$reward.schedule',
            QR_CODE: {
              _id: '$QR_CODE._id',
              metaData: '$QR_CODE.metaData',
            },
            files: '$files',
            businessProfile: {
              _id: '$businessProfile._id',
              name: '$businessProfile.name',
              cover: '$businessProfile.cover',
              logo: '$businessProfile.logo',
              businessIndustry: {
                _id: '$businessIndustry._id',
                title: '$businessIndustry.title',
                darkIcon: '$businessIndustry.darkIcon',
                lightIcon: '$businessIndustry.lightIcon',
              },
            },
          },
        },
      ]);
      if (!foundReward) {
        return {
          success: false,
          message: 'Reward not found.',
        };
      }
      return {
        success: true,
        message: 'Reward found.',
        data: foundReward[0],
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
      if (foundReward.status !== ClaimStatus.ACTIVE) {
        return {
          success: false,
          message: 'Reward is not active.',
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
      await this.userRewardModel.updateOne(
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
        data: userReward,
      };
    } catch (error) {
      console.log('Error in handleScanReward:', error);
      return {
        success: false,
        message: 'Something went wrong.',
      };
    }
  }
}
