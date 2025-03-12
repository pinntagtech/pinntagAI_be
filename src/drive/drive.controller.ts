import {
  BadRequestException,
  Controller,
  HttpStatus,
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

@Controller('drive')
export class DriveController {
  constructor(private readonly driveService: DriveService) {}

  @Post('fileUpload')
//   @UseGuards(JwtGuard)
  @UseInterceptors(
    FileInterceptor(
      'file',
      // , {
      //   dest: './uploads',
      //   fileFilter: imageFileFilter,
      //   storage: diskStorage({
      //     destination: './uploads',
      //     filename: editFileName,
      //   }),
      // }
      {
        // storage: memoryStorage(),
        fileFilter: (req, file, cb) => {
          //      if (
          //        allowedMimeTypes.images.includes(file.mimetype) ||
          //        allowedMimeTypes.videos.includes(file.mimetype)
          //      ) {
          //        cb(null, true);
          //      } else {
          //        cb(
          //          new BadRequestException(
          //            'Invalid file type. Only images and videos are allowed.',
          //          ),
          //          false,
          //        );
          //      }
        },
        limits: { fileSize: 100 * 1024 * 1024 }, // ✅ Set file size limit to 100MB
      },
    ),
  )
  async uploadFile(
    @Req() req: Request,
    @Res() res: Response,
    // @TokenDecoder() user: DecodedUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const result = await this.driveService.uploadFile(
      "67cef2078097de41d3fda59d",
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
}
