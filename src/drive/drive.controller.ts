import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { JwtGuard } from 'src/auth/guards/jwt.guard';
import { DecodedUser } from 'src/auth/interfaces/decodedUser.interface';
import { TokenDecoder } from 'src/decorators/tokenDecoder.decorator';
import { DriveService } from './drive.service';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { Request, Response } from 'express';
import { Folder } from './models/folder.model';
import { isValidObjectId } from 'mongoose';
import { JwtGuard2 } from 'src/auth/guards2/jwt2.guard';
import { JwtPayload } from 'src/auth/interfaces/tokenPayload.interface';
import { Token } from 'src/auth/models/token.model';
import { DirectoryService } from 'aws-sdk';

@Controller('drive')
export class DriveController {
  constructor(private readonly driveService: DriveService) {}

  @Post('fileUpload')
  @UseGuards(JwtGuard2)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 10 * 1024 * 1024 }, // ✅ Set file size limit to 10MB
    }),
  )
  async uploadFile(
    @Req() req: Request,
    @Body('locationId') locationId: string,
    @Body('fileCategoryId') fileCategoryId: string,
    @TokenDecoder() user: DecodedUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const result = await this.driveService.uploadFile(
      user.id,
      locationId,
      fileCategoryId,
      file,
    );
    if (result.success) {
      return {
        message: result.message,
        data: result.data,
      };
    } else {
      throw new BadRequestException(result.message);
    }
  }

  @Post('createFolder')
  @UseGuards(JwtGuard2)
  async createFolder(
    @TokenDecoder() user: JwtPayload,
    @Body() createDto: Partial<Folder>,
  ) {
    const result = await this.driveService.createFolder(user.id, createDto);

    if (result.success) {
      return {
        message: result.message,
        data: result.data,
      };
    } else {
      throw new BadRequestException(result.message);
    }
  }

  @Get('getFiles')
  @UseGuards(JwtGuard2)
  async getFiles(
    @TokenDecoder() user: DecodedUser,
    @Query('fileCategory') fileCategory?: string,
    @Query('fileType') fileType?: string,
    @Query('folderId') folderId?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    const result = await this.driveService.getFiles(
      user.id,
      user.userType,
      fileCategory,
      folderId,
      fileType,
      page,
      limit,
    );

    if (result.success) {
      return {
        message: result.message,
        data: result.data,
        directoryDetails: result.directoryDetails,
        total: result.total,
        page: result.page,
        limit: result.limit,
        pages: result.pages,
      };
    } else {
      throw new BadRequestException(result.message);
    }
  }

  @Get('fileCategories')
  async fileCategories() {
    const result = await this.driveService.fileCategories();

    if (result.success) {
      return {
        message: result.message,
        data: result.data,
      };
    } else {
      throw new BadRequestException(result.message);
    }
  }

  @Post('moveFile')
  async moveFile(@Body('toMove') toMove: string, @Body('dest') dest: string) {
    const result = await this.driveService.moveFile(toMove, dest);

    if (result.success) {
      return {
        message: result.message,
        data: result.data,
      };
    } else {
      throw new BadRequestException(result.message);
    }
  }

  @Get('fileType')
  async fileType() {
    const result = await this.driveService.fileType();

    if (result.success) {
      return {
        message: result.message,
        data: result.data,
      };
    } else {
      throw new BadRequestException(result.message);
    }
  }

  @Get('recentFiles')
  @UseGuards(JwtGuard2)
  async recentFiles(
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
      return {
        message: result.message,
        data: result.data,
        total: result.total,
      };
    } else {
      throw new BadRequestException(result.message);
    }
  }

  @Post('multiImageUpload')
  @UseGuards(JwtGuard2)
  @UseInterceptors(
    FilesInterceptor('images', 10, {
      limits: { fileSize: 50 * 1024 * 1024 }, // ✅ Set file size limit to 50MB
    }),
  )
  async multiImageUpload(
    @Req() req: Request,
    @Body('locationId') locationId: string,
    @TokenDecoder() user: DecodedUser,
    @UploadedFiles() images: Express.Multer.File[],
  ) {
    const result = await this.driveService.deleteBufferAndMultiImageUpload(
      user,
      locationId,
      images,
    );
    if (result.success) {
      return {
        message: result.message,
        data: result.data,
      };
    } else {
      throw new BadRequestException(result.message);
    }
  }

  @Post('updateFile/:id')
  @UseGuards(JwtGuard2)
  @UseInterceptors(
    FileInterceptor('image', {
      limits: { fileSize: 10 * 1024 * 1024 }, // ✅ Set file size limit to 10MB
    }),
  )
  async updateFile(
    @TokenDecoder() user: DecodedUser,
    @Param('id') id: string,
    @UploadedFile() image: Express.Multer.File,
  ) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid file ID');
    }
    const result = await this.driveService.updateFile(id, image, user);
    if (result.success) {
      return {
        message: result.message,
        data: result.data,
      };
    } else {
      throw new BadRequestException(result.message);
    }
  }

  @Delete('deleteFile/:id')
  @UseGuards(JwtGuard2)
  async deleteFile(
    @TokenDecoder() user: DecodedUser,
    @Param('id') id: string,
  ) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid file ID');
    }
    const result = await this.driveService.deleteFile(id, user);
    if (result.success) {
      return {
        message: result.message,
      };
    } else {
      throw new BadRequestException(result.message);
    }
  }
}
