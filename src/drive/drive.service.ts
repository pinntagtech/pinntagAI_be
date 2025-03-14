import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Drive, DriveDocument } from './models/drive.model';
import { isValidObjectId, Model } from 'mongoose';
import mongoose from 'mongoose';
import { Folder, folderDocument } from './models/folder.model';
import { Exception } from 'handlebars';
import { User, UserDocument } from 'src/user/models/user.model';
import {
  BusinessProfile,
  BusinessProfileDocument,
} from 'src/business-profile/models/businessProfile.model';
import { Admin, AdminDocument } from 'src/admin/models/admin.model';
import { EventDocument } from 'src/event/models/event.model';
import {
  allowedAudioMimeTypes,
  allowedDocumentMimeTypes,
  allowedImageMimeTypes,
  allowedVideoMimeTypes,
  FileType,
} from 'src/enums/auth.enums';
import { manipulateImageName } from 'src/helpers/upload.helpers';
import { S3Service } from 'src/s3.service';
import { In } from 'typeorm';
import { File, fileDocument } from './models/file.model';

@Injectable()
export class DriveService {
  constructor(
    @InjectModel(Drive.name) private readonly driveModel: Model<DriveDocument>,
    @InjectModel(Folder.name)
    private readonly folderModel: Model<folderDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(BusinessProfile.name)
    private readonly businessProfileModel: Model<BusinessProfileDocument>,
    @InjectModel(Admin.name) private readonly adminModel: Model<AdminDocument>,
    @InjectModel(Event.name) private readonly eventModel: Model<EventDocument>,
    @InjectModel(File.name) private readonly fileModel: Model<fileDocument>,
    private readonly s3Service: S3Service,
  ) {}

  async uploadFile(
    parentId: string,
    locationId: string,
    fileCategory: string,
    file: Express.Multer.File,
  ) {
    try {
      if (!isValidObjectId(parentId)) {
        return {
          success: false,
          message: 'Invalid ObjectId',
        };
      }
      let parentType = null;
      let fileType = null;
      // let [isUser, isAdmin, isBusinessProfile, isEvent] = await Promise.all([
      //   this.userModel.findById(parentId),
      //   this.adminModel.findById(parentId),
      //   this.businessProfileModel.findById(parentId),
      //   this.eventModel.findById(parentId),
      // ]);
      console.log('parentId:', parentId);
      let driveDetails = await this.driveModel.findOne({ owner: new mongoose.Types.ObjectId(parentId) });
      if (!driveDetails) {
        return {
          success: false,
          message: 'Drive not found!',
        };
      }
      console.log("not coming here why!");
      parentType = driveDetails.ownerType;

      if (!locationId) locationId = driveDetails.id;

      // if (!locationId) {

      //   locationId = driveDetails.id;
      // }
      // if (isUser) {
      //   parentType = User.name;
      // }
      // if (isAdmin) {
      //   parentType = Admin.name;
      // }
      // if (isBusinessProfile) {
      //   parentType = BusinessProfile.name;
      // }
      // if (isEvent) {
      //   parentType = Event.name;
      // }

      console.log('ParentType:', parentType);
      console.log('FILE:', file);
      const drive = await this.driveModel.findOne({ _id: locationId });
      const folder = await this.folderModel.findOne({ _id: locationId });
      let parentDirectoryType = null;
      let parentDriveId = null;
      if (drive) {
        parentDirectoryType = Drive.name;
        parentDriveId = drive._id;
      }
      if (folder) {
        parentDirectoryType = folder.parentType;
        let subParentType = parentDirectoryType;
        let subFolder = folder;
        while (subParentType != Drive.name) {
          subFolder = await this.folderModel.findOne({ _id: subFolder.parent });
          subParentType = subFolder.parentType;
        }
        parentDriveId = subFolder.parent;
      }

      console.log(driveDetails);
      if (file.size > driveDetails.AvailableSpace) {
        return {
          success: false,
          message: 'You have been consumed your available free space',
          data: driveDetails,
        };
      }

      if (allowedImageMimeTypes.includes(file.mimetype))
        fileType = FileType.IMAGE;
      else if (allowedVideoMimeTypes.includes(file.mimetype))
        fileType = FileType.VIDEO;
      else if (allowedDocumentMimeTypes.includes(file.mimetype))
        fileType = FileType.DOCUMENT;
      else if (file.mimetype == 'image/gif') fileType = FileType.GIF;
      else if (allowedAudioMimeTypes.includes(file.mimetype))
        fileType = FileType.AUDIO;
      else fileType = FileType.OTHER;

      if (!driveDetails) {
        return {
          success: false,
          message: 'Drive not found',
        };
      }
      const uploadFileName = manipulateImageName(file.originalname);
      console.log('uploadFileName', uploadFileName);
      const uploadResult = await this.s3Service.s3_upload(
        file.buffer,
        process.env.AWS_S3_BUCKET_NAME,
        uploadFileName,
        file.mimetype,
      );
      //create file doc
      let createdFile = await this.fileModel.create({
        metaData: {
          mimeType: file.mimetype,
          url: uploadResult.Location,
          size: file.size,
          originalName: file.originalname,
        },
        parentDirectory: new mongoose.Types.ObjectId(locationId),
        ParentDirectoryType: parentDirectoryType,
        fileType: fileType,
        category: fileCategory,
        parent: new mongoose.Types.ObjectId(parentId),
        parentType: parentType,
      });
      console.log('Created File:::', createdFile);
      //
      await this.driveModel.updateOne(
        { _id: parentDriveId },
        { $set: { AvailableSpace: driveDetails.AvailableSpace - file.size } },
      );

      return {
        success: true,
        message: 'File uploaded successfully',
        data: createdFile,
      };
    } catch (error) {
      console.error('Error uploading media:', error);
      return { success: false, message: 'Failed to upload media' };
    }
  }
  async createFolder(folderData: Partial<Folder>) {
    try {
      let isDrive = await this.driveModel.findOne({ _id: folderData.parent });
      let parentType = isDrive ? Drive.name : Folder.name;
      if (!isValidObjectId(folderData.parent)) {
        return {
          success: false,
          message: 'Invalid ObjectId',
        };
      }
      folderData.parent = new mongoose.Types.ObjectId(folderData.parent);
      console.log('parentType:', parentType);

      const createdFolder = await this.folderModel.create({
        ...folderData,
        parentType,
      });
      console.log('createdFolder:', createdFolder);
      return {
        success: true,
        message: 'Folder Created Successfully!',
        data: createdFolder,
      };
    } catch (error) {
      console.error('Error:', error);
      return { success: false, message: error };
    }
  }

  async getFiles(id:string){
    try{
       if (!isValidObjectId(id))
      return {
        success: false,
        message: 'Please Provide valid ObjectId!',
      };

      const files = await this.fileModel.find({parentDirectory:new mongoose.Types.ObjectId(id)});
      const folders = await this.folderModel.find({parent:new mongoose.Types.ObjectId(id)});
      
      return {
        success:true,
        message:"files fetched successfully",
        data: [...folders,...files]
      }


    }catch(error){
      console.error('Error uploading media:', error);
      return { success: false, message: 'Failed to upload media' };
    }
  }

}
