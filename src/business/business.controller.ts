import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Res,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { BusinessService } from './business.service';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { Request, Response } from 'express';
import { CreateBusinessUserDto } from './dto/create-businessUser.dto';
import { isValidObjectId } from 'mongoose';

@Controller('business')
export class BusinessController {
  constructor(private readonly businessService: BusinessService) {}

  // @Post('user')
  // create(@Body() data: CreateBusinessUserDto) {
  //   return this.businessService.createBusinessUser(data);
  // }
  @Post('user')
  async create(@Res() res: Response, @Body() data: CreateBusinessUserDto) {
    const result = await this.businessService.createBusinessUser(data);
    
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

  @Post()
  async createBusiness(@Res() res: Response, @Body() data: CreateBusinessDto) {
    const result = await this.businessService.createBusiness(data);

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
  @Post('update/:id')
  async updateBusiness(
    @Res() res: Response,
    @Param('id') id: string,
    @Body() data: UpdateBusinessDto,
  ) {
    if (!isValidObjectId(id)) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: 'Invalid ObjectId',
      });
    }
    const result = await this.businessService.updateBusiness(id, data);

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


  @Get('fetch')
  async search(
    @Res() res: Response,
    @Query('limit') limit: string,
    @Query('page') page: string,
  ) {
    const result = await this.businessService.search(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
    );

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
  findOne(@Param('id') id: string) {
    return this.businessService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateBusinessDto: UpdateBusinessDto,
  ) {
    return this.businessService.update(+id, updateBusinessDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.businessService.remove(+id);
  }
}
