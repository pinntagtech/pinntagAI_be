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
  FileCategoryTypes,
  FileType,
  UserTypes,
} from 'src/enums/auth.enums';
import { manipulateImageName } from 'src/helpers/upload.helpers';
import { S3Service } from 'src/s3.service';
import { In } from 'typeorm';
import { File, fileDocument } from './models/file.model';
import {
  FileCategory,
  FileCategoryDocument,
} from './models/fileCategory.model';
import {
  BusinessUser,
  BusinessUserDocument,
} from 'src/business/model/businessUser.model';

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
    @InjectModel(BusinessUser.name)
    private readonly businessUserModel: Model<BusinessUserDocument>,
    @InjectModel(FileCategory.name)
    private readonly fileCategoryModel: Model<FileCategoryDocument>,
    private readonly s3Service: S3Service,
  ) {}

  async uploadFile(
    parentId: string,
    locationId: string,
    fileCategoryId: string,
    file: Express.Multer.File,
  ) {
    try {
      if (!isValidObjectId(parentId)) {
        return {
          success: false,
          message: 'Invalid ObjectId',
        };
      }
      if (!fileCategoryId) {
        let getFileCategory = await this.fileCategoryModel.findOne({
          name: FileCategoryTypes.OTHER,
        });
        fileCategoryId = getFileCategory.id;
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
      let driveDetails = await this.driveModel.findOne({
        owner: new mongoose.Types.ObjectId(parentId),
      });
      if (!driveDetails) {
        return {
          success: false,
          message: 'Drive not found!',
        };
      }
      parentType = driveDetails.ownerType;

      if (!locationId) locationId = driveDetails.id;

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
        // let subParentType = parentDirectoryType;
        // let subFolder = folder;
        // while (subParentType != Drive.name) {
        //   subFolder = await this.folderModel.findOne({ _id: subFolder.parent });
        //   subParentType = subFolder.parentType;
        // }
        parentDriveId = folder.drive;
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
      const splitIndex = uploadResult.Location.indexOf('amazonaws');
      const part1 = uploadResult.Location.slice(0, splitIndex); // "https://staging-pinntagbucket"
      const part2 = uploadResult.Location.slice(splitIndex);
      const updatedUrl = `${part1}${process.env.AWS_REGION}.${part2}`;
      console.log('updatedUrl', updatedUrl);

      let createdFile = await this.fileModel.create({
        metaData: {
          mimeType: file.mimetype,
          url: updatedUrl,
          size: file.size,
          originalName: file.originalname,
        },
        parentDirectory: new mongoose.Types.ObjectId(locationId),
        ParentDirectoryType: parentDirectoryType,
        fileType: fileType,
        category: new mongoose.Types.ObjectId(fileCategoryId),
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
  async createFolder(id: string, folderData: Partial<any>) {
    try {
      console.log('folder data........', folderData);
      if (!isValidObjectId(folderData.parent)) {
        return {
          success: false,
          message: 'Invalid ObjectId',
        };
      }
      let isDrive = await this.driveModel.findOne({ _id: folderData.parent });
      let parentType = isDrive ? Drive.name : Folder.name;
      folderData.parent = new mongoose.Types.ObjectId(folderData.parent);
      console.log('parentType:', parentType);
      let driveDetails = await this.driveModel.findOne({
        owner: new mongoose.Types.ObjectId(id),
      });

      const createdFolder = await this.folderModel.create({
        ...folderData,
        drive: driveDetails._id,
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

  async getFiles(
    userId: string,
    userType: string,
    fileCategory?: string,
    folderId?: string,
    fileType?: string,
    page: number = 1,
    limit: number = 10,
  ) {
    try {
      const skip = (page - 1) * limit;
      if (!isValidObjectId(userId))
        return {
          success: false,
          message: 'Please Provide valid ObjectId!',
        };

      let user = null;
      if (userType == UserTypes.ADMIN) {
        user = await this.adminModel.findById(userId);
      }
      if (userType == UserTypes.USER) {
        user = await this.userModel.findById(userId);
      }
      if (userType == UserTypes.BUSINESS) {
        user = await this.businessUserModel.findById(userId);
      }
      if (!user) {
        return {
          success: false,
          message: 'User not found!',
        };
      }

      console.log('user:', userId, userType, fileType, user);
      let locationId = user.drive;
      if (folderId) {
        locationId = folderId;
      }
      let fileFilter: any = {
        parentDirectory: new mongoose.Types.ObjectId(locationId),
      };
      if (fileType) {
        if (!Object.values(FileType).includes(fileType)) {
          return {
            success: false,
            message: 'Please provide valid file type',
          };
        }
        fileFilter.fileType = fileType;
      }
      if (fileCategory) {
        fileFilter.fileCategory = new mongoose.Types.ObjectId(fileCategory);
      }
      const [files, folders] = await Promise.all([
        await this.fileModel.find(fileFilter).sort({ createdAt: -1 }),
        await this.folderModel
          .find({
            parentDirectory: new mongoose.Types.ObjectId(locationId),
          })
          .sort({ createdAt: -1 }),
      ]);
      const pipeline: any[] = [
        { $match: fileFilter },
        {
          $unionWith: {
            coll: 'folders',
            pipeline: [
              {
                $match: {
                  parentDirectory: new mongoose.Types.ObjectId(locationId),
                },
              },
            ],
          },
        },
        { $sort: { createdAt: -1 } },
        {
          $facet: {
            metadata: [{ $count: 'total' }],
            results: [{ $skip: skip }, { $limit: limit }],
          },
        },
      ];
      const [{ metadata, results }] = await this.fileModel.aggregate(pipeline);
      const total = metadata.length ? metadata[0].total : 0;

      return {
        success: true,
        message: 'files fetched successfully',
        data: results,
        total: total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      };
    } catch (error) {
      console.error('Error in fetching files:', error);
      return { success: false, message: 'Failed to fetched files' };
    }
  }
  async fileCategories() {
    try {
      const allFileCategories = await this.fileCategoryModel.find();
      return {
        success: true,
        message: 'Files Categories fetched successfully!',
        data: allFileCategories,
      };
    } catch (error) {
      console.error('Error while fetching file categories:', error);
      return { success: false, message: 'Failed to fetch file categories' };
    }
  }
  async moveFile(toMove: string, dest: string) {
    try {
      if (!isValidObjectId(toMove) || !isValidObjectId(dest)) {
        return {
          success: false,
          message: 'Invalid ObjectID',
        };
      }
      const [toMoveFile, toMoveFolder, driveDest, folderDest] =
        await Promise.all([
          this.fileModel.findOne({ _id: toMove }),
          this.folderModel.findOne({ _id: toMove }),
          this.driveModel.findOne({ _id: dest }),
          this.folderModel.findOne({ _id: dest }),
        ]);
      if (!toMoveFile && toMoveFolder) {
        return {
          success: false,
          message:
            'Please Provide valid fileID or FolderID! Only File or a Folder can be moved!',
        };
      }
      if (!driveDest && !folderDest) {
        return {
          success: false,
          message: 'Please Provide valid driveID or folderID',
        };
      }
      let parentDirectoryType = null;
      if (driveDest) parentDirectoryType = 'DRIVE';
      if (folderDest) parentDirectoryType = 'FOLDER';

      let result = null;
      if (toMoveFile) {
        result = await this.fileModel.findOneAndUpdate(
          { _id: toMove },
          {
            $set: {
              parentDirectory: new mongoose.Types.ObjectId(dest),
              ParentDirectoryType: parentDirectoryType,
            },
          },
        );
      }
      if (toMoveFolder) {
        result = await this.folderModel.findOneAndUpdate(
          { _id: toMove },
          {
            $set: {
              parent: new mongoose.Types.ObjectId(dest),
              parentType: parentDirectoryType,
            },
          },
        );
      }
      console.log('result:', result);

      return {
        sucess: true,
        message: 'File moved successfully!',
        data: result,
      };
    } catch (error) {
      console.error('Error while moving file:', error);
      return { success: false, message: 'Failed to move file' };
    }
  }
  async getDrive(id: string) {
    try {
      if (!isValidObjectId(id)) {
        return {
          success: false,
          message: 'Invalid ObjectId',
        };
      }
      const drive = await this.driveModel.findOne({
        owner: new mongoose.Types.ObjectId(id),
      });
      if (!drive) {
        return {
          success: false,
          message: 'Drive not found!',
        };
      }
      return {
        success: true,
        message: 'Drive fetched successfully!',
        data: drive,
      };
    } catch (error) {
      console.error('Error while fetching drive:', error);
      return { success: false, message: 'Failed to fetch drive' };
    }
  }

  async fileType() {
    try {
      const fileType = Object.values(FileType);
      return {
        success: true,
        message: 'File type fetched successfully!',
        data: fileType,
      };
    } catch (error) {
      console.error('Error while fetching file type:', error);
      return { success: false, message: 'Failed to fetch file type' };
    }
  }
  async recentlyUploadedFiles(
    userId: string,
    userType: string,
    page: number,
    limit: number,
  ) {
    try {
      const skip = (page - 1) * limit;
      if (!isValidObjectId(userId))
        return {
          success: false,
          message: 'Please Provide valid ObjectId!',
        };

      let user = null;
      if (userType == UserTypes.ADMIN) {
        user = await this.adminModel.findById(userId);
      }
      if (userType == UserTypes.USER) {
        user = await this.userModel.findById(userId);
      }
      if (userType == UserTypes.BUSINESS) {
        user = await this.businessUserModel.findById(userId);
      }
      if (!user) {
        return {
          success: false,
          message: 'User not found!',
        };
      }
      let fileFilter: any = {
        parentDirectory: new mongoose.Types.ObjectId(user.drive),
      };
      const files = await this.fileModel
        .find(fileFilter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const totalFiles = await this.fileModel.countDocuments(fileFilter);

      return {
        success: true,
        message: 'Files fetched successfully',
        data: files,
        total: totalFiles,
      };
    } catch (error) {
      console.error('Error in fetching files:', error);
      return { success: false, message: 'Failed to fetched files' };
    }
  }
}
