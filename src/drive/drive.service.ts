import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Drive, DriveDocument } from './models/drive.model';
import { isValidObjectId, Model } from 'mongoose';
import mongoose from 'mongoose';
import { Folder, FolderDocument } from './models/folder.model';
import { Exception } from 'handlebars';
import { User, UserDocument } from 'src/user/models/user.model';
import * as QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';
// import {
//   BusinessProfile,
//   BusinessProfileDocument,
// } from 'src/business-profile/models/businessProfile.model';
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
import { File, FileDocument } from './models/file.model';
import {
  FileCategory,
  FileCategoryDocument,
} from './models/fileCategory.model';
import {
  BusinessUser,
  BusinessUserDocument,
} from 'src/business/model/businessUser.model';
import { OfferStatus } from 'src/business/enums/business.enum';
import { Business, BusinessDocument } from 'src/business/model/business.model';
import path from 'path';
import axios from 'axios';
import streamifier from 'streamifier';
import { DecodedUser } from 'src/auth/interfaces/decodedUser.interface';

@Injectable()
export class DriveService {
  constructor(
    @InjectModel(Drive.name) private readonly driveModel: Model<DriveDocument>,
    @InjectModel(Folder.name)
    private readonly folderModel: Model<FolderDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    // @InjectModel(BusinessProfile.name) private readonly businessProfileModel: Model<BusinessProfileDocument>,
    @InjectModel(Admin.name) private readonly adminModel: Model<AdminDocument>,
    @InjectModel(Event.name) private readonly eventModel: Model<EventDocument>,
    @InjectModel(File.name) private readonly fileModel: Model<FileDocument>,
    @InjectModel(Business.name)
    private readonly businessModel: Model<BusinessDocument>,
    @InjectModel(BusinessUser.name)
    private readonly businessUserModel: Model<BusinessUserDocument>,
    @InjectModel(FileCategory.name)
    private readonly fileCategoryModel: Model<FileCategoryDocument>,
    private readonly s3Service: S3Service,
  ) {}

  private rewriteS3Url(originalUrl: string): string {
    console.log('originalUrl', originalUrl);
    // e.g. https://staging-pinntagbucket.s3.us-east-1.amazonaws.com/staging/13a1747119776098.jpg
    const url = new URL(originalUrl);
    url.host = `${url.host.replace(/^s3\./, '')}`; // remove any existing s3.<region>.
    url.host = `${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com`;
    return url.toString();
  }
  async saveFileInDB(
    file: Express.Multer.File,
    parentId: string,
    locationId: string,
    fileCategoryId: string,
    parentDirectoryType: string,
    fileType: string,
    parentType: string,
  ) {
    let driveDetails = await this.driveModel.findOne({
      owner: new mongoose.Types.ObjectId(parentId),
    });

    const uploadFileName = manipulateImageName(file.originalname);
    console.log('uploadFileName', uploadFileName);
    const uploadResult = await this.s3Service.s3_upload(
      file.buffer,
      process.env.AWS_S3_BUCKET_NAME,
      uploadFileName,
      file.mimetype,
    );
    const updatedUrl = this.rewriteS3Url(uploadResult.Location);
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
      { _id: driveDetails._id },
      { $set: { AvailableSpace: driveDetails.AvailableSpace - file.size } },
    );
    return createdFile;
  }

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
      const [drive, folder] = await Promise.all([
        this.driveModel.findById(locationId),
        this.folderModel.findById(locationId),
      ]);
      if (!drive && !folder) {
        return { success: false, message: 'Invalid locationId' };
      }
      const parentDirectoryType = drive ? Drive.name : folder.parentType;
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

      // let createdFile = await this.saveFileInDB(file,parentId,locationId,fileCategoryId,parentDirectoryType,fileType,parentType);
      let createdFile = await this.uploadAndCreateFile(
        file,
        locationId,
        parentDirectoryType,
        parentId,
        fileCategoryId,
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
      let driveDetails = await this.driveModel.findOne({
        owner: new mongoose.Types.ObjectId(id),
      });
      console.log('folder data........', folderData);
      if (folderData.parentDirectory && !isValidObjectId(folderData.parentDirectory)) {
        return {
          success: false,
          message: 'Invalid ObjectId',
        };
      }
      if(!folderData.parentDirectory){
        folderData.parentDirectory = driveDetails.id;
      }
      let isDrive = await this.driveModel.findOne({
        _id: folderData.parentDirectory,
      });
      let parentType = isDrive ? Drive.name : Folder.name;
      folderData.parentDirectory = new mongoose.Types.ObjectId(
        folderData.parentDirectory,
      );

      if (parentType == Folder.name) {
        let folderDetails = await this.folderModel.findOne({
          _id: folderData.parentDirectory,
        });
        if (!folderDetails) {
          return {
            success: false,
            message: 'Folder not found',
          };
        }
        if (folderDetails.drive != driveDetails.id) {
          return {
            success: false,
            message: 'Folder not found in this drive',
          };
        }
      }
      console.log('parentType:', parentType);

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
      console.log("limit:",typeof limit);
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
      // const [files, folders] = await Promise.all([
      //   await this.fileModel.find(fileFilter).sort({ createdAt: -1 }),
      //   await this.folderModel
      //     .find({
      //       parentDirectory: new mongoose.Types.ObjectId(locationId),
      //     })
      //     .sort({ createdAt: -1 }),
      // ]);

      let directoryDetails = null;
      if (folderId) {
        directoryDetails = await this.folderModel.findById(folderId);
      }

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
        directoryDetails: directoryDetails,
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

  // async multiImageUpload(
  //   parentId: string,
  //   locationId: string,
  //   images: Express.Multer.File[],
  // ) {
  //   try {
  //     if (!isValidObjectId(parentId)) {
  //       return {
  //         success: false,
  //         message: 'Invalid ObjectId',
  //       };
  //     }
  //     let driveDetails = await this.driveModel.findOne({
  //       owner: new mongoose.Types.ObjectId(parentId),
  //     });
  //     if (!driveDetails) {
  //       return {
  //         success: false,
  //         message: 'Drive not found!',
  //       };
  //     }
  //     if (!locationId) locationId = driveDetails.id;
  //     let parentType = null;

  //     let fileIds: any = [];

  //     const drive = await this.driveModel.findOne({ _id: locationId });
  //     const folder = await this.folderModel.findOne({ _id: locationId });
  //     let parentDirectoryType = null;
  //     let parentDriveId = null;
  //     if (drive) {
  //       parentDirectoryType = Drive.name;
  //       parentDriveId = drive._id;
  //     }
  //     if (folder) {
  //       parentDirectoryType = folder.parentType;
  //       parentDriveId = folder.drive;
  //     }

  //     let totalSize = 0;

  //     for (let image of images) {
  //       if (!allowedImageMimeTypes.includes(image.mimetype)) {
  //         console.error('Onlu image files are allowed');
  //         continue;
  //       }
  //       if (image.size > driveDetails.AvailableSpace) {
  //         return {
  //           success: false,
  //           message: 'You have been consumed your available free space',
  //           data: driveDetails,
  //         };
  //       }

  //       const result = await this.s3Service.s3_upload(
  //         image.buffer,
  //         process.env.AWS_S3_BUCKET_NAME,
  //         manipulateImageName(image.originalname),
  //         'image/jpeg',
  //       );
  //       const fileCategory = await this.fileCategoryModel.findOne({
  //         name: 'gallery image',
  //       });
  //       const splitIndex = result.Location.indexOf('amazonaws');
  //       const part1 = result.Location.slice(0, splitIndex); // "https://staging-pinntagbucket"
  //       const part2 = result.Location.slice(splitIndex);
  //       const updatedUrl = `${part1}${process.env.AWS_REGION}.${part2}`;
  //       console.log('updatedUrl', updatedUrl);
  //       let file = await this.fileModel.create({
  //         metaData: {
  //           mimeType: image.mimetype,
  //           url: updatedUrl,
  //           size: image.size,
  //           originalName: image.originalname,
  //         },
  //         parentDirectory: new mongoose.Types.ObjectId(locationId),
  //         ParentDirectoryType: Folder.name,
  //         fileType: FileType.IMAGE,
  //         category: fileCategory._id,
  //         parent: new mongoose.Types.ObjectId(parentId), //Doubt
  //         parentType: Event.name,
  //       });
  //       fileIds.push(file._id);
  //       totalSize += image.size;
  //     }

  //     await this.driveModel.updateOne(
  //       { _id: parentDriveId },
  //       { $set: { AvailableSpace: driveDetails.AvailableSpace - totalSize } },
  //     );

  //     const createdFiles = await this.fileModel.find({ _id: { $in: fileIds } });

  //     return {
  //       success: true,
  //       message: 'File uploaded successfully',
  //       data: createdFiles,
  //     };
  //   } catch (error) {
  //     console.error('Error uploading media:', error);
  //     return { success: false, message: 'Failed to upload media' };
  //   }
  // }

  // optimised

  async uploadAndCreateFile(
    file: Express.Multer.File,
    parentDirectoryId: string,
    parentDirectoryType: string,
    parentId: any,
    categoryId: any,
  ) {
    // 1. Upload
    const s3 = await this.s3Service.s3_upload(
      file.buffer,
      process.env.AWS_S3_BUCKET_NAME,
      manipulateImageName(file.originalname),
      file.mimetype,
    );
    const [base, rest] = s3.Location.split('amazonaws');
    const url = `${base}${process.env.AWS_REGION}.amazonaws${rest}`;

    // 2. Persist File doc
    return await this.fileModel.create({
      metaData: {
        mimeType: file.mimetype,
        url,
        size: file.size,
        originalName: file.originalname,
      },
      parentDirectory: new mongoose.Types.ObjectId(parentDirectoryId),
      ParentDirectoryType: parentDirectoryType,
      fileType: FileType.IMAGE,
      category: categoryId,
      parent: new mongoose.Types.ObjectId(parentId),
      parentType: Event.name, // or drive/folder parentType as needed
    });
  }

  async multiImageUpload(
    user: any,
    locationId: string,
    images: Express.Multer.File[],
  ) {
    try {
      let parentId = user.id;
      if (!isValidObjectId(parentId)) {
        return { success: false, message: 'Invalid parentId' };
      }
      console.log('parentId:', parentId);
      // Fetch driveDetails, drive/folder location, and fileCategory in parallel
      const [driveDetails, fileCategory] = await Promise.all([
        this.driveModel
          .findOne({ owner: new mongoose.Types.ObjectId(parentId) })
          .lean(),
        this.fileCategoryModel.findOne({ name: 'gallery image' }).lean(),
      ]);
      if (!driveDetails) {
        return { success: false, message: 'Drive not found' };
      }
      if (!fileCategory) {
        return { success: false, message: 'File category not found' };
      }

      // Determine target directory type/id
      const locId = locationId || driveDetails._id.toString();
      const [driveLoc, folderLoc] = await Promise.all([
        this.driveModel.findById(locId).lean(),
        this.folderModel.findById(locId).lean(),
      ]);
      if (!driveLoc && !folderLoc) {
        return { success: false, message: 'Location not found' };
      }
      const parentDirectoryType = driveLoc ? Drive.name : folderLoc.parentType;
      const parentDirectoryId = driveLoc ? driveLoc._id : folderLoc.drive;

      // Filter valid images and prepare upload/create tasks
      let totalSize = 0;
      const tasks = images
        .filter((img) => {
          if (!img.mimetype.startsWith('image/')) {
            console.warn(
              `Converting mimetype of ${img.originalname} to image/jpeg`,
            );
            img.mimetype = 'image/jpeg'; // Force set mimetype
          }

          if (img.size > driveDetails.AvailableSpace) {
            throw new BadRequestException(
              `Insufficient space for ${img.originalname}`,
            );
          }

          return true; // All images go through now
        })
        .map((img) => {
          totalSize += img.size;
          return this.uploadAndCreateFile(
            img,
            locId,
            parentDirectoryType,
            parentId,
            fileCategory._id,
          );
        });

      // Run uploads/creates in parallel
      const createdFiles = await Promise.all(tasks);

      const isInEvent = await this.eventModel.findOne({
        drivePath: new mongoose.Types.ObjectId(locationId),
      });
      if (isInEvent) {
        await this.businessModel.updateOne(
          { _id: isInEvent.businessProfile },
          { $set: { onboardingOfferStatus: OfferStatus.GALLERY } },
        );
      }

      // Deduct used space
      await this.driveModel.updateOne(
        { _id: parentDirectoryId },
        { $inc: { AvailableSpace: -totalSize } },
      );

      return {
        success: true,
        message: 'Files uploaded successfully',
        data: createdFiles,
      };
    } catch (error) {
      console.error('Error uploading media:', error);
      return { success: false, message: 'Failed to upload media' };
    }
  }

  async downloadAndUploadImage(url, parentId, locationId, fileCategoryId) {
    try {
      // 1. Download the image as a binary (arraybuffer) to get a Buffer
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 10000,
      });
      const imageBuffer = Buffer.from(response.data); // Ensure we have a Node.js Buffer
      // Get MIME type from response headers (e.g., "image/jpeg", "image/png")
      let mimeType =
        response.headers['content-type'] || 'application/octet-stream';

      // 2. Determine the original file name
      let originalName = 'downloaded-file';
      // Check Content-Disposition header for a filename (if present)
      const contentDisp = response.headers['content-disposition'];
      if (contentDisp) {
        // Regex to capture filename from content-disposition
        const match = contentDisp.match(/filename="?([^"]+)"?/);
        if (match) {
          originalName = match[1];
        }
      } else {
        // Fallback: derive file name from URL
        const urlPath = new URL(url).pathname;
        const baseName = path.basename(urlPath);
        if (baseName) {
          originalName = decodeURIComponent(baseName); // decode URL-encoded parts
        }
      }

      // 3. Create an object mimicking Express.Multer.File
      const file = {
        fieldname: 'file', // generic field name, since we don't have an actual form field
        originalname: originalName, // original file name (from URL or headers)
        encoding: '7bit', // file encoding (typical for form uploads)
        mimetype: mimeType, // MIME type of the image
        size: imageBuffer.length, // size of the file in bytes
        buffer: imageBuffer,
        stream: streamifier.createReadStream(imageBuffer),
        destination: '',
        filename: originalName,
        path: '', // Since you're not saving it to di             // the image data as a Buffer
      };

      // 4. Call the upload function with the constructed file object
      const result = await this.uploadFile(
        parentId,
        locationId,
        fileCategoryId,
        file,
      );
      console.log('result:', result);
      return result; // return the result of the uploadFile call
    } catch (error) {
      console.error('Error in downloadAndUploadImage:', error);
      throw error; // re-throw or handle as needed
    }
  }

  async updateFile(
    id: string,
    newFile: Express.Multer.File,
    user: DecodedUser,
  ) {
    try {
      if (!isValidObjectId(id)) {
        return { success: false, message: 'Invalid file ID' };
      }
      const userDetails = await this.businessUserModel.findById(user.id);
      const file = await this.fileModel.findById(id);
      if (!file) {
        return { success: false, message: 'File not found' };
      }
      console.log('newFile:', newFile);
      const updatedFile = await this.uploadAndCreateFile(
        newFile,
        file.parentDirectory.toString(),
        file.ParentDirectoryType,
        userDetails.drive.toString(),
        file.category.toString(),
      );

      await this.fileModel.deleteOne({ _id: new mongoose.Types.ObjectId(id) });

      return {
        success: true,
        message: 'File updated successfully',
        data: updatedFile,
      };
    } catch (error) {
      console.error('Error while updating file:', error);
      return { success: false, message: 'Failed to update file' };
    }
  }

  async deleteBufferAndMultiImageUpload(
    user: any,
    locationId: string,
    images: Express.Multer.File[],
  ) {
    try {
      //delete previously uploaded files
      if (!isValidObjectId(locationId)) {
        return { success: false, message: 'Invalid locationId' };
      }
      await this.fileModel.deleteMany({
        parentDirectory: new mongoose.Types.ObjectId(locationId),
      });

      let parentId = user.id;
      if (!isValidObjectId(parentId)) {
        return { success: false, message: 'Invalid parentId' };
      }
      console.log('parentId:', parentId);
      // Fetch driveDetails, drive/folder location, and fileCategory in parallel
      const [driveDetails, fileCategory] = await Promise.all([
        this.driveModel
          .findOne({ owner: new mongoose.Types.ObjectId(parentId) })
          .lean(),
        this.fileCategoryModel.findOne({ name: 'gallery image' }).lean(),
      ]);
      if (!driveDetails) {
        return { success: false, message: 'Drive not found' };
      }
      if (!fileCategory) {
        return { success: false, message: 'File category not found' };
      }

      // Determine target directory type/id
      const locId = locationId || driveDetails._id.toString();
      const [driveLoc, folderLoc] = await Promise.all([
        this.driveModel.findById(locId).lean(),
        this.folderModel.findById(locId).lean(),
      ]);
      if (!driveLoc && !folderLoc) {
        return { success: false, message: 'Location not found' };
      }
      const parentDirectoryType = driveLoc ? Drive.name : folderLoc.parentType;
      const parentDirectoryId = driveLoc ? driveLoc._id : folderLoc.drive;

      // Filter valid images and prepare upload/create tasks
      let totalSize = 0;
      const tasks = images
        .filter((img) => {
          if (!img.mimetype.startsWith('image/')) {
            console.warn(
              `Converting mimetype of ${img.originalname} to image/jpeg`,
            );
            img.mimetype = 'image/jpeg'; // Force set mimetype
          }

          if (img.size > driveDetails.AvailableSpace) {
            throw new BadRequestException(
              `Insufficient space for ${img.originalname}`,
            );
          }

          return true; // All images go through now
        })
        .map((img) => {
          totalSize += img.size;
          return this.uploadAndCreateFile(
            img,
            locId,
            parentDirectoryType,
            parentId,
            fileCategory._id,
          );
        });

      // Run uploads/creates in parallel
      const createdFiles = await Promise.all(tasks);

      const isInEvent = await this.eventModel.findOne({
        drivePath: new mongoose.Types.ObjectId(locationId),
      });
      if (isInEvent) {
        await this.businessModel.updateOne(
          { _id: isInEvent.businessProfile },
          { $set: { onboardingOfferStatus: OfferStatus.GALLERY } },
        );
      }

      // Deduct used space
      await this.driveModel.updateOne(
        { _id: parentDirectoryId },
        { $inc: { AvailableSpace: -totalSize } },
      );

      return {
        success: true,
        message: 'Files uploaded successfully',
        data: createdFiles,
      };
    } catch (error) {
      console.error('Error uploading media:', error);
      return { success: false, message: 'Failed to upload media' };
    }
  }

  async generateQrCode(
    text: string,
    originalName: string,
    parentId: string,
    fileCategoryId: string,
    locationId: string,
  ) {
    // Step 1: Generate QR code as PNG buffer
    const qrBuffer = await QRCode.toBuffer(text, { type: 'png' });

    // Step 2: Convert PNG to JPG using sharp
    // const jpgBuffer = await sharp(pngBuffer)
    //   .jpeg({ quality: 90 })
    //   .toBuffer();

    // return jpgBuffer;
    // return pngBuffer;

    const file = {
      fieldname: 'file',
      originalname: originalName,
      encoding: '7bit',
      mimetype: 'image/png',
      size: qrBuffer.length,
      buffer: qrBuffer,
      stream: streamifier.createReadStream(qrBuffer),
      destination: '',
      filename: `${uuidv4()}-${originalName}`, // Optional: add unique ID to filename
      path: '',
    };

    const result = await this.uploadFile(
      parentId,
      locationId,
      fileCategoryId,
      file,
    );

    return result;
  }

  async deleteFile(
    id: string,
    user: DecodedUser,
  ) {
    try {
      if (!isValidObjectId(id)) {
        return { success: false, message: 'Invalid file ID' };
      }
      const userDetails = await this.businessUserModel.findById(user.id);
      const file = await this.fileModel.findById(id);
      if (!file) {
        return { success: false, message: 'File not found' };
      }
      // Delete file from S3
      const fileUrl = file.metaData.url;
      const fileName = path.basename(fileUrl);
      await this.s3Service.s3_delete(
        process.env.AWS_S3_BUCKET_NAME,
        fileName,
      );

      // Delete file document from MongoDB
      await this.fileModel.deleteOne({ _id: new mongoose.Types.ObjectId(id) });

      // Update drive space
      const driveDetails = await this.driveModel.findOne({
        owner: new mongoose.Types.ObjectId(userDetails.id),
      });
      if (driveDetails) {
        await this.driveModel.updateOne(
          { _id: driveDetails._id },
          { $inc: { AvailableSpace: file.metaData.size } },
        );
      }

      return {
        success: true,
        message: 'File deleted successfully',
      };
    } catch (error) {
      console.error('Error while deleting file:', error);
      return { success: false, message: 'Failed to delete file' };
    }
  }

}
