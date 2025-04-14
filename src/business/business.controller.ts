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
import { Privilege } from 'src/roles/privilege.decorator';
import { Actions, ResourceTypes } from 'src/roles/enums/roles.enum';
import { PrivilegeGuard } from 'src/roles/guards/privilege.guards';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { RateLimit } from 'nestjs-rate-limiter';
import { CreateDownlineBusinessUserDto } from './dto/create-downline-businessUser.dto';
import { ResetPasswordGuard } from 'src/auth/guards2/resetPassword.guard';
import { DecodedUser } from 'src/auth/interfaces/decodedUser.interface';
import { Token } from 'src/auth/models/token.model';

@Controller('business')
export class BusinessController {
  constructor(private readonly businessService: BusinessService) {}

  @Post()
  @UseGuards(JwtGuard2)
  async createBusiness(
    @TokenDecoder() user: JwtPayload,
    @Res() res: Response,
    @Body() data: CreateBusinessDto,
  ) {
    const result = await this.businessService.createBusiness(user.id, data);

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

  @Post('update')
  @UseGuards(JwtGuard2)
  async updateBusiness(
    @Res() res: Response,
    @TokenDecoder() user: JwtPayload,
    @Body() data: UpdateBusinessDto,
  ) {
    if (!isValidObjectId(user.id)) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: 'Invalid ObjectId',
      });
    }
    const result = await this.businessService.updateBusiness(user.id, data);

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
  @Post('user/verify')
  async verifyUser(@Res() res: Response, @Body() data: VerifyEmailDto) {
    const result = await this.businessService.verifyUser(data);

    if (result.success) {
      return res.status(HttpStatus.OK).json({
        message: result.message,
        token: result.token,
      });
    } else {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: result.message,
      });
    }
  }
  @Post('user/resendOtp')
  async resendOtp(@Res() res: Response, @Body('email') email: string) {
    const result = await this.businessService.resendOtp(email);
    if (result.success) {
      return res.status(HttpStatus.OK).json({
        message: result.message,
      });
    } else {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: result.message,
      });
    }
  }

  //fetch self created bussiness users and downline users'
  @Get('users')
  @UseGuards(JwtGuard2)
  async fetchUsers(
    @Req() req: Request,
    @Res() res: Response,
    @Query('page') page: string,
    @Query('limit') limit: string,
    @TokenDecoder() user: JwtPayload,
  ) {
    const pageNumber = page ? parseInt(page) : 1;
    const limitNumber = limit ? parseInt(limit) : 10;
    const result = await this.businessService.getUsersList(
      user.id,
      pageNumber,
      limitNumber,
    );

    if (result.success) {
      return res.status(HttpStatus.OK).json({
        message: result.message,
        data: result.data,
        total: result.total,
      });
    } else {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: result.message,
      });
    }
  }

  @Post('user/update')
  @UseGuards(JwtGuard2)
  async updateBusinessUser(
    @Req() req: Request,
    @Res() res: Response,
    @TokenDecoder() user: JwtPayload,
    @Body() data: UpdateBusinessUserDto,
  ) {
    if (!isValidObjectId(user.id)) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: 'Invalid ObjectId',
      });
    }
    const result = await this.businessService.updateBusinessUser(user.id, data);
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
        status: result.status,
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
  async mailVerificationStatus(
    @Res() res: Response,
    @Param('id') id: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
  ) {
    const pageNumber = page ? parseInt(page) : 1;
    const limitNumber = limit ? parseInt(limit) : 10;
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
  @RateLimit({ points: 5, duration: 60 })
  async industryList(
    @Res() res: Response,
    @Query('page') page: string,
    @Query('limit') limit: string,
  ) {
    const pageNumber = page ? parseInt(page) : 1;
    const limitNumber = limit ? parseInt(limit) : 10;
    const result = await this.businessService.industryList(
      pageNumber,
      limitNumber,
    );
    if (result.success) {
      return res.status(HttpStatus.OK).json({
        message: result.message,
        data: result.data,
        total: result.total,
      });
    } else {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: result.message,
      });
    }
  }

  @Get('businessCategoryList/:id')
  @RateLimit({ points: 5, duration: 60 })
  async businessCategoryList(
    @Res() res: Response,
    @Param('id') id: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
  ) {
    const pageNumber = page ? parseInt(page) : 1;
    const limitNumber = limit ? parseInt(limit) : 10;
    if (!isValidObjectId(id)) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: 'Invalid ObjectId',
      });
    }
    const result = await this.businessService.businessCategoryList(
      id,
      pageNumber,
      limitNumber,
    );
    if (result.success) {
      return res.status(HttpStatus.OK).json({
        message: result.message,
        data: result.data,
        total: result.total,
      });
    } else {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: result.message,
      });
    }
  }
  @Get('verifyRegistrationNumber')
  @UseGuards(JwtGuard2)
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
        data: result.data,
      });
    } else {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: result.message,
      });
    }
  }

  @Get('countries')
  async getCountries(
    @Res() res: Response,
    @Query('page') page: string,
    @Query('limit') limit: string,
  ) {
    const pageNumber = page ? parseInt(page) : 1;
    const limitNumber = limit ? parseInt(limit) : 10;
    const result = await this.businessService.getCountries(
      pageNumber,
      limitNumber,
    );
    if (result.success) {
      return res.status(HttpStatus.OK).json({
        message: result.message,
        data: result.data,
        total: result.total,
      });
    } else {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: result.message,
      });
    }
  }
  @Get('constitutionList/:id')
  async constitutionList(
    @Res() res: Response,
    @Param('id') id: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
  ) {
    const pageNumber = page ? parseInt(page) : 1;
    const limitNumber = limit ? parseInt(limit) : 10;
    if (!isValidObjectId(id)) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: 'Invalid ObjectId',
      });
    }
    const result = await this.businessService.getConstitutions(
      id,
      pageNumber,
      limitNumber,
    );
    if (result.success) {
      return res.status(HttpStatus.OK).json({
        message: result.message,
        data: result.data,
        total: result.total,
      });
    } else {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: result.message,
      });
    }
  }
  @Get('documentTypes/:id')
  async documentTypes(
    @Res() res: Response,
    @Param('id') id: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
  ) {
    const pageNumber = page ? parseInt(page) : 1;
    const limitNumber = limit ? parseInt(limit) : 10;
    if (!isValidObjectId(id)) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: 'Invalid ObjectId',
      });
    }
    const result = await this.businessService.getBusinessDocumentTypes(
      id,
      pageNumber,
      limitNumber,
    );
    if (result.success) {
      return res.status(HttpStatus.OK).json({
        message: result.message,
        data: result.data,
        total: result.total,
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
  @Post('toggleStatus/:id')
  @Privilege(ResourceTypes.USERS, Actions.UPDATE)
  @UseGuards(PrivilegeGuard)
  @UseGuards(JwtGuard2)
  async toggleStatus(
    @Res() res: Response,
    @TokenDecoder() user: JwtPayload,
    @Param('id') id: string,
    @Body('isActive') isActive: boolean,
  ) {
    if (!isValidObjectId(id)) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: 'Invalid ObjectId',
      });
    }
    const result = await this.businessService.toggleStatus(
      user.id,
      id,
      isActive,
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

  @Post('downlineUser')
  @Privilege(ResourceTypes.USERS, Actions.CREATE)
  @UseGuards(PrivilegeGuard)
  @UseGuards(JwtGuard2)
  async createDownlineUser(
    @TokenDecoder() user: JwtPayload,
    @Res() res: Response,
    @Body() data: CreateDownlineBusinessUserDto,
  ) {
    const result = await this.businessService.createDownlineUser(user.id, data);
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
  @Post('user/login/reset-password')
  @UseGuards(ResetPasswordGuard)
  async forceResetPassword(
    @Req() req: Request,
    @Res() res: Response,
    @Body() body: { password: string },
    @TokenDecoder() user: DecodedUser,
  ) {
    if (!body.password) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: 'Please provide password.',
      });
    }
    if (typeof body.password !== 'string') {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: 'Please provide valid password.',
      });
    }
    const result = await this.businessService.forceResetPassword(
      user.id,
      body.password,
      req['tokenId'],
    );
    if (result.success) {
      return res.status(HttpStatus.OK).json({
        message: result.message,
        token: result.token,
      });
    } else {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: result.message,
      });
    }
  }

  @Post('deleteUser/:id')
  @Privilege(ResourceTypes.USERS, Actions.DELETE)
  @UseGuards(PrivilegeGuard)
  @UseGuards(JwtGuard2)
  async deleteUser(
    @Res() res: Response,
    @TokenDecoder() user: JwtPayload,
    @Param('id') id: string,
  ) {
    if (!isValidObjectId(id)) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: 'Invalid ObjectId',
      });
    }
    const result = await this.businessService.deleteUser(user.id, id);
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

  @Get('list')
  @UseGuards(JwtGuard2)
  async fetchBusinessList(
    @Res() res: Response,
    @Query('limit') limit: string,
    @Query('page') page: string,
    @TokenDecoder() user: JwtPayload,
  ) {
    const result = await this.businessService.fetchBusinessList(
      user.id,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
    );

    if (result.success) {
      return res.status(HttpStatus.OK).json({
        message: result.message,
        data: result.data,
        // total: result.total,
        // pages: result.pages,
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
