import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Post,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { JwtGuard } from 'src/auth/guards/jwt.guard';
import { DecodedUser } from 'src/auth/interfaces/decodedUser.interface';
import { TokenDecoder } from 'src/decorators/tokenDecoder.decorator';
import { DriveService } from './drive.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request, Response } from 'express';
import { Folder } from './models/folder.model';
import { isValidObjectId } from 'mongoose';

@Controller('drive')
export class DriveController {
  constructor(private readonly driveService: DriveService) {}

  @Post('fileUpload')
  @UseGuards(JwtGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      // fileFilter: (req, file, cb) => {
      //   //      if (
      //   //        allowedMimeTypes.images.includes(file.mimetype) ||
      //   //        allowedMimeTypes.videos.includes(file.mimetype)
      //   //      ) {
      //   //        cb(null, true);
      //   //      } else {
      //   //        cb(
      //   //          new BadRequestException(
      //   //            'Invalid file type. Only images and videos are allowed.',
      //   //          ),
      //   //          false,
      //   //        );
      //   //      }
      // },
      limits: { fileSize: 100 * 1024 * 1024 }, // ✅ Set file size limit to 100MB
    }),
  )
  async uploadFile(
    @Req() req: Request,
    @Res() res: Response,
    @Body('locationId') locationId: string,
    @Body('fileCategory') fileCategory: string,
    @TokenDecoder() user: DecodedUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    console.log("user:",user);
    const result = await this.driveService.uploadFile(
      user.id,
      locationId,
      fileCategory,
      file,
    );
    if (result.success) {
      return res.status(HttpStatus.OK).json({
        message: result.message,
        //    gallery: result.gallery,
      });
    } else {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: result.message,
      });
    }
  }

  @Post('createFolder')
  async createFolder(@Res() res: Response, @Body() createDto: Partial<Folder>) {
    const result = await this.driveService.createFolder(createDto);

    if (result.success) {
      return res.status(HttpStatus.OK).json({
        message: result.message,
        data: result.data,
      });
    } else {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: result.message,
      });
    }
  }
  @Get('getFiles/:id') // This id will be of drive or a folder
  async getFiles(@Res() res:Response, @Param('id') id: string) {
   
      const result = await this.driveService.getFiles(id);

      if (result.success) {
        return res.status(HttpStatus.OK).json({
          message: result.message,
          data: result.data,
        });
      } else {
        return res.status(HttpStatus.BAD_REQUEST).json({
          message: result.message,
        });
      }
  }
}
