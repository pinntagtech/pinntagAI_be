import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Req,
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
import { PinntagAiService } from './pinntag-ai.service';
import { ConnectableObservable } from 'rxjs';

@Controller('ai')
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly pinntagAiService: PinntagAiService,
  ) {}

  @Post('event-description')
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
      tags,
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
  @Post('reward-description')
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

  @Post('business-description')
  @UseGuards(JwtGuard2)
  async getAiBusinessDescription(@TokenDecoder() user: DecodedUser) {
    // const result = await this.aiService.getBusinessDescription(
    //   user.businessProfile,
    // );
    const result = await this.pinntagAiService.generateBusinessDescription(
      user.businessProfile,
    );
    console.log('RESULT:', result);
    if (result.success) {
      return {
        message: result.message,
        data: result.data.description,
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
    let tagsArray = [];
    console.log('Tags:', tags);
    if (tags && tags != '') {
      tagsArray = tags.split(',');
    }
    const result = await this.aiService.getTitleSuggestions(
      contentType,
      category,
      dealType,
      suggestion,
      tagsArray,
    );
    // const result = await this.pinntagAiService.generateTitleSuggestions(user.businessProfile);
    // console.log('RESULT:', result);
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

  @Post('pinntagAgent')
  async createAgent(@Body() body) {
    return this.pinntagAiService.createAgent(body);
  }


  @Post('pinntagAi/businessDescription/:businessId')
  async generateBusinessDescription(@Param('businessId') businessId: string) {
    return this.pinntagAiService.generateBusinessDescription(businessId);
  }


  @Post('pinntagAi/tags/:businessId')
  async generateTitleSuggestions(@Param('businessId') businessId: string) {
    return this.pinntagAiService.generateBusinessTagsSuggestions(businessId);
  }

  @Get()


  @Post('pinntagAi/businessDescAndUpdateTags')
  async generateBusinessDescriptionWithTagsUpdate(@Body() body) {
    return this.pinntagAiService.generateBusinessDescriptionWithTagsUpdate(body);
  }

  @Put('update/pinntagAgent/:id')
  async updateAgent(@Body() body, @Param('id') id: string) {
    return this.pinntagAiService.updateAgent(body, id);
  }
}
