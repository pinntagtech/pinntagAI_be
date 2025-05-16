import { Injectable } from '@nestjs/common';
import { CreateRewardDto } from './dto/create-reward.dto';
import { DecodedUser } from 'src/auth/interfaces/decodedUser.interface';
import { InjectModel } from '@nestjs/mongoose';
import {
  BusinessUser,
  BusinessUserDocument,
} from 'src/business/model/businessUser.model';
import mongoose, { Model } from 'mongoose';
import { Business, BusinessDocument } from 'src/business/model/business.model';
import { DriveService } from 'src/drive/drive.service';
import { Folder } from 'src/drive/models/folder.model';
import { Reward, RewardDocument } from './model/reward.model';
import { S3Service } from 'src/s3.service';
import { manipulateImageName } from 'src/helpers/upload.helpers';
import { ActivityType, RewardStatus } from './enums/rewards.enum';
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
    // @InjectModel(File.name) private readonly fileModel: Model<File>,
    // @InjectModel(FileCategory.name)
    // private readonly fileCategoryModel: Model<FileCategory>,
    private readonly driveService: DriveService,
    private readonly s3Service: S3Service,
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
      if (!user.businessProfile) {
        return {
          success: false,
          message: 'Business not found.',
        };
      }

      const userDetails = await this.businessUserModel.findById(userId);
      if (!userDetails) {
        return {
          success: false,
          message: 'User not found.',
        };
      }

      const business = await this.businessModel.findById(user.businessProfile);
      if (!business) {
        return {
          success: false,
          message: 'Business not found.',
        };
      }
      const businessFolder = await this.driveService.createFolder(userId, {
        parentDirectory: business.drivePath,
        parentType: Folder.name,
        folderName: data.title,
      });
      let createObj = {
        ...data,
        businessProfile: new mongoose.Types.ObjectId(user.businessProfile),
        drivePath: new mongoose.Types.ObjectId(businessFolder.data._id),
        creatorType: BusinessUser.name,
        user: new mongoose.Types.ObjectId(userId),
      };

      const reward = await this.rewardModel.create(createObj);

      const QR_ImageCategory = await this.fileCategoryModel.findOne({
        name: 'Content QR',
      });
      console.log('qrCode:', qrCode);
      let QRCodeDetails = await this.driveService.uploadAndCreateFile(
        qrCode[0],
        businessFolder.data.id,
        Folder.name,
        userDetails.drive.toString(),
        QR_ImageCategory._id,
      );
      console.log('QRCODE DETAILS:', QRCodeDetails);
      console.log('QR ID:', QRCodeDetails._id);
      // console.log('images:', images);
      this.driveService.multiImageUpload(
        userDetails._id,
        businessFolder.data.id,
        images,
      );
      let providedLocations = [];
      if (
        data.activityType === ActivityType.CHECK_IN &&
        data.locations &&
        data.locations.length > 0
      ) {
        if (typeof data.locations === 'string') {
          providedLocations = data.locations
            .split(',')
            .map((id) => id.trim())
            .filter((id) => id.length > 0);
        } else if (Array.isArray(data.locations)) {
          providedLocations = data.locations;
        }
      }
      const locationIds = [];

      // 2) If check-in activity, validate each one

      if (data.activityType === ActivityType.CHECK_IN) {
        if (providedLocations.length === 0) {
          return {
            success: false,
            message: 'Please provide locations.',
          };
        }
        for (const loc of providedLocations) {
          if (!mongoose.isValidObjectId(loc)) {
            return {
              success: false,
              message: `Please provide a valid location id, "${loc}" is not valid`,
            };
          }
          const outletDoc = await this.outletModel.findById(loc);
          if (!outletDoc) {
            return {
              success: false,
              message: `Outlet with id "${loc}" not found`,
            };
          }
          const createdlocation = await this.rewardLocationModel.create({
            reward: new mongoose.Types.ObjectId(reward._id),
            businessLocationId: outletDoc._id,
            location: {
              type: 'Point',
              coordinates: [outletDoc.longitude, outletDoc.latitude],
            },
            accuracy: outletDoc.accuracy,
            address1: outletDoc.address1,
            address2: outletDoc.address2 ? outletDoc.address2 : '',
            city: outletDoc.city,
            state: outletDoc.state,
            zip: outletDoc.postalCode,
            website: outletDoc.website,
            email: outletDoc.email,
            phone: outletDoc.phone,
          });

          locationIds.push(createdlocation._id);
        }
      }
      let startDate = new Date(data.startDate);
      let endDate = new Date(data.endDate);
      const updatedReward = await this.rewardModel.findOneAndUpdate(
        { _id: reward._id },
        {
          $set: {
            locations: locationIds,
            rewardSchedule: {
              startDate: startDate,
              endDate: endDate,
            },
            status: RewardStatus.PUBLISHED,
            QR_CODE: QRCodeDetails._id,
          },
        },
        { new: true },
      );
      return {
        success: true,
        message: 'Offer created successfully',
        data: updatedReward,
      };
    } catch (error) {
      console.log('Error in createOffer:', error);
      return {
        success: false,
        message: 'Something went wrong.',
      };
    }
  }

  async getRewardById(id: string, user: DecodedUser) {
    try {
      const foundReward = await this.rewardModel
        .findById(id)
        .populate('locations', LocationPopulates.FOREIGN)
        .populate('QR_CODE', 'metaData')
        // .populate('drivePath')
        .populate('user', UserPopulates.FOREIGN)
        .populate('businessProfile', BusinessPopulates.FOREIGN)
        .populate('files');
      if (!foundReward) {
        return {
          success: false,
          message: 'Reward not found.',
        };
      }

      return {
        success: true,
        message: 'Reward found.',
        data: foundReward,
      };
    } catch (error) {
      console.log('Error in getRewardById:', error);
      return {
        success: false,
        message: 'Something went wrong.',
      };
    }
  }

  async getAllRewards(user: DecodedUser) {
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
      const rewards = await this.rewardModel
        .find({ businessProfile: business._id })
        .populate('locations', LocationPopulates.FOREIGN)
        .populate('QR_CODE', 'metaData')
        // .populate('drivePath')
        .populate('user', UserPopulates.FOREIGN)
        .populate('businessProfile', BusinessPopulates.FOREIGN)
        .populate('files');
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
      };
    } catch (error) {
      console.log('Error in getAllRewards:', error);
      return {
        success: false,
        message: 'Something went wrong.',
      };
    }
  }

  async getDashboardRewards(user:DecodedUser,data:GetRewardDashboardDto,search: string,dis:string){
    try{
      const distance = dis ? parseInt(dis) : 1000;
      let start = data.startDate? new Date(data.startDate) : new Date();
      let query = {};
      // if()
      let pipeline = [];
      const result = await this.rewardLocationModel.aggregate();



    }catch(error){
      console.log('Error in getDashboardRewards:', error);
      return {
        success: false,
        message: 'Something went wrong.',
      };
    }
  }
}
