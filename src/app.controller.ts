import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { AppService } from './app.service';
import { Response } from 'express';
import OpenAI from 'openai';
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
  async getCategories(@Res() res: Response) {
    return res.status(HttpStatus.OK).json({
      categories: await this.appService.getCategories(),
    });
  }

  @Get('ages')
  async getAgeGroups(@Res() res: Response) {
    return res.status(HttpStatus.OK).json({
      ages: await this.appService.getAgeGroups(),
    });
  }

  @Get('prod/app/version')
  async getAppVersion(@Res() res: Response) {
    const appVersion = await this.appService.getAppVersion();
    return res.status(HttpStatus.OK).json(appVersion);
  }

  @Post('test/openAI')
  async testGPT(
    @Req() req: Request,
    @Res() res: Response,
    @Body() paramsDto: GPTRequestDto,
  ) {
    console.log('paramsDto.prompt::', paramsDto.prompt);
    return res.status(HttpStatus.OK).json({
      response: await this.appService.generateText(paramsDto.prompt),
    });
  }
}
