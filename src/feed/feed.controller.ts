import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtGuard2 } from 'src/auth/guards2/jwt2.guard';
import { DecodedUser } from 'src/auth/interfaces/decodedUser.interface';
import { TokenDecoder } from 'src/decorators/tokenDecoder.decorator';
import { FeedService } from './feed.service';

@Controller('feed')
export class FeedController {
  constructor(private readonly feedService: FeedService) {}

  @Get()
  @UseGuards(JwtGuard2)
  async getFeed(
    @TokenDecoder() user: DecodedUser,
    @Query('visibility') visibility: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('type') type: string,
  ) {
    const result = await this.feedService.getFeed(
      user,
      visibility,
      type,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
    );
    if (result.success) {
      return {
        message: result.message,
        data: result.data,
        total: result.total,
        totalPages: result.totalPages,
        page: result.page,
        limit: result.limit,
      };
    } else {
      throw new BadRequestException(result.message);
    }
  }

  @Get('business')
  @UseGuards(JwtGuard2)
  async getBusinessFeed(
    @TokenDecoder() user: DecodedUser,
    @Query('visibility') visibility: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('type') type: string,
  ) {
    const result = await this.feedService.getBusinessFeed(
      user,
      visibility,
      type,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
    );
    if (result.success) {
      return {
        message: result.message,
        data: result.data,
        total: result.total,
        totalPages: result.totalPages,
        page: result.page,
        limit: result.limit,
      };
    } else {
      throw new BadRequestException(result.message);
    }
  }





  @Patch('like/toggle/:id')
  @UseGuards(JwtGuard2)
  async likeFeed(
    @Param('id') feedId: string,
    @TokenDecoder() user: DecodedUser,
  ) {
    const result = await this.feedService.likeFeed(feedId, user.id);
    if (result.success) {
      return {
        message: result.message,
        liked: result.liked,
      };
    } else {
      throw new BadRequestException({
        message: result.message,
      });
    }
  }
}
