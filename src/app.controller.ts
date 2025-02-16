import { Controller, Get, HttpStatus, Param, Res } from '@nestjs/common';
import { AppService } from './app.service';
import { Response } from 'express';

@Controller('v1')
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
}
