import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpStatus,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AiService } from './ai.service';
import { AiDescriptionDto } from './dto/aiDescription.dto';
import { Response } from 'express';
import { UserGuard } from 'src/auth/guards/user.guard';
import { JwtGuard2 } from 'src/auth/guards2/jwt2.guard';
import { TokenDecoder } from 'src/decorators/tokenDecoder.decorator';
import { DecodedUser } from 'src/auth/interfaces/decodedUser.interface';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('/event-description')
  @UseGuards(JwtGuard2)
  async getAiEventDescription(
    @TokenDecoder() user: DecodedUser,
    @Body('contentType') contentType: string,
    @Body('category') category: string,
    @Body('dealType') dealType: string,
    @Body('title') title: string,
    @Body('tags') tags: string[],
  ) {
    const result = await this.aiService.getEventDescription(
      user.businessProfile,
      contentType,
      category,
      dealType,
      title,
      tags
    );
    console.log('RESULT:', result);
    if (result.success) {
      return {
        message: result.message,
        data: result.data,
      };
    } else {
      return new BadRequestException({
        message: result.message,
      });
    }
  }
  @Post('/reward-description')
  @UseGuards(JwtGuard2)
  async getAiRewardDescription(
    @TokenDecoder() user: DecodedUser,
    @Body('rewardType') rewardType: string,
    @Body('activityType') activityType: string,
    @Body('targetCount') targetCount: number,
    @Body('startDate') startDate: string,
    @Body('endDate') endDate: string,
    @Body('title') title: string,
  ) {
    const result = await this.aiService.getRewardDescription(
      user.businessProfile,
      rewardType,
      title,
      activityType,
      targetCount,
      startDate,
      endDate,
    );
    console.log('RESULT:', result);
    if (result.success) {
      return {
        message: result.message,
        data: result.data,
      };
    } else {
      return new BadRequestException({
        message: result.message,
      });
    }
  }


  @Post('/business-description')
  @UseGuards(JwtGuard2)
  async getAiBusinessDescription(@TokenDecoder() user: DecodedUser) {
    const result = await this.aiService.getBusinessDescription(
      user.businessProfile,
    );
    console.log('RESULT:', result);
    if (result.success) {
      return {
        message: result.message,
        data: result.data,
      };
    } else {
      return new BadRequestException({
        message: result.message,
      });
    }
  }
  @Get('title/suggestions')
  @UseGuards(JwtGuard2)
  async getAiTitleSuggestions(
    @TokenDecoder() user: DecodedUser,
    @Query('contentType') contentType: string,
    @Query('category') category: string,
    @Query('dealType') dealType: string,
    @Query('suggestion') suggestion: string,
    @Query('tags') tags: string,
  ) {
    const tagsArray = tags.split(',');
    const result = await this.aiService.getTitleSuggestions(
      contentType,
      category,
      dealType,
      suggestion,
      tagsArray,
    );
    console.log('RESULT:', result);
    if (result.success) {
      return {
        message: result.message,
        data: result.data,
      };
    } else {
      return new BadRequestException({
        message: result.message,
      });
    }
  }
  }
