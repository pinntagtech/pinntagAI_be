import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AppService } from './app.service';
import { IsNotEmpty, IsString } from 'class-validator';
import { RateLimitGuard } from './auth/guards/rateLimiter.guard';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { REDIS_TTL } from './enums/auth.enums';

class GPTRequestDto {
  @IsString()
  @IsNotEmpty()
  prompt: string;
}
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  @Get('categories')
  @UseGuards(RateLimitGuard)
  async getCategories() {
    console.log('Inside Controller');
    const cached = await this.cacheManager.get('categories');
    if (cached) {
      console.log('✅ Returning categories from Redis');
      return { categories: cached };
    }

    // 2. If not in Redis, call the service
    const result = await this.appService.getCategories();

    // 3. Save result in Redis with TTL of 1 day
    await this.cacheManager.set('categories', result, REDIS_TTL.ONEDAY);

    console.log('📦 Cached categories in Redis');
    return { categories: result };
  }
  @Get('businessIndustries')
  @UseGuards(RateLimitGuard)
  async getBusinessIndustries() {
    const result = await this.appService.getBusinessIndustries();
    return {
      businessIndustries: result,
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

  @Get('countryCodes')
  @UseGuards(RateLimitGuard)
  async getCountryCodes() {
    const cached = await this.cacheManager.get('countryCodes');
    if (cached) {
      console.log('✅ Returning country codes from Redis');
      return { countryCodes: cached };
    }
    const countryCodes = await this.appService.getCountryCodes();
    await this.cacheManager.set(
      'countryCodes',
      countryCodes,
      REDIS_TTL.ONEWEEK,
    );
    console.log('📦 Cached country codes in Redis');
    return {
      countryCodes,
    };
  }
}
