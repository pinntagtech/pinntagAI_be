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
import { ActivityType } from './enums/rewards.enum';
import {
  EventLocation,
  EventLocationDocument,
} from 'src/event/models/eventLocation.model';
import { Outlet, OutletDocument } from 'src/outlet/model/outlet.model';
import {
  FileCategory,
  FileCategoryDocument,
} from 'src/drive/models/fileCategory.model';

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

      console.log('rewardObj:', createObj);

      const reward = await this.rewardModel.create(createObj);
      console.log('reward:', reward);

      const QR_ImageCategory = await this.fileCategoryModel.findOne({
        name: 'Content QR',
      });
      console.log('qrCode:', qrCode);
      this.driveService.uploadAndCreateFile(
        qrCode[0],
        businessFolder.data.id,
        Folder.name,
        userDetails.drive.toString(),
        QR_ImageCategory._id,
      );
      console.log('images:', images);
      this.driveService.multiImageUpload(
        userDetails._id,
        businessFolder.data.id,
        images,
      );
      let providedLocations= [];
      const locationIds = [];
      if(data.activityType === ActivityType.CHECK_IN && data.locations && data.locations.length > 0) {
        if (typeof data.locations === 'string') {
          providedLocations = data.locations
            .split(',')
            .map((id) => id.trim())
            .filter((id) => id.length > 0);
        } else if (Array.isArray(data.locations)) {
          providedLocations = data.locations;
        }



      }

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
          locationIds.push(outletDoc._id);
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
          },
        },
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
}
