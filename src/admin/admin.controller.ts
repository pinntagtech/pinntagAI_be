import { Request, Response } from 'express';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Req,
  Res,
  UnauthorizedException,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import mongoose from 'mongoose';
import { UpdateCrawledEventDto } from 'src/event/dto/update-crawled-event.dto';
import { PublishCrawledEventDto } from 'src/event/dto/publish-crawled-event.dto';
import { ConfigureDashboardDto } from 'src/auth/dto/configureDashboard.dto';
import { PlatformConfigDto } from 'src/auth/dto/platformConfig.dto';
import { UpdateConfigureDashboardDto } from 'src/auth/dto/updateDashConfig.dto';
import { LoginDto } from 'src/auth/dto/login.dto';
// import { Permission, ResourceEnums } from './models/permission.model';
import { CreateCategoryDto } from './dto/create-category.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { TokenDecoder } from 'src/decorators/tokenDecoder.decorator';
import { DecodedUser } from 'src/auth/interfaces/decodedUser.interface';
import { UserGuard } from 'src/auth/guards/user.guard';
import { Privilege } from 'src/roles/privilege.decorator';
import { Actions, ResourceTypes } from 'src/roles/enums/roles.enum';
import { PrivilegeGuard } from 'src/roles/guards/privilege.guards';
import { CreateAdminDto } from './dto/create-admin.dto';
import { AssignRoleDto } from './dto/assign-role.dto';
import { AdminGuard2 } from 'src/auth/guards2/admin2.guard';
import { ResetPasswordGuard } from 'src/auth/guards2/resetPassword.guard';
import {
  CreateIndustryDto,
  UpdateIndustryDto,
} from './dto/business-industry.dto';
import { database } from 'firebase-admin';
import { BusinessCategory } from 'src/business/model/businessCategory.model';
import {
  BusinessCategoryDto,
  UpdateBusinessCategoryDto,
} from './dto/business-category.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { AdminGuard } from 'src/auth/guards/admin.guard';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { AddBusinessDto } from './dto/add-business.dto';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { RateLimit } from 'nestjs-rate-limiter';
import { RateLimitGuard } from 'src/auth/guards/rateLimiter.guard';
import { CreateOutletByAdminDto } from 'src/outlet/dto/create-outlet.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('list')
  @UseGuards(AdminGuard2)
  async getUsers(@Query('page') page: string, @Query('limit') limit: string) {
    const pageNumber = page ? parseInt(page) : 1;
    const limitNumber = limit ? parseInt(limit) : 10;
    const result = await this.adminService.getUsers(pageNumber, limitNumber);

    if (result.success) {
      return {
        message: result.message,
        data: result.data,
        total: result.total,
      };
    } else {
      return {
        message: result.message,
      };
    }
  }

  @Get('crawled')
  @UseGuards(AdminGuard2)
  async getCrawledEvents(
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('status') status: string,
  ) {
    if (!page || page == '') {
      page = '1';
    }
    if (!limit || limit == '') {
      limit = '10';
    }
    if (!status || status == '') {
      status = 'all';
    }
    const result = await this.adminService.getCrawledEvents(
      parseInt(page),
      parseInt(limit),
      status,
    );
    if (result.success) {
      return {
        message: result.message,
        count: result.count,
        events: result.crawledEvents,
        pages: result.pages,
        page: result.page,
      };
    } else {
      return {
        message: result.message,
      };
    }
  }

  @Delete('crawled/:id')
  @UseGuards(AdminGuard2)
  async removeCrawledEvent(@Param('id') id: string) {
    if (!mongoose.isValidObjectId(id)) {
      return new BadRequestException({
        message: 'Invalid event id',
      });
    }
    const result = await this.adminService.deleteCrawledEvent(id);
    if (result.success) {
      return {
        message: result.message,
      };
    } else {
      return {
        message: result.message,
      };
    }
  }

  @Post('crawled/edit/:id')
  @UseGuards(AdminGuard2)
  async updateCrawledEvent(
    @Param('id') id: string,
    @Body() body: UpdateCrawledEventDto,
  ) {
    if (!mongoose.isValidObjectId(id)) {
      throw new BadRequestException({
        message: 'Please provide a valid id',
      });
    }
    const result = await this.adminService.updateCrawledEvent(id, body);
    if (result.success) {
      return {
        message: result.message,
        event: result.event,
      };
    } else {
      return new BadRequestException({
        message: result.message,
      });
    }
  }

  @Post('crawled/publish')
  @UseGuards(AdminGuard2)
  async publishCrawledEvent(@Body() body: PublishCrawledEventDto) {
    // if (!mongoose.isValidObjectId(body.id)) {
    //   return res.status(HttpStatus.BAD_REQUEST).json({
    //     message: 'Please provide a valid id',
    //   });
    // }
    body.ids.forEach((id) => {
      if (!mongoose.isValidObjectId(id)) {
        throw new BadRequestException({
          message: `Please provide a valid id for ${id}`,
        });
      }
    });
    if (!mongoose.isValidObjectId(body.businessProfile)) {
      throw new BadRequestException({
        message: 'Please provide a valid business id',
      });
    }
    if (!mongoose.isValidObjectId(body.user)) {
      throw new BadRequestException({
        message: 'Please provide a valid user id',
      });
    }
    const result = await this.adminService.publishCrawledEvent(body);
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

  @Post('dashboard/config/add')
  @UseGuards(AdminGuard2)
  async configureDashboard(@Body() body: ConfigureDashboardDto) {
    if (body.categories && body.categories.length) {
      body.categories.forEach((cat) => {
        if (!mongoose.Types.ObjectId.isValid(cat)) {
          return new BadRequestException({
            message: `${cat} is not a valid category id.`,
          });
        }
      });
    }
    const result = await this.adminService.addDashboardConfiguration(body);
    if (result.success) {
      return {
        message: result.message,
        data: result.data,
      };
    } else {
      throw new BadRequestException({
        message: result.message,
      });
    }
  }

  @Get('dashboard/config')
  @UseGuards(AdminGuard2)
  async getDashboardConfig() {
    const result = await this.adminService.getDashboardConfig();
    if (result.success) {
      return {
        message: result.message,
        data: result.data,
      };
    } else {
      throw new BadRequestException({
        message: result.message,
      });
    }
  }

  @Post('dashboard/config/update/:id')
  @UseGuards(AdminGuard2)
  async editDashboardConfig(
    @Body() body: UpdateConfigureDashboardDto,
    @Param('id') id: string,
  ) {
    if (!mongoose.isValidObjectId(id)) {
      throw new BadRequestException({
        message: 'Invalid id',
      });
    }
    if (body.categories && body.categories.length) {
      body.categories.forEach((cat) => {
        if (!mongoose.Types.ObjectId.isValid(cat)) {
          throw new BadRequestException({
            message: `${cat} is not a valid category id.`,
          });
        }
      });
    }
    const result = await this.adminService.updateDashboardConfiguration(
      id,
      body,
    );
    if (result.success) {
      return {
        message: result.message,
        data: result.data,
      };
    } else {
      throw new BadRequestException({
        message: result.message,
      });
    }
  }

  @Delete('dashboard/config/delete/:id')
  @UseGuards(AdminGuard2)
  async deleteDashboardConfig(@Param('id') id: string) {
    if (!mongoose.isValidObjectId(id)) {
      throw new BadRequestException({
        message: 'Invalid id',
      });
    }
    const result = await this.adminService.deleteDashboardConfiguration(id);
    if (result.success) {
      return {
        message: result.message,
      };
    } else {
      throw new BadRequestException({
        message: result.message,
      });
    }
  }

  @Get('dashboard/weight')
  @UseGuards(AdminGuard2)
  async getDashboardWeight() {
    const result = await this.adminService.getDashboardWeight();
    if (result.success) {
      return {
        message: result.message,
        data: result.data,
      };
    } else {
      throw new BadRequestException({
        message: result.message,
      });
    }
  }

  @Post('dashboard/weight/update')
  @UseGuards(AdminGuard2)
  async updateDashboardWeight(@Body() body: PlatformConfigDto) {
    if (!body.distanceWeightage && !body.timeWeightage) {
      return new BadRequestException({
        message: 'Please provide data to update',
      });
    }
    // body.distanceWeightage and body.timeWeightage both should be in the range of 0.1 to 1.0 and their sum should be 1.0
    if (body.distanceWeightage < 0.1 || body.distanceWeightage > 1.0) {
      return new BadRequestException({
        message: 'Distance weightage should be between 0.1 to 1.0',
      });
    }
    if (body.timeWeightage < 0.1 || body.timeWeightage > 1.0) {
      return new BadRequestException({
        message: 'Time weightage should be between 0.1 to 1.0',
      });
    }
    if (body.distanceWeightage + body.timeWeightage !== 1.0) {
      return new BadRequestException({
        message: 'Sum of distance and time weightage should be 1.0',
      });
    }
    const result = await this.adminService.editDashboardWeight(body);
    if (result.success) {
      return {
        message: result.message,
        data: result.data,
      };
    } else {
      throw new BadRequestException({
        message: result.message,
      });
    }
  }

  @Post('login')
  async adminLogin(@Body() loginDto: LoginDto) {
    const result = await this.adminService.adminLogin(loginDto);
    if (result.success) {
      if (result.status) {
        return {
          message: result.message,
          status: result.status,
          user: result.user,
          token: result.token,
        };
      } else {
        return new UnauthorizedException({
          message: result.message,
          status: result.status,
          user: result.user,
          token: result.token,
        });
      }
    } else {
      throw new BadRequestException({
        message: result.message,
      });
    }
  }

  @Post('login/reset-password')
  @UseGuards(ResetPasswordGuard)
  async forceResetPassword(
    @Req() req: Request,
    @Body() body: { password: string },
    @TokenDecoder() user: DecodedUser,
  ) {
    if (!body.password) {
      return new BadRequestException({
        message: 'Please provide password.',
      });
    }
    if (typeof body.password !== 'string') {
      throw new BadRequestException({
        message: 'Please provide valid password.',
      });
    }
    const result = await this.adminService.forceResetPassword(
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
      throw new BadRequestException({
        message: result.message,
      });
    }
  }

  @Get('profile')
  @UseGuards(AdminGuard2)
  async getProfile(@TokenDecoder() user: DecodedUser) {
    const result = await this.adminService.getProfile(user.id);
    if (result.success) {
      return {
        message: result.message,
        data: result.data,
      };
    } else {
      throw new BadRequestException({
        message: result.message,
      });
    }
  }

  @Post('forgot-password')
  async forgotPassword(@Req() req: Request, @Body() body: ForgotPasswordDto) {
    const origin = req.headers.origin;
    const result = await this.adminService.forgotPassword(origin, body.email);
    if (result.success) {
      return {
        message: result.message,
      };
    } else {
      throw new BadRequestException({
        message: result.message,
      });
    }
  }

  // @Post('create-permission')
  // async createPermission(
  //   @Body() createDto: Partial<Permission>,
  // ): Promise<Permission> {
  //   return this.adminService.create(createDto);
  // }

  // @Post('create-role')
  // async createAdminRole(
  //   @Body() createDto: Partial<AdminRole>,
  // ): Promise<AdminRole> {
  //   return this.adminService.createRole(createDto);
  // }

  // @Post('create-business-role')
  // async createBusinessRole(
  //   @Body() createDto: Partial<BusinessRole>,
  // ): Promise<BusinessRole> {
  //   return this.adminService.createBusinessRole(createDto);
  // }

  @Post('dbQueries') //just to add run db queries or only for testing purpose
  @UseGuards(AdminGuard2)
  async dbQueries() {
    const result = await this.adminService.dbQueries();
    if (result.success) {
      return {
        message: result.message,
        data: result.data,
      };
    }
    throw new BadRequestException({
      message: result.message,
    });
  }

  @Post('content/category')
  @UseGuards(AdminGuard2)
  async createCategory(
    @Req() req: Request,
    @Body() createCategoryDto: CreateCategoryDto,
    @TokenDecoder() user: DecodedUser,
  ) {
    const result = await this.adminService.createCategory(
      user.id,
      createCategoryDto,
    );
    if (result.success) {
      return {
        message: result.message,
        data: result.data,
      };
    }
    throw new BadRequestException({
      message: result.message,
    });
  }

  @Get('content/categories')
  // @UseGuards(AdminGuard2)
  @UseGuards(RateLimitGuard)
  async getCategories(
    @Query('page') page: string,
    @Query('limit') limit: string,
  ) {
    let pageNumber = page ? parseInt(page) : 1;
    let limitNumber = limit ? parseInt(limit) : 10;
    const result = await this.adminService.getCategories(
      pageNumber,
      limitNumber,
    );
    return result;
  }

  @Put('content/updateCategory/:id')
  @UseGuards(AdminGuard2)
  async updateCategory(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    const result = await this.adminService.updateCategory(
      id,
      updateCategoryDto,
    );
    if (result.success) {
      return {
        message: result.message,
        data: result.data,
      };
    }
  }
  @Delete('content/deleteCategory/:id')
  @UseGuards(AdminGuard2)
  async deleteContentCategory(@Req() req: Request, @Param('id') id: string) {
    const result = await this.adminService.deleteContentCategory(id);
    if (result.success) {
      return {
        message: result.message,
      };
    }
  }

  @Get('users')
  @Privilege(ResourceTypes.ADMIN, Actions.READ)
  @UseGuards(PrivilegeGuard)
  @UseGuards(AdminGuard2)
  async getUsersList(
    @TokenDecoder() user: DecodedUser,
    @Query('page') page: string,
    @Query('limit') limit: string,
  ) {
    const pageNumber = page ? parseInt(page) : 1;
    const limitNumber = limit ? parseInt(limit) : 10;
    const result = await this.adminService.getAdminsList(
      user.id,
      pageNumber,
      limitNumber,
    );
    if (result.success) {
      return {
        message: result.message,
        data: result.data,
        page: result.page,
        limit: result.limit,
        total: result.total,
        pages: result.pages,
      };
    } else {
      return new BadRequestException({
        message: result.message,
      });
    }
  }

  @Post('user')
  @Privilege(ResourceTypes.ADMIN, Actions.CREATE)
  @UseGuards(PrivilegeGuard)
  @UseGuards(AdminGuard2)
  async createAdmin(
    @Body() data: CreateAdminDto,
    @TokenDecoder() user: DecodedUser,
  ) {
    if (data.role) {
      if (!mongoose.isValidObjectId(data.role)) {
        return {
          success: false,
          message: 'Please provide a valid role id',
        };
      }
      console.log('inside create admin');
      const result = await this.adminService.createAdmin(user.id, data);
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
  }

  @Get('user/:id')
  @Privilege(ResourceTypes.ADMIN, Actions.READ)
  @UseGuards(PrivilegeGuard)
  @UseGuards(AdminGuard2)
  async getUser(@Param('id') id: string, @TokenDecoder() user: DecodedUser) {
    if (!mongoose.isValidObjectId(id)) {
      throw new BadRequestException({
        message: 'Invalid ObjectId',
      });
    }
    const result = await this.adminService.getAdminById(user.id, id);
    if (result.success) {
      return {
        message: result.message,
        data: result.data,
      };
    } else {
      throw new BadRequestException({
        message: result.message,
      });
    }
  }

  @Post('assign/role')
  @Privilege(ResourceTypes.ADMIN, Actions.UPDATE)
  @UseGuards(PrivilegeGuard)
  @UseGuards(AdminGuard2)
  async assignRole(
    @Body() data: AssignRoleDto,
    @TokenDecoder() user: DecodedUser,
  ) {
    if (data.roleId) {
      if (!mongoose.isValidObjectId(data.roleId)) {
        return {
          success: false,
          message: 'Please provide a valid role id',
        };
      }
      const result = await this.adminService.assignRoleToAdmin(data);
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
  }

  @Put('user/update/:id')
  @Privilege(ResourceTypes.ADMIN, Actions.UPDATE)
  @UseGuards(PrivilegeGuard)
  @UseGuards(AdminGuard2)
  async updateAdmin(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() data: UpdateAdminDto,
    @TokenDecoder() user: DecodedUser,
  ) {
    if (!mongoose.isValidObjectId(id)) {
      throw new BadRequestException({
        message: 'Invalid ObjectId',
      });
    }
    const result = await this.adminService.updateAdmin(user.id, id, data);
    if (result.success) {
      return {
        message: result.message,
        data: result.data,
      };
    } else {
      throw new BadRequestException({
        message: result.message,
      });
    }
  }

  @Get('consumers')
  @Privilege(ResourceTypes.USERS, Actions.READ)
  @UseGuards(PrivilegeGuard)
  @UseGuards(AdminGuard2)
  async getConsumers(
    @TokenDecoder() user: DecodedUser,
    @Query('page') page: string,
    @Query('limit') limit: string,
  ) {
    const pageNumber = page ? parseInt(page) : 1;
    const limitNumber = limit ? parseInt(limit) : 10;
    const result = await this.adminService.getConsumersList(
      pageNumber,
      limitNumber,
    );
    if (result.success) {
      return {
        message: result.message,
        data: result.data,
        page: result.page,
        limit: result.limit,
        total: result.total,
        pages: result.pages,
      };
    } else {
      throw new BadRequestException({
        message: result.message,
      });
    }
  }

  @Get('consumer/:id')
  @Privilege(ResourceTypes.USERS, Actions.READ)
  @UseGuards(PrivilegeGuard)
  @UseGuards(AdminGuard2)
  async getConsumer(
    @Param('id') id: string,
    @TokenDecoder() user: DecodedUser,
  ) {
    if (!mongoose.isValidObjectId(id)) {
      throw new BadRequestException({
        message: 'Invalid id provided',
      });
    }
    const result = await this.adminService.getConsumerById(id);
    if (result.success) {
      return {
        message: result.message,
        data: result.data,
      };
    } else {
      throw new BadRequestException({
        message: result.message,
      });
    }
  }

  @Get('business')
  @Privilege(ResourceTypes.BUSINESS, Actions.READ)
  @UseGuards(PrivilegeGuard)
  @UseGuards(AdminGuard2)
  async getBusinesses(
    @TokenDecoder() user: DecodedUser,
    @Query('page') page: string,
    @Query('limit') limit: string,
  ) {
    const pageNumber = page ? parseInt(page) : 1;
    const limitNumber = limit ? parseInt(limit) : 10;
    const result = await this.adminService.getBusinessesList(
      pageNumber,
      limitNumber,
    );
    if (result.success) {
      return {
        message: result.message,
        data: result.data,
        page: result.page,
        limit: result.limit,
        total: result.total,
        pages: result.pages,
      };
    } else {
      throw new BadRequestException({
        message: result.message,
      });
    }
  }

  @Get('business/:id')
  @Privilege(ResourceTypes.BUSINESS, Actions.READ)
  @UseGuards(PrivilegeGuard)
  @UseGuards(AdminGuard2)
  async getBusiness(
    @Param('id') id: string,
    @TokenDecoder() user: DecodedUser,
  ) {
    if (!mongoose.isValidObjectId(id)) {
      throw new BadRequestException({
        message: 'Invalid id provided',
      });
    }
    const result = await this.adminService.getBusinessById(id);
    if (result.success) {
      return {
        message: result.message,
        data: result.data,
      };
    } else {
      throw new BadRequestException({
        message: result.message,
      });
    }
  }

  @Post('create/industry')
  @UseGuards(AdminGuard2)
  async createIndustry(
    @Body() data: CreateIndustryDto,
    @TokenDecoder() user: DecodedUser,
  ) {
    const result = await this.adminService.createBusinessIndustry(
      user.id,
      data,
    );
    if (result.success) {
      return {
        message: result.message,
        data: result.data,
      };
    } else {
      throw new BadRequestException({
        message: result.message,
      });
    }
  }

  @Put('update/industry/:industryId')
  @UseGuards(AdminGuard2)
  async updateIndustry(
    @Param('industryId') industryId: string,
    @Body() data: UpdateIndustryDto,
    @TokenDecoder() user: DecodedUser,
  ) {
    const result = await this.adminService.updateBusinessIndustry(
      industryId,
      user.id,
      data,
    );
    if (result.success) {
      return {
        message: result.message,
        data: result.data,
      };
    } else {
      throw new BadRequestException({
        message: result.message,
      });
    }
  }

  @Delete('delete/industry/:id')
  @UseGuards(AdminGuard2)
  async deleteIndustry(
    @Param('id') id: string,
    @TokenDecoder() user: DecodedUser,
  ) {
    if (!mongoose.isValidObjectId(id)) {
      throw new BadRequestException({
        message: 'Invalid id provided',
      });
    }
    const result = await this.adminService.deleteBusinessIndustry(id);
    if (result.success) {
      return {
        message: result.message,
      };
    } else {
      throw new BadRequestException({
        message: result.message,
      });
    }
  }
  @Post('create/business/category')
  @UseGuards(AdminGuard2)
  async createBusinessCategory(
    @Body() data: BusinessCategoryDto,
    @TokenDecoder() user: DecodedUser,
  ) {
    const result = await this.adminService.createBusinessCategory(
      user.id,
      data,
    );
    if (result.success) {
      return {
        message: result.message,
        data: result.data,
      };
    } else {
      throw new BadRequestException({
        message: result.message,
      });
    }
  }

  @Put('update/business/category/:categoryId')
  @UseGuards(AdminGuard2)
  async updateBusinessCategory(
    @Param('categoryId') categoryId: string,
    @Body() data: UpdateBusinessCategoryDto,
    @TokenDecoder() user: DecodedUser,
  ) {
    const result = await this.adminService.updateBusinessCategory(
      categoryId,
      user.id,
      data,
    );
    if (result.success) {
      return {
        message: result.message,
        data: result.data,
      };
    } else {
      throw new BadRequestException({
        message: result.message,
      });
    }
  }
  @Delete('delete/business/category/:id')
  @UseGuards(AdminGuard2)
  async deleteBusinessCategory(
    @Param('id') id: string,
    @TokenDecoder() user: DecodedUser,
  ) {
    if (!mongoose.isValidObjectId(id)) {
      throw new BadRequestException({
        message: 'Invalid id provided',
      });
    }
    const result = await this.adminService.deleteBusinessCategory(id);
    if (result.success) {
      return {
        message: result.message,
      };
    } else {
      throw new BadRequestException({
        message: result.message,
      });
    }
  }

  @Get('industries')
  async getBusinessIndustry(
    @Query('page') page: string,
    @Query('limit') limit: string,
  ) {
    const pageNumber = page ? parseInt(page) : 1;
    const limitNumber = limit ? parseInt(limit) : 10;
    console.log('pageNumber', pageNumber);
    console.log('limitNumber', limitNumber);
    const result = await this.adminService.getBusinessIndustry(
      pageNumber,
      limitNumber,
    );
    if (result.success) {
      return {
        message: result.message,
        data: result.data,
        // limit: result.limit,
        total: result.total,
        // pages: result.pages,
      };
    } else {
      throw new BadRequestException({
        message: result.message,
      });
    }
  }

  // @Get('testing')
  // async getBusinessIndustry(
  //   ,
  //   @Query('page') page: string,
  //   @Query('limit') limit: string,
  // ) {
  //   const pageNumber = page ? parseInt(page) : 1;
  //   const limitNumber = limit ? parseInt(limit) : 10;
  //   console.log('pageNumber', pageNumber);
  //   console.log('limitNumber', limitNumber);
  //   const result = await this.adminService.getBusinessIndustry(
  //     pageNumber,
  //     limitNumber,
  //   );
  //   if (result.success) {
  //     return res.status(HttpStatus.OK).json({
  //       message: result.message,
  //       data: result.data,
  //       total: result.total,
  //     });
  //   } else {
  //     return res.status(HttpStatus.BAD_REQUEST).json({
  //       message: result.message,
  //     });
  //   }

  //   // console.log('testing here');
  //   // return res.status(HttpStatus.OK).json({
  //   //   message: 'testing',
  //   // });
  // }

  @Post('create/template')
  @UseGuards(AdminGuard2)
  async createTemplate(
    @Body() data: CreateTemplateDto,
    @TokenDecoder() user: DecodedUser,
  ) {
    const result = await this.adminService.createTemplate(user.id, data);
    if (result.success) {
      return {
        message: result.message,
        data: result.data,
      };
    } else {
      throw new BadRequestException({
        message: result.message,
      });
    }
  }

  @Post('update/template/:id')
  @UseGuards(AdminGuard2)
  async updateTemplate(
    @Param('id') id: string,
    @Body() data: UpdateTemplateDto,
    @TokenDecoder() user: DecodedUser,
  ) {
    const result = await this.adminService.updateTemplate(user.id, id, data);
    if (result.success) {
      return {
        message: result.message,
        data: result.data,
      };
    } else {
      throw new BadRequestException({
        message: result.message,
      });
    }
  }

  @Get('templates')
  @UseGuards(AdminGuard2)
  async getTemplates(
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('businessIndustry') businessIndustry: string,
    @Query('type') type: string,
  ) {
    const pageNumber = page ? parseInt(page) : 1;
    const limitNumber = limit ? parseInt(limit) : 10;
    const result = await this.adminService.getTemplates(
      pageNumber,
      limitNumber,
      businessIndustry,
      type,
    );
    if (result.success) {
      return {
        message: result.message,
        data: result.data,
        total: result.total,
      };
    } else {
      throw new BadRequestException({
        message: result.message,
      });
    }
  }

  @Get('template/:id')
  @UseGuards(AdminGuard2)
  async getTemplate(
    @Param('id') id: string,
    @TokenDecoder() user: DecodedUser,
  ) {
    const result = await this.adminService.getTemplate(id);
    if (result.success) {
      return {
        message: result.message,
        event: result.data,
      };
    } else {
      throw new BadRequestException({
        message: result.message,
      });
    }
  }

  @Delete('template/:id')
  @UseGuards(AdminGuard2)
  async removeTemplate(
    @Param('id') id: string,
    @TokenDecoder() user: DecodedUser,
  ) {
    const result = await this.adminService.deleteTemplate(id);
    if (result.success) {
      return {
        message: result.message,
      };
    } else {
      return new BadRequestException({
        message: result.message,
      });
    }
  }

  @Post('business')
  @Privilege(ResourceTypes.BUSINESS, Actions.CREATE)
  @UseGuards(PrivilegeGuard)
  @UseGuards(AdminGuard2)
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'logo', maxCount: 1 },
      { name: 'cover', maxCount: 1 },
    ]),
  )
  async createBusiness(
    @Body() data: AddBusinessDto,
    @TokenDecoder() user: DecodedUser,
    @UploadedFiles()
    files: { logo?: Express.Multer.File; cover?: Express.Multer.File },
  ) {
    if (!files.cover) {
      throw new BadRequestException({
        message: 'Please provide cover image',
      });
    }
    console.log('inside controller?');
    const result = await this.adminService.addBusiness(
      user,
      data,
      files.logo,
      files.cover,
    );
    if (result.success) {
      return {
        message: result.message,
        data: result.data,
      };
    } else {
      throw new BadRequestException({
        message: result.message,
      });
    }
  }
  @Get('business/followers/:id')
  @UseGuards(AdminGuard2)
  async getBusinessFollowers(
    @Param('id') id: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
  ) {
    const pageNumber = page ? parseInt(page) : 1;
    const limitNumber = limit ? parseInt(limit) : 10;
    const result = await this.adminService.getBusinessFollowers(
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
      throw new BadRequestException({
        message: result.message,
      });
    }
  }

  @Get('businessUsers/:businessId')
  @UseGuards(AdminGuard2)
  async businessUsers(
    @Param('businessId') businessId: string,
    // @TokenDecoder() user: DecodedUser,
  ) {
    if (!mongoose.isValidObjectId(businessId)) {
      throw new BadRequestException({
        message: 'Invalid business id',
      });
    }
    const result = await this.adminService.fetchBusinessUsers(businessId);
    if (result.success) {
      return {
        message: result.message,
        data: result.data,
      };
    } else {
      throw new BadRequestException({
        message: result.message,
      });
    }
  }
  @Post('createLocation/:businessId')
  @UseGuards(AdminGuard2)
  async createOutletForBusiness(
    @Param('businessId') businessId: string,
    @Body() createOutletDto: CreateOutletByAdminDto,
  ) {
    const result = await this.adminService.createOutletForBusiness(
      businessId,
      createOutletDto,
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
