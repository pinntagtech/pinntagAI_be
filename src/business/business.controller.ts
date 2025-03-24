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
  Req,
  UseGuards,
} from '@nestjs/common';
import { BusinessService } from './business.service';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { Request, Response } from 'express';
import { CreateBusinessUserDto } from './dto/create-businessUser.dto';
import { isValidObjectId } from 'mongoose';
import { LoginBusinessDto } from './dto/login-business.dto';
import { UpdateBusinessUserDto } from './dto/update-businessUser.dto';
import { FetchBusinessDto } from './dto/fetch-business.dto';
import { TokenDecoder } from 'src/decorators/tokenDecoder.decorator';
import { JwtPayload } from 'jsonwebtoken';
import { CreateBrandDto } from './dto/create-brand.dto';
import { JwtGuard2 } from 'src/auth/guards2/jwt2.guard';

@Controller('business')
export class BusinessController {
  constructor(private readonly businessService: BusinessService) {}

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
  @Get()
  @UseGuards(JwtGuard2)
  async fetch(
    @Res() res: Response,
    @Query('limit') limit: string,
    @Query('page') page: string,
    @Body() data: FetchBusinessDto,
  ) {
    const result = await this.businessService.fetch(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
      data,
    );

    if (result.success) {
      return res.status(HttpStatus.OK).json({
        message: result.message,
        data: result.data,
        total: result.total,
        pages: result.pages,
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

  @Post('user')
  async create(
    @Req() req: Request,
    @Res() res: Response,
    @Body() data: CreateBusinessUserDto,
  ) {
    const origin = req.headers.origin;
    const result = await this.businessService.createBusinessUser(data, origin);

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

  //fetch self created businesses'
  @Get('user')
  @UseGuards(JwtGuard2)
  async fetchUsers(
    @Req() req: Request,
    @Res() res: Response,
    @TokenDecoder() user: JwtPayload,
  ) {
    const result = await this.businessService.fetchUser(user.id);

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

  @Post('user/update/:id')
  @UseGuards(JwtGuard2)
  async updateBusinessUser(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id') id: string,
    @Body() data: UpdateBusinessUserDto,
  ) {
    if (!isValidObjectId(id)) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: 'Invalid ObjectId',
      });
    }
    const result = await this.businessService.updateBusinessUser(id, data);
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

  @Post('user/login')
  async login(@Res() res: Response, @Body() data: LoginBusinessDto) {
    const result = await this.businessService.login(data);
    if (result.success) {
      return res.status(HttpStatus.OK).json({
        message: result.message,
        user: result.user,
        token: result.token,
        fcmExists: result.fcmExists,
      });
    } else {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: result.message,
      });
    }
  }

  @Get('user/mailStatus/:id')
  async mailVerificationStatus(@Res() res: Response, @Param('id') id: string) {
    if (!isValidObjectId(id)) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: 'Invalid ObjectId',
      });
    }
    const result = await this.businessService.mailVerificationStatus(id);
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

  @Get('industryList')
  async industryList(@Res() res: Response) {
    const result = await this.businessService.industryList();
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
  
  @Get('businessCategoryList/:id')
  async businessCategoryList(@Res() res: Response, @Param('id') id: string) {
    if (!isValidObjectId(id)) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: 'Invalid ObjectId',
      });
    }
    const result = await this.businessService.businessCategoryList(id);
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
  @Get('verifyRegistrationNumber')
  async checkRegistrationNumber(
    @Res() res: Response,
    @Query('docNumber') docNumber: string,
    @Query('docType') docType: string,
  ) {
    const result = await this.businessService.checkRegistrationNumber(
      docType,
      docNumber,
    );
    if (result.success) {
      return res.status(HttpStatus.OK).json({
        message: result.message,
        // data: result.data,
      });
    } else {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: result.message,
      });
    }
  }
  
  @Get('countries')
  async getCountries(@Res() res: Response) {
    const result = await this.businessService.getCountries();
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
  @Get('constitutionList/:id')
  async constitutionList(@Res() res: Response,@Param('id') id:string) {
    if (!isValidObjectId(id)) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: 'Invalid ObjectId',
      });
    }
    const result = await this.businessService.getConstitutions(id);
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
  @Get('documentTypes/:id')
  async documentTypes(@Res() res: Response,@Param('id') id:string) {
    if (!isValidObjectId(id)) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: 'Invalid ObjectId',
      });
    }
    const result = await this.businessService.getBusinessDocumentTypes(id);
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
  @Post('brand')
  async createBrand(@Res() res: Response, @Body() data: CreateBrandDto) {
    const result = await this.businessService.createBrand(data);
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
  // @Get('brand')
  // async fetchBrand(
  //   @Res() res: Response,
  //   @Query('limit') limit: string,
  //   @Query('page') page: string,
  // ) {
  //   const result = await this.businessService.fetchBrand(
  //     page ? parseInt(page) : 1,
  //     limit ? parseInt(limit) : 10,
  //   );

  //   if (result.success) {
  //     return res.status(HttpStatus.OK).json({
  //       message: result.message,
  //       data: result.data,
  //       total: result.total,
  //       pages: result.pages,
  //     });
  //   } else {
  //     return res.status(HttpStatus.BAD_REQUEST).json({
  //       message: result.message,
  //     });
  //   }
  // }
}
