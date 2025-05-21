import { Request, Response } from 'express';
import {
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
import { CreateIndustryDto } from './dto/business-industry.dto';
import { database } from 'firebase-admin';
import { BusinessCategory } from 'src/business/model/businessCategory.model';
import { BusinessCategoryDto } from './dto/business-category.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { AdminGuard } from 'src/auth/guards/admin.guard';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { AddBusinessDto } from './dto/add-business.dto';
import { FileFieldsInterceptor } from '@nestjs/platform-express';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('list')
  @UseGuards(AdminGuard2)
  async getUsers(
    @Res() res: Response,
    @Query('page') page: string,
    @Query('limit') limit: string,
  ) {
    const pageNumber = page ? parseInt(page) : 1;
    const limitNumber = limit ? parseInt(limit) : 10;
    const result = await this.adminService.getUsers(pageNumber, limitNumber);

    if (result.success) {
      return res.status(HttpStatus.BAD_REQUEST).json({
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

  @Get('crawled')
  @UseGuards(AdminGuard2)
  async getCrawledEvents(
    @Res() res: Response,
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
      return res.status(HttpStatus.OK).json({
        message: result.message,
        count: result.count,
        events: result.crawledEvents,
        pages: result.pages,
        page: result.page,
      });
    } else {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: result.message,
      });
    }
  }

  @Delete('crawled/:id')
  @UseGuards(AdminGuard2)
  async removeCrawledEvent(@Res() res: Response, @Param('id') id: string) {
    if (!mongoose.isValidObjectId(id)) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: 'Invalid event id',
      });
    }
    const result = await this.adminService.deleteCrawledEvent(id);
    return res
      .status(result.success ? HttpStatus.OK : HttpStatus.BAD_REQUEST)
      .json({
        message: result.message,
      });
  }

  @Post('crawled/edit/:id')
  @UseGuards(AdminGuard2)
  async updateCrawledEvent(
    @Res() res: Response,
    @Param('id') id: string,
    @Body() body: UpdateCrawledEventDto,
  ) {
    if (!mongoose.isValidObjectId(id)) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: 'Please provide a valid id',
      });
    }
    const result = await this.adminService.updateCrawledEvent(id, body);
    if (result.success) {
      return res.status(HttpStatus.OK).json({
        message: result.message,
        event: result.event,
      });
    } else {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: result.message,
      });
    }
  }

  @Post('crawled/publish')
  @UseGuards(AdminGuard2)
  async publishCrawledEvent(
    @Res() res: Response,
    @Body() body: PublishCrawledEventDto,
  ) {
    // if (!mongoose.isValidObjectId(body.id)) {
    //   return res.status(HttpStatus.BAD_REQUEST).json({
    //     message: 'Please provide a valid id',
    //   });
    // }
    body.ids.forEach((id) => {
      if (!mongoose.isValidObjectId(id)) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          message: `Please provide a valid id for ${id}`,
        });
      }
    });
    if (!mongoose.isValidObjectId(body.businessProfile)) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: 'Please provide a valid business id',
      });
    }
    if (!mongoose.isValidObjectId(body.user)) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: 'Please provide a valid user id',
      });
    }
    const result = await this.adminService.publishCrawledEvent(body);
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

  @Post('dashboard/config/add')
  @UseGuards(AdminGuard2)
  async configureDashboard(
    @Res() res: Response,
    @Body() body: ConfigureDashboardDto,
  ) {
    if (body.categories && body.categories.length) {
      body.categories.forEach((cat) => {
        if (!mongoose.Types.ObjectId.isValid(cat)) {
          return res.status(HttpStatus.BAD_REQUEST).json({
            message: `${cat} is not a valid category id.`,
          });
        }
      });
    }
    const result = await this.adminService.addDashboardConfiguration(body);
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

  @Get('dashboard/config')
  @UseGuards(AdminGuard2)
  async getDashboardConfig(@Res() res: Response) {
    const result = await this.adminService.getDashboardConfig();
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

  @Post('dashboard/config/update/:id')
  @UseGuards(AdminGuard2)
  async editDashboardConfig(
    @Res() res: Response,
    @Body() body: UpdateConfigureDashboardDto,
    @Param('id') id: string,
  ) {
    if (!mongoose.isValidObjectId(id)) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: 'Invalid id',
      });
    }
    if (body.categories && body.categories.length) {
      body.categories.forEach((cat) => {
        if (!mongoose.Types.ObjectId.isValid(cat)) {
          return res.status(HttpStatus.BAD_REQUEST).json({
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

  @Delete('dashboard/config/delete/:id')
  @UseGuards(AdminGuard2)
  async deleteDashboardConfig(@Res() res: Response, @Param('id') id: string) {
    if (!mongoose.isValidObjectId(id)) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: 'Invalid id',
      });
    }
    const result = await this.adminService.deleteDashboardConfiguration(id);
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

  @Get('dashboard/weight')
  @UseGuards(AdminGuard2)
  async getDashboardWeight(@Res() res: Response) {
    const result = await this.adminService.getDashboardWeight();
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

  @Post('dashboard/weight/update')
  @UseGuards(AdminGuard2)
  async updateDashboardWeight(
    @Res() res: Response,
    @Body() body: PlatformConfigDto,
  ) {
    if (!body.distanceWeightage && !body.timeWeightage) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: 'Please provide data to update',
      });
    }
    // body.distanceWeightage and body.timeWeightage both should be in the range of 0.1 to 1.0 and their sum should be 1.0
    if (body.distanceWeightage < 0.1 || body.distanceWeightage > 1.0) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: 'Distance weightage should be between 0.1 to 1.0',
      });
    }
    if (body.timeWeightage < 0.1 || body.timeWeightage > 1.0) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: 'Time weightage should be between 0.1 to 1.0',
      });
    }
    if (body.distanceWeightage + body.timeWeightage !== 1.0) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: 'Sum of distance and time weightage should be 1.0',
      });
    }
    const result = await this.adminService.editDashboardWeight(body);
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

  @Post('login')
  async adminLogin(@Res() res: Response, @Body() loginDto: LoginDto) {
    const result = await this.adminService.adminLogin(loginDto);
    if (result.success) {
      const status = result.status ? HttpStatus.OK : HttpStatus.UNAUTHORIZED;
      return res.status(status).json({
        message: result.message,
        status: result.status,
        user: result.user,
        token: result.token,
      });
    } else {
      return res.status(HttpStatus.BAD_REQUEST).json({
        status: false,
        message: result.message,
      });
    }
  }

  @Post('login/reset-password')
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
    const result = await this.adminService.forceResetPassword(
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

  @Get('profile')
  @UseGuards(AdminGuard2)
  async getProfile(@Res() res: Response, @TokenDecoder() user: DecodedUser) {
    const result = await this.adminService.getProfile(user.id);
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

  @Post('forgot-password')
  async forgotPassword(
    @Req() req: Request,
    @Res() res: Response,
    @Body() body: ForgotPasswordDto,
  ) {
    const origin = req.headers.origin;
    const result = await this.adminService.forgotPassword(origin, body.email);
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
  async dbQueries(@Res() res: Response) {
    const result = await this.adminService.dbQueries();
    if (result.success) {
      return res.status(HttpStatus.OK).json({
        message: result.message,
        data: result.data,
      });
    }

    return res.status(HttpStatus.BAD_REQUEST).json({
      message: result.message,
    });
  }

  @Post('content/category')
  @UseGuards(AdminGuard2)
  async createCategory(
    @Req() req: Request,
    @Res() res: Response,
    @Body() createCategoryDto: CreateCategoryDto,
    @TokenDecoder() user: DecodedUser,
  ) {
    const result = await this.adminService.createCategory(
      user.id,
      createCategoryDto,
    );
    if (result.success) {
      return res.status(HttpStatus.OK).json({
        message: result.message,
        data: result.data,
      });
    }

    return res.status(HttpStatus.BAD_REQUEST).json({
      message: result.message,
    });
  }

  @Get('content/categories')
  // @UseGuards(AdminGuard2)
  async getCategories(
    @Res() res: Response,
    @Query('page') page: string,
    @Query('limit') limit: string,
  ) {
    let pageNumber = page ? parseInt(page) : 1;
    let limitNumber = limit ? parseInt(limit) : 10;
    return res.status(HttpStatus.OK).json({
      categories: await this.adminService.getCategories(
        pageNumber,
        limitNumber,
      ),
    });
  }

  @Put('content/updateCategory/:id')
  @UseGuards(AdminGuard2)
  async updateCategory(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id') id: string,
    @Body() updateCategoryDto: CreateCategoryDto,
  ) {
    const result = await this.adminService.updateCategory(
      id,
      updateCategoryDto,
    );
    if (result.success) {
      return res.status(HttpStatus.OK).json({
        message: result.message,
        data: result.data,
      });
    }
  }
  @Delete('content/deleteCategory/:id')
  @UseGuards(AdminGuard2)
  async deleteContentCategory(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id') id: string,
  ) {
    const result = await this.adminService.deleteContentCategory(id);
    if (result.success) {
      return res.status(HttpStatus.OK).json({
        message: result.message,
      });
    }
  }

  @Get('users')
  @Privilege(ResourceTypes.ADMIN, Actions.READ)
  @UseGuards(PrivilegeGuard)
  @UseGuards(AdminGuard2)
  async getUsersList(
    @Res() res: Response,
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
      return res.status(HttpStatus.OK).json({
        message: result.message,
        data: result.data,
        page: result.page,
        limit: result.limit,
        total: result.total,
        pages: result.pages,
      });
    } else {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: result.message,
      });
    }
  }

  @Post('user')
  @Privilege(ResourceTypes.ADMIN, Actions.CREATE)
  @UseGuards(PrivilegeGuard)
  @UseGuards(AdminGuard2)
  async createAdmin(
    @Res() res: Response,
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
  }

  @Get('user/:id')
  @Privilege(ResourceTypes.ADMIN, Actions.READ)
  @UseGuards(PrivilegeGuard)
  @UseGuards(AdminGuard2)
  async getUser(
    @Res() res: Response,
    @Param('id') id: string,
    @TokenDecoder() user: DecodedUser,
  ) {
    if (!mongoose.isValidObjectId(id)) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: 'Invalid ObjectId',
      });
    }
    const result = await this.adminService.getAdminById(user.id, id);
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

  @Post('assign/role')
  @Privilege(ResourceTypes.ADMIN, Actions.UPDATE)
  @UseGuards(PrivilegeGuard)
  @UseGuards(AdminGuard2)
  async assignRole(
    @Res() res: Response,
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
  }

  @Put('user/update/:id')
  @Privilege(ResourceTypes.ADMIN, Actions.UPDATE)
  @UseGuards(PrivilegeGuard)
  @UseGuards(AdminGuard2)
  async updateAdmin(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id') id: string,
    @Body() data: UpdateAdminDto,
    @TokenDecoder() user: DecodedUser,
  ) {
    if (!mongoose.isValidObjectId(id)) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: 'Invalid ObjectId',
      });
    }
    const result = await this.adminService.updateAdmin(user.id, id, data);
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

  @Get('consumers')
  @Privilege(ResourceTypes.USERS, Actions.READ)
  @UseGuards(PrivilegeGuard)
  @UseGuards(AdminGuard2)
  async getConsumers(
    @Res() res: Response,
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
      return res.status(HttpStatus.OK).json({
        message: result.message,
        data: result.data,
        page: result.page,
        limit: result.limit,
        total: result.total,
        pages: result.pages,
      });
    } else {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: result.message,
      });
    }
  }

  @Get('consumer/:id')
  @Privilege(ResourceTypes.USERS, Actions.READ)
  @UseGuards(PrivilegeGuard)
  @UseGuards(AdminGuard2)
  async getConsumer(
    @Res() res: Response,
    @Param('id') id: string,
    @TokenDecoder() user: DecodedUser,
  ) {
    if (!mongoose.isValidObjectId(id)) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: 'Invalid id provided',
      });
    }
    const result = await this.adminService.getConsumerById(id);
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

  @Get('business')
  @Privilege(ResourceTypes.BUSINESS, Actions.READ)
  @UseGuards(PrivilegeGuard)
  @UseGuards(AdminGuard2)
  async getBusinesses(
    @Res() res: Response,
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
      return res.status(HttpStatus.OK).json({
        message: result.message,
        data: result.data,
        page: result.page,
        limit: result.limit,
        total: result.total,
        pages: result.pages,
      });
    } else {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: result.message,
      });
    }
  }

  @Get('business/:id')
  @Privilege(ResourceTypes.BUSINESS, Actions.READ)
  @UseGuards(PrivilegeGuard)
  @UseGuards(AdminGuard2)
  async getBusiness(
    @Res() res: Response,
    @Param('id') id: string,
    @TokenDecoder() user: DecodedUser,
  ) {
    if (!mongoose.isValidObjectId(id)) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: 'Invalid id provided',
      });
    }
    const result = await this.adminService.getBusinessById(id);
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

  @Post('create/industry')
  @UseGuards(AdminGuard2)
  async createIndustry(
    @Res() res: Response,
    @Body() data: CreateIndustryDto,
    @TokenDecoder() user: DecodedUser,
  ) {
    const result = await this.adminService.createBusinessIndustry(
      user.id,
      data,
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
  @Post('create/business/category')
  @UseGuards(AdminGuard2)
  async createBusinessCategory(
    @Res() res: Response,
    @Body() data: BusinessCategoryDto,
    @TokenDecoder() user: DecodedUser,
  ) {
    const result = await this.adminService.createBusinessCategory(
      user.id,
      data,
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

  // @Get('business/industry')
  // async getBusinessIndustry(
  //   @Res() res: Response,
  //   @Query('page') page: string,
  //   @Query('limit') limit: string,
  // ) {
  //   const pageNumber = page ? parseInt(page) : 1;
  //   const limitNumber = limit ? parseInt(limit) : 10;
  //   console.log('pageNumber', pageNumber);
  //   console.log('limitNumber', limitNumber);
  //   // const result = await this.adminService.getBusinessIndustry(
  //   //   pageNumber,
  //   //   limitNumber,
  //   // );
  //   // if (result.success) {
  //   //   return res.status(HttpStatus.OK).json({
  //   //     message: result.message,
  //   //     data: result.data,
  //   //     // limit: result.limit,
  //   //     total: result.total,
  //   //     // pages: result.pages,
  //   //   });
  //   // } else {
  //   //   return res.status(HttpStatus.BAD_REQUEST).json({
  //   //     message: result.message,
  //   //   });
  //   // }

  //   return res.status(HttpStatus.OK).json({
  //     message: 'testing',
  //   });
  // }

  @Get('testing')
  async getBusinessIndustry(
    @Res() res: Response,
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

    // console.log('testing here');
    // return res.status(HttpStatus.OK).json({
    //   message: 'testing',
    // });
  }

  @Post('create/template')
  @UseGuards(AdminGuard2)
  async createTemplate(
    @Res() res: Response,
    @Body() data: CreateTemplateDto,
    @TokenDecoder() user: DecodedUser,
  ) {
    const result = await this.adminService.createTemplate(user.id, data);
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

  @Post('update/template/:id')
  @UseGuards(AdminGuard2)
  async updateTemplate(
    @Res() res: Response,
    @Param('id') id: string,
    @Body() data: UpdateTemplateDto,
    @TokenDecoder() user: DecodedUser,
  ) {
    const result = await this.adminService.updateTemplate(user.id, id, data);
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

  @Get('templates')
  @UseGuards(AdminGuard2)
  async getTemplates(
    @Res() res: Response,
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

  @Get('template/:id')
  @UseGuards(AdminGuard2)
  async getTemplate(
    @Res() res: Response,
    @Param('id') id: string,
    @TokenDecoder() user: DecodedUser,
  ) {
    const result = await this.adminService.getTemplate(id);
    if (result.success) {
      return res.status(HttpStatus.OK).json({
        message: result.message,
        event: result.data,
      });
    } else {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: result.message,
      });
    }
  }

  @Delete('template/:id')
  @UseGuards(AdminGuard2)
  async removeTemplate(
    @Res() res: Response,
    @Param('id') id: string,
    @TokenDecoder() user: DecodedUser,
  ) {
    const result = await this.adminService.deleteTemplate(id);
    return res
      .status(result.success ? HttpStatus.OK : HttpStatus.BAD_REQUEST)
      .json({
        message: result.message,
      });
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
    @Res() res: Response,
    @Body() data: AddBusinessDto,
    @TokenDecoder() user: DecodedUser,
    @UploadedFiles()
    files: { logo?: Express.Multer.File; cover?: Express.Multer.File },
  ) {
    if(!files.cover){
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: 'Please provide cover image',
      });
    }
    console.log("inside controller?")
    const result = await this.adminService.addBusiness(user,data,files.logo,files.cover);
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
}
