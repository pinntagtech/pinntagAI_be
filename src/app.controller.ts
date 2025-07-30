import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { IsNotEmpty, IsString } from 'class-validator';
import { RateLimitGuard } from './auth/guards/rateLimiter.guard';

class GPTRequestDto {
  @IsString()
  @IsNotEmpty()
  prompt: string;
}
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('categories')
  @UseGuards(RateLimitGuard)
  async getCategories() {
    const result = await this.appService.getCategories();
    return {
      categories: result,
    };
  }

  @Get('ages')
  @UseGuards(RateLimitGuard)
  async getAgeGroups() {
    const ageGroups = await this.appService.getAgeGroups();
    return {
      ages: ageGroups,
    };
  }

  @Get('prod/app/version')
  @UseGuards(RateLimitGuard)
  async getAppVersion() {
    const appVersion = await this.appService.getAppVersion();
    return appVersion;
  }

  @Post('test/openAI')
  @UseGuards(RateLimitGuard)
  async testGPT(@Body() paramsDto: GPTRequestDto) {
    try {
      const response = await this.appService.generateText(paramsDto.prompt);
      return {
        response,
      };
    } catch (error) {
      console.error('Error generating text:', error);
      return {
        error: 'Failed to generate text',
      };
    }
  }
  @Get('tags/:id')
  @UseGuards(RateLimitGuard)
  async getTags(@Param('id') id: string) {
    const tags = await this.appService.getTags(id);
    return {
      tags,
    };
  }
}
