import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Post,
  Query,
  Res,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  FileFieldsInterceptor,
  FileInterceptor,
  FilesInterceptor,
} from '@nestjs/platform-express';
import { JwtGuard2 } from 'src/auth/guards2/jwt2.guard';
import { DecodedUser } from 'src/auth/interfaces/decodedUser.interface';
import { TokenDecoder } from 'src/decorators/tokenDecoder.decorator';
import { CreateRewardDto } from './dto/create-reward.dto';
import { Response } from 'express';
import { RewardsService } from './rewards.service';
import { isValidObjectId } from 'mongoose';
import { GetDashboardDto } from 'src/auth/dto/getDashboard.dto';
import { GetRewardDashboardDto } from './dto/get-rewards-dashboard.dto';

@Controller('rewards')
export class RewardsController {
  constructor(private readonly rewardService: RewardsService) {}

  @Get('checking')
  async checking() {
    console.log('checking');
    return {
      message: 'Checking',
    };
  }
  @Post()
  @UseGuards(JwtGuard2)
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'images', maxCount: 1 },
      { name: 'qrCode', maxCount: 1 },
    ]),
  )
  async createReward(
    @Res() res: Response,
    @Body() data: CreateRewardDto,
    @TokenDecoder() user: DecodedUser,
    @UploadedFiles()
    files: { images?: Express.Multer.File[]; qrCode?: Express.Multer.File },
  ) {
    console.log('qrCode:', files.qrCode);
    console.log('images:', files.images);
    const result = await this.rewardService.createReward(
      data,
      user,
      files.images,
      files.qrCode,
    );
    if (result.success) {
      return res.status(HttpStatus.CREATED).json({
        message: result.message,
        data: result.data,
      });
    } else {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: result.message,
      });
    }
  }
  @Get(':id')
  @UseGuards(JwtGuard2)
  async getRewardById(
    @Res() res: Response,
    @TokenDecoder() user: DecodedUser,
    @Param('id') id: string,
  ) {
    if (!isValidObjectId(id)) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: 'Invalid Object ID',
      });
    }
    const result = await this.rewardService.getRewardById(id, user);
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
  @Get()
  @UseGuards(JwtGuard2)
  async getAllRewards(@Res() res: Response, @TokenDecoder() user: DecodedUser) {
    const result = await this.rewardService.getAllRewards(user);
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
  @Get('dashboard')
  @UseGuards(JwtGuard2)
  async getDashboardRewards(
    @Res() res: Response,
    @TokenDecoder() user: DecodedUser,
    @Body() data: GetRewardDashboardDto,
    @Query('search') search: string,
    @Query('distance') distance: string,
  ) {
    const result = await this.rewardService.getDashboardRewards(user,data,search,distance);
    if (result.success) {
      return res.status(HttpStatus.OK).json({
        message: result.message,
        // data: result.data,
      });
    } else {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: result.message,
      });
    }
  }
}
