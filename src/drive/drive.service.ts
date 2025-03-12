import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Drive, DriveDocument } from './models/drive.model';
import { isValidObjectId, Model } from 'mongoose';
import mongoose from 'mongoose';
import { Folder, folderDocument } from './models/folder.model';

@Injectable()
export class DriveService {
    constructor(
        @InjectModel(Drive.name) private readonly driveModel:Model<DriveDocument>,
        @InjectModel(Folder.name) private readonly folderModel:Model<folderDocument>,
    ){}


     async uploadFile(
        parentId: string,
        file: Express.Multer.File,
      ) {
        try {
            if(!isValidObjectId(parentId)){
                return {
                    success:false,
                    message:"Invalid ObjectId"
                }
            }
            console.log("parentId:",parentId)
          const drive = await this.driveModel.findOne({_id:parentId});
          const folder = await this.folderModel.findOne({_id:parentId});
          console.log("drive::",drive);
          console.log("folder:",folder);
          const directory = (folder || drive);
            if()
        //   if (!drive) {
        //     return {
        //       success: false,
        //       message: 'Drive not found',
        //     };
        //   } else {
        //     console.log('file:', file);
        //     const isImage = file.mimetype.startsWith('image/');
        //     const isVideo = file.mimetype.startsWith('video/');
    
        //     if (!isImage && !isVideo) {
        //       return {
        //         success: false,
        //         message: 'Invalid file type. Only images and videos are allowed',
        //       };
        //     }
    
        //     let uploadFileName = manipulateImageName(file.originalname);
        //     const mimeType = isImage ? 'image/jpeg' : 'video/mp4';
    
        //     if (isVideo) {
        //       await this.convertToMp4(file.buffer);
        //       uploadFileName = uploadFileName.replace(/\.[^/.]+$/, '.mp4');
        //     }
        //     const uploadResult = await this.s3Service.s3_upload(
        //       file.buffer,
        //       process.env.AWS_S3_BUCKET_NAME,
        //       uploadFileName,
        //       mimeType,
        //     );
    
        //     if (isImage) {
        //       const imageDoc = await this.imageModel.create({
        //         url: uploadResult.Location,
        //         gallery: gallery._id,
        //       });
        //       await this.galleryModel.updateOne(
        //         { businessProfile },
        //         {
        //           $push: { images: imageDoc._id },
        //         },
        //         { new: true },
        //       );
        //     } else {
        //       const vidDoc = await this.videoModel.create({
        //         url: uploadResult.Location,
        //         gallery: gallery._id,
        //       });
    
        //       await this.galleryModel.updateOne(
        //         { businessProfile },
        //         {
        //           $push: { videos: vidDoc._id },
        //         },
        //         { new: true },
        //       );
        //     }
    
        //     const updatedGallery = await this.galleryModel
        //       .findOne({ businessProfile })
        //       .populate('images', ImagePopulates.FOREIGN)
        //       .populate('videos', VideoPopulates.FOREIGN);
    
        //     console.log('updatedGallery:::', updatedGallery);
    
            return {
              success: true,
              message: 'Image uploaded successfully',
            //   gallery: updatedGallery,
            };
            
        //   }
        } catch (error) {
          console.error('Error uploading media:', error);
          return { success: false, message: 'Failed to upload media' };
        }
      }
}
