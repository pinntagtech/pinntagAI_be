import { Body, Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { IsNotEmpty, IsString } from 'class-validator';

class GPTRequestDto {
  @IsString()
  @IsNotEmpty()
  prompt: string;
}
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('categories')
  async getCategories() {
    const result = await this.appService.getCategories();
    return {
      catgories: result,
    };
  }

  @Get('ages')
  async getAgeGroups() {
    const ageGroups = await this.appService.getAgeGroups();
    return {
      ages: ageGroups,
    };
  }

  @Get('prod/app/version')
  async getAppVersion() {
    const appVersion = await this.appService.getAppVersion();
    return appVersion;
  }

  @Post('test/openAI')
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
}
