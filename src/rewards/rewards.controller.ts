import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Res,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
  BadRequestException,
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
import { RateLimitGuard } from 'src/auth/guards/rateLimiter.guard';

@Controller('reward')
export class RewardsController {
  constructor(private readonly rewardService: RewardsService) {}

  @Get('checking')
  @UseGuards(RateLimitGuard)
  async checking() {
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
    @Body() data: CreateRewardDto,
    @TokenDecoder() user: DecodedUser,
    @UploadedFiles()
    files: { images?: Express.Multer.File[]; qrCode?: Express.Multer.File },
  ) {
    if (user.userType !== UserTypes.BUSINESS) {
      throw new BadRequestException('Unauthorized');
    }
    if (!files.images) {
      throw new BadRequestException('Cover Image is required');
    }
    const result = await this.rewardService.createReward(
      data,
      user,
      files.images,
      files.qrCode,
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

  @Get('business')
  @UseGuards(JwtGuard2)
  async getAllRewards(
    @TokenDecoder() user: DecodedUser,
    @Query('page') page: string,
    @Query('limit') limit: string,
  ) {
    const pageNumber = page ? parseInt(page) : 1;
    const limitNumber = limit ? parseInt(limit) : 10;
    const result = await this.rewardService.getAllRewards(
      user,
      pageNumber,
      limitNumber,
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

  @Get(':id')
  @UseGuards(JwtGuard2)
  async getRewardById(
    @TokenDecoder() user: DecodedUser,
    @Param('id') id: string,
    @Query('latitude') latitude: string,
    @Query('longitude') longitude: string,
  ) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid Object ID');
    }
    const result = await this.rewardService.getRewardById(id, user, latitude, longitude);
    if (result.success) {
      return {
        message: result.message,
        data: result.data,
      };
    } else {
      throw new BadRequestException(result.message);
    }
  }

  @Get('fetch/user')
  @UseGuards(JwtGuard2)
  async getUserRewards(
    @TokenDecoder() user: DecodedUser,
    @Query('status') status: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
  ) {
    const pageNumber = page ? parseInt(page) : 1;
    const limitNumber = limit ? parseInt(limit) : 10;
    const result = await this.rewardService.getUserRewards(
      user,
      status,
      pageNumber,
      limitNumber,
    );
    if (result.success) {
      return {
        message: result.message,
        data: result.data,
        total: result.total,
        pages: result.pages,
        page: result.page,
        limit: result.limit,
      };
    } else {
      throw new BadRequestException(result.message);
    }
  }

  @Get('user/dashboard')
  @UseGuards(JwtGuard2)
  async getDashboardRewards(
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
      return {
        message: result.message,
        data: result.data,
        total: result.total,
        pages: result.pages,
        page: result.page,
        limit: result.limit,
      };
    } else {
      throw new BadRequestException(result.message);
    }
  }

  @Post('enroll/:rewardId')
  @UseGuards(JwtGuard2)
  async enrollReward(
    @TokenDecoder() user: DecodedUser,
    @Param('rewardId') rewardId: string,
  ) {
    if (!isValidObjectId(rewardId)) {
      throw new BadRequestException('Invalid Object ID');
    }
    if (user.userType !== UserTypes.USER) {
      throw new BadRequestException('Unauthorized');
    }
    const result = await this.rewardService.enrollReward(rewardId, user);
    if (result.success) {
      return {
        message: result.message,
        data: result.data,
      };
    } else {
      throw new BadRequestException(result.message);
    }
  }

  @Post('claim/:rewardId')
  @UseGuards(JwtGuard2)
  async claimReward(
    @TokenDecoder() user: DecodedUser,
    @Param('rewardId') rewardId: string,
  ) {
    if (!isValidObjectId(rewardId)) {
      throw new BadRequestException('Invalid Object ID');
    }
    if (user.userType !== UserTypes.USER) {
      throw new BadRequestException('Unauthorized');
    }
    const result = await this.rewardService.claimReward(user, rewardId);
    if (result.success) {
      return {
        message: result.message,
      };
    } else {
      throw new BadRequestException(result.message);
    }
  }

  @Get('user/:id')
  @UseGuards(JwtGuard2)
  async getUserRewardById(
    @TokenDecoder() user: DecodedUser,
    @Param('id') id: string,
  ) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid Object ID');
    }
    const result = await this.rewardService.getUserRewardById(id, user);
    if (result.success) {
      return {
        message: result.message,
        data: result.data,
      };
    } else {
      throw new BadRequestException(result.message);
    }
  }

  @Get('business/logistics')
  @UseGuards(JwtGuard2)
  async getLogistics(@TokenDecoder() user: DecodedUser) {
    const result = await this.rewardService.getLogistics(user);
    if (result.success) {
      return {
        message: result.message,
        data: result.data,
      };
    } else {
      throw new BadRequestException(result.message);
    }
  }

  @Get('business/:id')
  @UseGuards(JwtGuard2)
  async getBusinessRewardById(
    @Param('id') id: string,
    @Query('claimstatus') claimStatus: string,
    @TokenDecoder() user: DecodedUser,
  ) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid Object ID');
    }
    if (claimStatus && !Object.values(ClaimStatus).includes(claimStatus)) {
      throw new BadRequestException('Invalid Claim Status');
    }
    const result = await this.rewardService.getBusinessRewardById(
      id,
      user,
      claimStatus,
    );
    if (result.success) {
      return {
        message: result.message,
        data: result.data,
        claimStatusCounts: result.claimStatusCounts,
      };
    } else {
      throw new BadRequestException(result.message);
    }
  }

  @Put('scan-reward/:rewardId')
  @UseGuards(JwtGuard2)
  async scanReward(
    @Param('rewardId') rewardId: string,
    @TokenDecoder() user: DecodedUser,
  ) {
    const result = await this.rewardService.handleScanReward(rewardId, user.id);
    if (result.success) {
      return result;
    } else {
      throw new BadRequestException(result.message);
    }
  }
}
