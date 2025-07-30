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
  Put,
  ParseIntPipe,
  DefaultValuePipe,
  BadRequestException,
  UploadedFile,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { BusinessService } from './business.service';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { Request, Response } from 'express';
import { CreateBusinessUserDto } from './dto/create-businessUser.dto';
import mongoose, { isValidObjectId } from 'mongoose';
import { LoginBusinessDto } from './dto/login-business.dto';
import { UpdateBusinessUserDto } from './dto/update-businessUser.dto';
import { FetchBusinessDto } from './dto/fetch-business.dto';
import { TokenDecoder } from 'src/decorators/tokenDecoder.decorator';
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
import { TypeDataDto } from './dto/business-type.dto';
import {
  CreateDepartmentDto,
  UpdateDepartmentDto,
} from './dto/create-department.dto';
import { UpdateDownlineBusinessUserDto } from './dto/update-downline-businessUser.dto';
import { CreateRegionDto, UpdateRegionDto } from './dto/create-region.dto';
import {
  CreateLocationGroupDto,
  UpdateLocationGroupDto,
} from './dto/create-locationGroup.dto';
import { RateLimitGuard } from 'src/auth/guards/rateLimiter.guard';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';

@Controller('business')
export class BusinessController {
  constructor(private readonly businessService: BusinessService) {}

  @Post()
  @UseGuards(JwtGuard2)
  async createBusiness(
    @TokenDecoder() user: DecodedUser,
    @Body() data: CreateBusinessDto,
  ) {
    const result = await this.businessService.createBusiness(
      user.id,
      user.token,
      data,
    );

    if (result.success) {
      return {
        message: result.message,
        data: result.data,
        token: result.token,
      };
    } else {
      throw new BadRequestException(result.message);
    }
  }

  @Get()
  @UseGuards(JwtGuard2)
  @UseGuards(RateLimitGuard)
  async fetch(
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Body() data: FetchBusinessDto,
  ) {
    const result = await this.businessService.fetch(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
      data,
    );
    if (result.success) {
      return {
        message: result.message,
        data: result.data,
        total: result.total,
        pages: result.pages,
        page: result.page,
        limit: result.limit,
      };
    } else {
      throw new BadRequestException(result.message);
    }
  }

  @Get('active')
  @UseGuards(JwtGuard2)
  async tokenBusinessData(@TokenDecoder() user: DecodedUser) {
    const result = await this.businessService.tokenBusinessData(
      user.businessProfile,
    );
    if (result.success) {
      return {
        message: result.message,
        data: result.data,
      };
    } else {
      throw new BadRequestException(result.message);
    }
  }

  @Post('update')
  @UseGuards(JwtGuard2)
  async updateBusiness(
    @TokenDecoder() user: DecodedUser,
    @Body() data: UpdateBusinessDto,
    @Query('businessId') businessId: string,
  ) {
    if (!isValidObjectId(user.id)) {
      throw new BadRequestException('Invalid ObjectId');
    }
    let businessProfileId = null;
    if (businessId) {
      if (!isValidObjectId(businessId)) {
        businessProfileId = user.businessProfile;
      }
      businessProfileId = businessId;
    } else {
      businessProfileId = user.businessProfile;
    }
    const result = await this.businessService.updateBusiness(
      user.id,
      businessProfileId,
      data,
    );

    if (result.success) {
      return {
        message: result.message,
        data: result.data,
      };
    } else {
      throw new BadRequestException(result.message);
    }
  }

  @Post('user')
  async create(@Req() req: Request, @Body() data: CreateBusinessUserDto) {
    const result = await this.businessService.createBusinessUser(data);

    if (result.success) {
      return {
        message: result.message,
        data: result.data,
      };
    } else {
      throw new BadRequestException(result.message);
    }
  }

  @Post('user/verify')
  async verifyUser(@Body() data: VerifyEmailDto) {
    const result = await this.businessService.verifyUser(data);

    if (result.success) {
      return {
        message: result.message,
        token: result.token,
      };
    } else {
      throw new BadRequestException(result.message);
    }
  }

  @Post('user/resendOtp')
  async resendOtp(@Body('email') email: string) {
    const result = await this.businessService.resendOtp(email);
    if (result.success) {
      return {
        message: result.message,
      };
    } else {
      throw new BadRequestException(result.message);
    }
  }

  @Get('users')
  @UseGuards(JwtGuard2)
  async fetchUsers(
    @Query('page') page: string,
    @Query('limit') limit: string,
    @TokenDecoder() user: DecodedUser,
  ) {
    const pageNumber = page ? parseInt(page) : 1;
    const limitNumber = limit ? parseInt(limit) : 10;
    const result = await this.businessService.getUsersList(
      user.id,
      pageNumber,
      limitNumber,
    );

    if (result.success) {
      return {
        message: result.message,
        data: result.data,
        total: result.total,
        pages: result.pages,
        page: result.page,
        limit: result.limit,
      };
    } else {
      throw new BadRequestException(result.message);
    }
  }

  @Post('user/update')
  @UseGuards(JwtGuard2)
  @UseInterceptors(
    FileInterceptor('profilePhoto', {
      //   dest: './uploads',
      //   fileFilter: imageFileFilter,
      //   storage: diskStorage({
      //     destination: './uploads',
      //     filename: editFileName,
      //   }),
      //   //Setting file size limit to 1 MB
      limits: { fileSize: 1000000 },
    }),
  )
  async updateBusinessUser(
    @TokenDecoder() user: DecodedUser,
    @UploadedFile() profilePhoto: Express.Multer.File,
    @Body() data: UpdateBusinessUserDto,
  ) {
    if (!isValidObjectId(user.id)) {
      throw new BadRequestException('Invalid ObjectId');
    }
    const result = await this.businessService.updateBusinessUser(
      user.id,
      data,
      profilePhoto,
    );
    if (result.success) {
      return {
        message: result.message,
        data: result.data,
      };
    } else {
      throw new BadRequestException(result.message);
    }
  }

  @Post('user/login')
  async login(@Body() data: LoginBusinessDto) {
    const result = await this.businessService.login(data);
    if (result.success) {
      return {
        message: result.message,
        user: result.user,
        status: result.status,
        token: result.token,
        fcmExists: result.fcmExists,
      };
    } else {
      throw new BadRequestException(result.message);
    }
  }

  @Get('user/mailStatus/:id')
  @UseGuards(RateLimitGuard)
  async mailVerificationStatus(@Param('id') id: string) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid ObjectId');
    }
    const result = await this.businessService.mailVerificationStatus(id);
    if (result.success) {
      return {
        message: result.message,
        data: result.data,
      };
    } else {
      throw new BadRequestException(result.message);
    }
  }

  @Get('industryList')
  @UseGuards(RateLimitGuard)
  async industryList(
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
      return {
        message: result.message,
        data: result.data,
        total: result.total,
        pages: result.pages,
        page: result.page,
        limit: result.limit,
      };
    } else {
      throw new BadRequestException(result.message);
    }
  }

  @Get('businessCategoryList/:id')
  @UseGuards(RateLimitGuard)
  async businessCategoryList(
    @Param('id') id: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
  ) {
    const pageNumber = page ? parseInt(page) : 1;
    const limitNumber = limit ? parseInt(limit) : 10;
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid ObjectId');
    }
    const result = await this.businessService.businessCategoryList(
      id,
      pageNumber,
      limitNumber,
    );
    if (result.success) {
      return {
        message: result.message,
        data: result.data,
        total: result.total,
        pages: result.pages,
        page: result.page,
        limit: result.limit,
      };
    } else {
      throw new BadRequestException(result.message);
    }
  }

  @Get('verifyRegistrationNumber')
  @UseGuards(JwtGuard2)
  async checkRegistrationNumber(
    @Query('docNumber') docNumber: string,
    @Query('docType') docType: string,
  ) {
    const result = await this.businessService.checkRegistrationNumber(
      docType,
      docNumber,
    );
    if (result.success) {
      return {
        message: result.message,
        data: result.data,
      };
    } else {
      throw new BadRequestException(result.message);
    }
  }

  @Get('countries')
  @UseGuards(RateLimitGuard)
  async getCountries(
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
      return {
        message: result.message,
        data: result.data,
        total: result.total,
      };
    } else {
      throw new BadRequestException(result.message);
    }
  }

  @Get('constitutionList/:id')
  @UseGuards(RateLimitGuard)
  async constitutionList(
    @Param('id') id: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
  ) {
    const pageNumber = page ? parseInt(page) : 1;
    const limitNumber = limit ? parseInt(limit) : 10;
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid ObjectId');
    }
    const result = await this.businessService.getConstitutions(
      id,
      pageNumber,
      limitNumber,
    );
    if (result.success) {
      return {
        message: result.message,
        data: result.data,
        total: result.total,
      };
    } else {
      throw new BadRequestException(result.message);
    }
  }

  @Get('documentTypes/:id')
  @UseGuards(RateLimitGuard)
  async documentTypes(
    @Param('id') id: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
  ) {
    const pageNumber = page ? parseInt(page) : 1;
    const limitNumber = limit ? parseInt(limit) : 10;
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid ObjectId');
    }
    const result = await this.businessService.getBusinessDocumentTypes(
      id,
      pageNumber,
      limitNumber,
    );
    if (result.success) {
      return {
        message: result.message,
        data: result.data,
        total: result.total,
      };
    } else {
      throw new BadRequestException(result.message);
    }
  }

  @Post('brand')
  async createBrand(@Body() data: CreateBrandDto) {
    const result = await this.businessService.createBrand(data);
    if (result.success) {
      return {
        message: result.message,
        data: result.data,
      };
    } else {
      throw new BadRequestException(result.message);
    }
  }

  @Post('toggleStatus/:id')
  @Privilege(ResourceTypes.USERS, Actions.UPDATE)
  @UseGuards(PrivilegeGuard)
  @UseGuards(JwtGuard2)
  async toggleStatus(
    @TokenDecoder() user: DecodedUser,
    @Param('id') id: string,
    @Body('isActive') isActive: boolean,
  ) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid ObjectId');
    }
    const result = await this.businessService.toggleStatus(
      user.id,
      id,
      isActive,
    );
    if (result.success) {
      return {
        message: result.message,
        data: result.data,
      };
    } else {
      throw new BadRequestException(result.message);
    }
  }

  @Post('downlineUser')
  @Privilege(ResourceTypes.USERS, Actions.CREATE)
  @UseGuards(PrivilegeGuard)
  @UseGuards(JwtGuard2)
  async createDownlineUser(
    @TokenDecoder() user: DecodedUser,
    @Body() data: CreateDownlineBusinessUserDto,
  ) {
    if (
      !user.businessProfile ||
      (user.businessProfile && !isValidObjectId(user.businessProfile))
    ) {
      throw new BadRequestException('BusinessId not Found.');
    }
    const result = await this.businessService.createDownlineUser(
      user.id,
      user.businessProfile,
      data,
    );
    if (result.success) {
      return {
        message: result.message,
        data: result.data,
      };
    } else {
      throw new BadRequestException(result.message);
    }
  }

  @Patch('downlineUser/:id')
  @Privilege(ResourceTypes.USERS, Actions.UPDATE)
  @UseGuards(PrivilegeGuard)
  @UseGuards(JwtGuard2)
  async updateDownlineUser(
    @TokenDecoder() user: DecodedUser,
    @Param('id') id: string,
    @Body() data: UpdateDownlineBusinessUserDto,
  ) {
    if (
      !user.businessProfile ||
      (user.businessProfile && !isValidObjectId(user.businessProfile))
    ) {
      throw new BadRequestException('BusinessId not Found.');
    }
    const result = await this.businessService.updateDownlineUser(id, data);
    if (result.success) {
      return {
        message: result.message,
        data: result.data,
      };
    } else {
      throw new BadRequestException(result.message);
    }
  }

  @Post('user/login/reset-password')
  @UseGuards(ResetPasswordGuard)
  async forceResetPassword(
    @Req() req: Request,
    @Body() body: { password: string },
    @TokenDecoder() user: DecodedUser,
  ) {
    if (!body.password) {
      throw new BadRequestException('Please provide password.');
    }
    if (typeof body.password !== 'string') {
      throw new BadRequestException('Please provide valid password.');
    }
    const result = await this.businessService.forceResetPassword(
      user.id,
      body.password,
      req['tokenId'],
    );
    if (result.success) {
      return {
        message: result.message,
        token: result.token,
      };
    } else {
      throw new BadRequestException(result.message);
    }
  }

  @Delete('deleteUser/:id')
  @UseGuards(JwtGuard2)
  async deleteUser(@TokenDecoder() user: DecodedUser, @Param('id') id: string) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid ObjectId');
    }
    const result = await this.businessService.deleteUser(user.id, id);
    if (result.success) {
      return {
        message: result.message,
      };
    } else {
      throw new BadRequestException(result.message);
    }
  }

  @Get('list')
  @UseGuards(JwtGuard2)
  async fetchBusinessList(
    @Query('limit') limit: string,
    @Query('page') page: string,
    @TokenDecoder() user: DecodedUser,
  ) {
    const result = await this.businessService.fetchBusinessList(
      user.id,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
    );

    if (result.success) {
      return {
        message: result.message,
        data: result.data,
      };
    } else {
      throw new BadRequestException(result.message);
    }
  }

  @Get('dashboard')
  @UseGuards(JwtGuard2)
  async getDashboardData(
    @TokenDecoder() user: DecodedUser,
    @Query('limit') limit: string,
    @Query('progress') progress: string,
  ) {
    const pageLimit = limit ? parseInt(limit) : 20;
    const result = await this.businessService.getDashboardData(
      user,
      pageLimit,
      progress,
    );
    if (result.success) {
      return {
        message: result.message,
        data: result.data,
      };
    } else {
      throw new BadRequestException(result.message);
    }
  }

  @Get('teamSize')
  @UseGuards(RateLimitGuard)
  async fetchTeamSizeDropdown() {
    const result = await this.businessService.fetchTeamSizeDropdown();
    if (result.success) {
      return {
        message: result.message,
        data: result.data,
      };
    } else {
      throw new BadRequestException(result.message);
    }
  }

  @Get('organisation-roles-list')
  @UseGuards(RateLimitGuard)
  async fetchOrganisationRolesList(
    @Query('limit') limit: string,
    @Query('page') page: string,
  ) {
    const pageNumber = page ? parseInt(page) : 1;
    const limitNumber = limit ? parseInt(limit) : 10;
    const result = await this.businessService.fetchOrganisationRolesList(
      pageNumber,
      limitNumber,
    );
    if (result.success) {
      return {
        message: result.message,
        data: result.data,
        total: result.total,
        pages: result.pages,
        page: result.page,
        limit: result.limit,
      };
    } else {
      throw new BadRequestException(result.message);
    }
  }

  @Post('switch/:id')
  @UseGuards(JwtGuard2)
  async switchBusiness(
    @Param('id') id: string,
    @TokenDecoder() user: DecodedUser,
  ) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid ObjectId');
    }
    const result = await this.businessService.switchBusiness(
      user.id,
      user.token,
      id,
    );
    if (result.success) {
      return {
        message: result.message,
        token: result.token,
      };
    } else {
      throw new BadRequestException(result.message);
    }
  }

  @Post('department')
  @UseGuards(JwtGuard2)
  async createDepartment(
    @TokenDecoder() user: DecodedUser,
    @Body() data: CreateDepartmentDto,
  ) {
    const result = await this.businessService.createDepartment(user, data);
    if (result.success) {
      return {
        message: result.message,
        data: result.data,
      };
    } else {
      throw new BadRequestException(result.message);
    }
  }

  @Put('department/:id')
  @UseGuards(JwtGuard2)
  async updateDepartment(
    @TokenDecoder() user: DecodedUser,
    @Body() data: UpdateDepartmentDto,
    @Param('id') id: string,
  ) {
    const result = await this.businessService.updateDepartment(user, id, data);
    if (result.success) {
      return {
        message: result.message,
        data: result.data,
      };
    } else {
      throw new BadRequestException(result.message);
    }
  }

  @Get('departments')
  @UseGuards(JwtGuard2)
  async fetchDepartments(
    @TokenDecoder() user: DecodedUser,
    @Query('limit') limit: string,
    @Query('page') page: string,
  ) {
    const pageNumber = page ? parseInt(page) : 1;
    const limitNumber = limit ? parseInt(limit) : 10;
    const result = await this.businessService.fetchDepartment(
      user,
      pageNumber,
      limitNumber,
    );
    if (result.success) {
      return {
        message: result.message,
        data: result.data,
        total: result.total,
        pages: result.pages,
        page: result.page,
        limit: result.limit,
      };
    } else {
      throw new BadRequestException(result.message);
    }
  }

  @Get('department/:id')
  @UseGuards(JwtGuard2)
  async fetchDepartmentById(
    @TokenDecoder() user: DecodedUser,
    @Param('id') id: string,
  ) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid ObjectId');
    }
    const result = await this.businessService.fetchDepartmentById(user, id);
    if (result.success) {
      return {
        message: result.message,
        data: result.data,
      };
    } else {
      throw new BadRequestException(result.message);
    }
  }

  @Delete('department/:id')
  @UseGuards(JwtGuard2)
  async deleteDepartment(
    @TokenDecoder() user: DecodedUser,
    @Param('id') id: string,
  ) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid ObjectId');
    }

    const result = await this.businessService.deleteDepartment(user, id);
    if (result.success) {
      return {
        message: result.message,
      };
    } else {
      throw new BadRequestException(result.message);
    }
  }

  @Get('followers')
  @UseGuards(JwtGuard2)
  async fetchFollowers(
    @TokenDecoder() user: DecodedUser,
    @Query('limit') limit: string,
    @Query('page') page: string,
  ) {
    const pageNumber = page ? parseInt(page) : 1;
    const limitNumber = limit ? parseInt(limit) : 10;
    const result = await this.businessService.fetchFollowers(
      user,
      pageNumber,
      limitNumber,
    );
    if (result.success) {
      return {
        message: result.message,
        data: result.data,
        total: result.total,
        pages: result.pages,
        page: result.page,
        limit: result.limit,
      };
    } else {
      throw new BadRequestException(result.message);
    }
  }

  @Get('templates')
  @UseGuards(JwtGuard2)
  async getTemplates(
    @Query('page') page: string,
    @Query('limit') limit: string,
    @TokenDecoder() user: DecodedUser,
    @Query('type') type: string,
  ) {
    const pageNumber = page ? parseInt(page) : 1;
    const limitNumber = limit ? parseInt(limit) : 10;
    const result = await this.businessService.getTemplates(
      user,
      pageNumber,
      limitNumber,
      type,
    );
    if (result.success) {
      return {
        message: result.message,
        data: result.data,
        total: result.total,
        pages: result.pages,
        page: result.page,
        limit: result.limit,
      };
    } else {
      throw new BadRequestException(result.message);
    }
  }

  @Post('region')
  @UseGuards(JwtGuard2)
  async createRegion(
    @TokenDecoder() user: DecodedUser,
    @Body() data: CreateRegionDto,
  ) {
    const result = await this.businessService.createRegion(user, data);
    if (result.success) {
      return {
        message: result.message,
        data: result.data,
      };
    } else {
      throw new BadRequestException(result.message);
    }
  }

  @Put('region/:id')
  @UseGuards(JwtGuard2)
  async updateRegion(
    @TokenDecoder() user: DecodedUser,
    @Body() data: UpdateRegionDto,
    @Param('id') id: string,
  ) {
    const result = await this.businessService.updateRegion(user, id, data);
    if (result.success) {
      return {
        message: result.message,
        data: result.data,
      };
    } else {
      throw new BadRequestException(result.message);
    }
  }

  @Get('regions')
  @UseGuards(JwtGuard2)
  async fetchRegions(
    @TokenDecoder() user: DecodedUser,
    @Query('limit') limit: string,
    @Query('page') page: string,
  ) {
    const pageNumber = page ? parseInt(page) : 1;
    const limitNumber = limit ? parseInt(limit) : 10;
    const result = await this.businessService.fetchRegions(
      user,
      pageNumber,
      limitNumber,
    );
    if (result.success) {
      return {
        message: result.message,
        data: result.data,
        total: result.total,
        pages: result.pages,
        page: result.page,
        limit: result.limit,
      };
    } else {
      throw new BadRequestException(result.message);
    }
  }

  @Get('region/:id')
  @UseGuards(JwtGuard2)
  async fetchRegiontById(
    @TokenDecoder() user: DecodedUser,
    @Param('id') id: string,
  ) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid ObjectId');
    }
    const result = await this.businessService.fetchRegiontById(user, id);
    if (result.success) {
      return {
        message: result.message,
        data: result.data,
      };
    } else {
      throw new BadRequestException(result.message);
    }
  }

  @Delete('region/:id')
  @UseGuards(JwtGuard2)
  async deleteRegion(
    @TokenDecoder() user: DecodedUser,
    @Param('id') id: string,
  ) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid ObjectId');
    }

    const result = await this.businessService.deleteRegion(user, id);
    if (result.success) {
      return {
        message: result.message,
      };
    } else {
      throw new BadRequestException(result.message);
    }
  }

  @Post('location-group')
  @UseGuards(JwtGuard2)
  async createLocationGroup(
    @TokenDecoder() user: any, // Extracted token payload (contains userId, businessId, etc.)
    @Body() createLocationGroupDto: CreateLocationGroupDto,
  ) {
    const businessId = user.businessProfile; // Business context from token
    const userId = user.id; // ID of the user creating the group

    const result = await this.businessService.createLocationGroup(
      businessId,
      userId,
      createLocationGroupDto,
    );
    if (result.success) {
      return {
        message: result.message,
        data: result.data,
      };
    } else {
      throw new BadRequestException(result.message);
    }
  }

  /**
   * Update an existing LocationGroup by id
   * PUT /location-groups/:id
   */
  @Put('location-group/:id')
  @UseGuards(JwtGuard2)
  async update(
    @TokenDecoder() user: any,
    @Param('id') id: string,
    @Body() updateLocationGroupDto: UpdateLocationGroupDto,
  ) {
    const businessId = user.businessProfile;
    const userId = user.id;
    const result = await this.businessService.updateLocationGroup(
      businessId,
      userId,
      id,
      updateLocationGroupDto,
    );
    if (result.success) {
      return {
        message: result.message,
        data: result.data,
      };
    } else {
      throw new BadRequestException(result.message);
    }
  }

  /**
   * Get a paginated list of LocationGroups for the current business
   * GET /location-groups?page=1&limit=10
   */
  @Get('location-groups')
  @UseGuards(JwtGuard2)
  async findAllLocationGroups(
    @TokenDecoder() user: any,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    const businessId = user.businessProfile;
    const result = await this.businessService.findAllLocationGroups(
      businessId,
      page,
      limit,
    );
    if (result.success) {
      return {
        message: result.message,
        data: result.data,
        total: result.total,
        pages: result.pages,
        page: result.page,
        limit: result.limit,
      };
    } else {
      throw new BadRequestException(result.message);
    }
  }

  /**
   * Get a single LocationGroup by id
   * GET /location-groups/:id
   */

  @Get('location-group/:id')
  @UseGuards(JwtGuard2)
  async findOneLocationGroup(
    @TokenDecoder() user: any,
    @Param('id') id: string,
  ) {
    const businessId = user.businessProfile;
    const result = await this.businessService.findOneLocationGroup(
      businessId,
      id,
    );
    if (result.success) {
      return {
        message: result.message,
        data: result.data,
      };
    } else {
      throw new BadRequestException(result.message);
    }
  }

  /**
   * Delete a LocationGroup by id
   * DELETE /location-groups/:id
   */
  @Delete('location-group/:id')
  @UseGuards(JwtGuard2)
  async removeLocationGroup(
    @TokenDecoder() user: any,
    @Param('id') id: string,
  ) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid ObjectId');
    }
    const businessId = user.businessProfile;
    const result = await this.businessService.removeLocationGroup(
      businessId,
      id,
    );
    if (result.success) {
      return {
        message: result.message,
      };
    } else {
      throw new BadRequestException(result.message);
    }
  }
  @Get('followers')
  @UseGuards(JwtGuard2)
  async getFollowers(
    @TokenDecoder() user: DecodedUser,
    @Query('limit') limit: string,
    @Query('page') page: string,
  ) {
    const result = await this.businessService.getFollowers(
      user.businessProfile,
      parseInt(page),
      parseInt(limit),
    );
    if (result.success) {
      return {
        message: result.message,
        data: result.data,
        total: result.total,
        pages: result.pages,
        page: result.page,
        limit: result.limit,
      };
    } else {
      throw new BadRequestException(result.message);
    }
  }

  @Post('rate/:businessId')
  @UseGuards(JwtGuard2)
  async createReview(
    @TokenDecoder() user: DecodedUser,
    @Param('businessId') businessId: string,
    @Body('rating') rating: number,
    @Body('comment') comment: string,
  ) {
    const result = await this.businessService.createRating(
      user.id,
      businessId,
      { rating, comment },
    );
    if (result.success) {
      return {
        message: result.message,
        data: result.data,
      };
    } else {
      throw new BadRequestException(result.message);
    }
  }

  @Post('uploadDownlineUsersInBulk')
  @UseGuards(JwtGuard2)
  @UseInterceptors(
    FileInterceptor('file', {
      //   dest: './uploads',
      //   fileFilter: imageFileFilter,
      //   storage: diskStorage({
      //     destination: './uploads',
      //     filename: editFileName,
      //   }),
      //   //Setting file size limit to 1 MB
      limits: { fileSize: 1000000 },
    }),
  )
  async uploadDownlineUsersInBulk(
    @UploadedFile() file: Express.Multer.File,
    @TokenDecoder() user: DecodedUser,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const result = await this.businessService.createDownlineUsersInBulk(
      file,
      user,
    );
    if (result.success) {
      return {
        message: result.message,
        data: result.data,
      };
    } else {
      throw new BadRequestException(result.message);
    }
  }

  @Get(':id')
  @UseGuards(JwtGuard2)
  async fetchBusiness(
    @Param('id') businessId: string,
    @Query('latitude') latitude: string,
    @Query('longitude') longitude: string,
    @TokenDecoder() user: DecodedUser,
  ) {
    const result = await this.businessService.fetchBusiness(
      businessId,
      user.id,
      parseFloat(latitude),
      parseFloat(longitude),
    );

    if (result.success) {
      return {
        message: result.message,
        data: result.data,
      };
    } else {
      throw new BadRequestException(result.message);
    }
  }

  @Post('uploadMenu')
  @UseGuards(JwtGuard2)
  @UseInterceptors(
    FilesInterceptor('images', 5, {
      limits: { fileSize: 50 * 1024 * 1024 }, // ✅ Set file size limit to 50MB
    }),
  )
  async uploadMenu(
    @UploadedFiles() images: Express.Multer.File[],
    @TokenDecoder() user: DecodedUser,
    @Body('name') name: string,
    @Body('description') description: string,
  ) {
    const result = await this.businessService.uploadMenu(
      images,
      user,
      name,
      description,
    );
    if (result.success) {
      return {
        message: result.message,
        data: result.data,
      };
    } else {
      throw new BadRequestException(result.message);
    }
  }
}
