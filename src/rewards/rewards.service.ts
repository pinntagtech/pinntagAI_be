import { Injectable } from '@nestjs/common';
import { CreateRewardDto } from './dto/create-reward.dto';
import { DecodedUser } from 'src/auth/interfaces/decodedUser.interface';
import { InjectModel } from '@nestjs/mongoose';
import { BusinessUser, BusinessUserDocument } from 'src/business/model/businessUser.model';
import mongoose, { Model } from 'mongoose';
import { Business, BusinessDocument } from 'src/business/model/business.model';
import { DriveService } from 'src/drive/drive.service';
import { Folder } from 'src/drive/models/folder.model';
import { Reward, RewardDocument } from './model/reward.model';
import { S3Service } from 'src/s3.service';
import { manipulateImageName } from 'src/helpers/upload.helpers';

@Injectable()
export class RewardsService {

    constructor(
        // @InjectModel(User.name) private readonly userModel: Model<User>,
        @InjectModel(BusinessUser.name) private readonly businessUserModel: Model<BusinessUserDocument>,
        // @InjectModel(Event.name) private readonly eventModel: Model<Event>,
        @InjectModel(Business.name) private readonly businessModel: Model<BusinessDocument>,
        @InjectModel(Reward.name) private readonly rewardModel: Model<RewardDocument>,
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
          console.log('event:', reward);
    
        //   console.log('Image:', image);
        //   const result = await this.s3Service.s3_upload(
        //     image.buffer,
        //     process.env.AWS_S3_BUCKET_NAME,
        //     manipulateImageName(image.originalname),
        //     'image/jpeg',
        //   );
        //   const fileCategory = await this.fileCategoryModel.findOne({
        //     name: 'gallery image',
        //   });
        //   const splitIndex = result.Location.indexOf('amazonaws');
        //   const part1 = result.Location.slice(0, splitIndex); // "https://staging-pinntagbucket"
        //   const part2 = result.Location.slice(splitIndex);
        //   const updatedUrl = `${part1}${process.env.AWS_REGION}.${part2}`;
        //   console.log('updatedUrl', updatedUrl);
        //   let file = await this.fileModel.create({
        //     metaData: {
        //       mimeType: image.mimetype,
        //       url: updatedUrl,
        //       size: image.size,
        //       originalName: image.originalname,
        //     },
        //     parentDirectory: new mongoose.Types.ObjectId(event.drivePath),
        //     ParentDirectoryType: Folder.name,
        //     fileType: FileType.IMAGE,
        //     category: fileCategory._id,
        //     parent: new mongoose.Types.ObjectId(event._id),
        //     parentType: Event.name,
        //   });
    
        //   // const updatedEvent = await this.eventModel.findByIdAndUpdate(
        //   //   event._id,
        //   //   {
        //   //     $push: {
        //   //       images: {
        //   //         $each: eventImages
        //   //       },
        //   //     },
        //   //   },
        //   //   { new: true },
        //   // );
    
        //   await this.businessModel.updateOne(
        //     { _id: user.businessProfile },
        //     {
        //       $set: {
        //         onboardingOfferStatus: OfferStatus.CREATED,
        //         initialOfferId: event._id,
        //       },
        //     },
        //   );
          return {
            success: true,
            message: 'Offer created successfully',
            data: event,
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
