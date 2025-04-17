import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Post,
  Query,
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
import { JwtGuard2 } from 'src/auth/guards2/jwt2.guard';
import { JwtPayload } from 'src/auth/interfaces/tokenPayload.interface';
import { Token } from 'src/auth/models/token.model';

@Controller('drive')
export class DriveController {
  constructor(private readonly driveService: DriveService) {}

  @Post('fileUpload')
  @UseGuards(JwtGuard2)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 100 * 1024 * 1024 }, // ✅ Set file size limit to 100MB
    }),
  )
  async uploadFile(
    @Req() req: Request,
    @Res() res: Response,
    @Body('locationId') locationId: string,
    @Body('fileCategoryId') fileCategoryId: string,
    @TokenDecoder() user: DecodedUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    console.log('user:', user);
    const result = await this.driveService.uploadFile(
      user.id,
      locationId,
      fileCategoryId,
      file,
    );
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

  @Post('createFolder')
  @UseGuards(JwtGuard2)
  async createFolder(
    @Res() res: Response,
    @TokenDecoder() user: JwtPayload,
    @Body() createDto: Partial<Folder>,
  ) {
    const result = await this.driveService.createFolder(user.id, createDto);

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
  @Get('getFiles')
  @UseGuards(JwtGuard2)
  async getFiles(
    @Res() res: Response,
    @TokenDecoder() user: DecodedUser,
    @Query('fileCategory') fileCategory?: string,
    @Query('fileType') fileType?: string,
    @Query('folderId') folderId?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    let pageNumber = Number(page);
    let limitNumber = Number(limit);
    const result = await this.driveService.getFiles(
      user.id,
      user.userType,
      fileCategory,
      folderId,
      fileType,
      pageNumber,
      limitNumber,
    );

    if (result.success) {
      return res.status(HttpStatus.OK).json({
        message: result.message,
        data: result.data,
        total: result.total,
        page: result.page,
        limit: result.limit,
        pages: result.pages,
      });
    } else {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: result.message,
      });
    }
  }
  @Get('fileCategories')
  async fileCategories(@Res() res: Response) {
    const result = await this.driveService.fileCategories();

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
  @Post('moveFile')
  async moveFile(
    @Res() res: Response,
    @Body('toMove') toMove: string,
    @Body('dest') dest: string,
  ) {
    const result = await this.driveService.moveFile(toMove, dest);

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

  @Get('fileType')
  async fileType(@Res() res: Response) {
    const result = await this.driveService.fileType();

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

  @Get('recentFiles')
  @UseGuards(JwtGuard2)
  async recentFiles(
    @Res() res: Response,
    @TokenDecoder() user: DecodedUser,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    const result = await this.driveService.recentlyUploadedFiles(
      user.id,
      user.userType,
      page,
      limit,
    );

    if (result.success) {
      return res.status(HttpStatus.OK).json({
        message: result.message,
        data: result.data,
        total: result.total,
      });
    } else {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: result.message,
      });
    }
  }
}
