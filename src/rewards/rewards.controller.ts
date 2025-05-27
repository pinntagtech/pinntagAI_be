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
import { totalmem } from 'os';
import { UserTypes } from 'src/enums/auth.enums';
import { ClaimStatus } from './enums/rewards.enum';

@Controller('reward')
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
    if (user.userType !== UserTypes.BUSINESS) {
      return res.status(HttpStatus.UNAUTHORIZED).json({
        message: 'Unauthorized',
      });
    }
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
  @Get('business')
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

  @Get('fetch/user')
  @UseGuards(JwtGuard2)
  async getUserRewards(
    @Res() res: Response,
    @TokenDecoder() user: DecodedUser,
    @Query('status') status: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
  ) {
    console.log('IS COMING HEREEEEEEE?:::::::');
    const pageNumber = page ? parseInt(page) : 1;
    const limitNumber = limit ? parseInt(limit) : 10;
    const result = await this.rewardService.getUserRewards(
      user,
      status,
      pageNumber,
      limitNumber,
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

  @Get('user/dashboard')
  @UseGuards(JwtGuard2)
  async getDashboardRewards(
    @Res() res: Response,
    @TokenDecoder() user: DecodedUser,
    @Body() data: GetRewardDashboardDto,
    @Query('search') search: string,
    @Query('distance') distance: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
  ) {
    const pageNumber = page ? parseInt(page) : 1;
    const limitNumber = limit ? parseInt(limit) : 10;
    const result = await this.rewardService.getDashboardRewards(
      user,
      data,
      search,
      distance ? parseInt(distance) : 1000000000000,
      pageNumber,
      limitNumber,
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

  @Post('enroll/:rewardId')
  @UseGuards(JwtGuard2)
  async enrollReward(
    @Res() res: Response,
    @TokenDecoder() user: DecodedUser,
    @Param('rewardId') rewardId: string,
  ) {
    if (!isValidObjectId(rewardId)) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: 'Invalid Object ID',
      });
    }
    if (user.userType !== UserTypes.USER) {
      return res.status(HttpStatus.UNAUTHORIZED).json({
        message: 'Unauthorized',
      });
    }
    const result = await this.rewardService.enrollReward(rewardId, user);
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
  @Post('claim/:rewardId')
  @UseGuards(JwtGuard2)
  async claimReward(
    @Res() res: Response,
    @TokenDecoder() user: DecodedUser,
    @Param('rewardId') rewardId: string,
  ) {
    if (!isValidObjectId(rewardId)) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: 'Invalid Object ID',
      });
    }
    if (user.userType !== UserTypes.USER) {
      return res.status(HttpStatus.UNAUTHORIZED).json({
        message: 'Unauthorized',
      });
    }
    const result = await this.rewardService.claimReward(user, rewardId);
    if (result.success) {
      return res.status(HttpStatus.OK).json({
        message: result.message,
        // data: result.data,
      });
    }
    return res.status(HttpStatus.BAD_REQUEST).json({
      message: result.message,
    });
  }
  @Get('user/:id')
  @UseGuards(JwtGuard2)
  async getUserRewardById(
    @Res() res: Response,
    @TokenDecoder() user: DecodedUser,
    @Param('id') id: string,
  ) {
    if (!isValidObjectId(id)) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: 'Invalid Object ID',
      });
    }
    const result = await this.rewardService.getUserRewardById(id, user);
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
  @Get('business/logistics')
  @UseGuards(JwtGuard2)
  async getLogistics(@Res() res: Response, @TokenDecoder() user: DecodedUser) {
    const result = await this.rewardService.getLogistics(user);
    if (result.success) {
      return res.status(HttpStatus.OK).json({
        message: result.message,
        data: result.data,
      });
    }
    return res.status(HttpStatus.BAD_REQUEST).json({
      message: result.message,
    });
  }

  @Get('business/:id')
  @UseGuards(JwtGuard2)
  async getBusinessRewardById(
    @Res() res: Response,
    @Param('id') id: string,
    @Query('claimstatus') claimStatus: string,
    @TokenDecoder() user: DecodedUser,
  ) {
    if (!isValidObjectId(id)) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: 'Invalid Object ID',
      });
    }
    if (claimStatus && !Object.values(ClaimStatus).includes(claimStatus)) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: 'Invalid Claim Status',
      });
    }
    const result = await this.rewardService.getBusinessRewardById(
      id,
      user,
      claimStatus,
    );
    if (result.success) {
      return res.status(HttpStatus.OK).json({
        message: result.message,
        data: result.data,
        claimStatusCounts: result.claimStatusCounts,
      });
    } else {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: result.message,
      });
    }
  }
}
