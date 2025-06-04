import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  Res,
  HttpStatus,
  Delete,
  UseInterceptors,
  UploadedFile,
  Query,
  Param,
  BadRequestException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { Request, Response } from 'express';
import { ContinueWithFacebookDto } from './dto/continueWithFb.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/verifyOtp.dto';
import { ResendOtpDto } from './dto/resendOtp.dto';
import { ResetPaswordDto } from './dto/resetPass.dto';
import { UserGuard } from './guards/user.guard';
import { GuestLoginDto } from './dto/guestLogin.dto';
import { TokenDecoder } from 'src/decorators/tokenDecoder.decorator';
import { DecodedUser } from './interfaces/decodedUser.interface';
import { BusinessProfileGuard } from './guards/business.guard';
import mongoose, { isValidObjectId } from 'mongoose';
import { GetDashboardDto } from './dto/getDashboard.dto';
import { OAuth2Dto } from './dto/oAuth2.dto';
import { JwtGuard } from './guards/jwt.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { RefreshGuard } from './guards/refresh.guard';
import { AuthGuard } from '@nestjs/passport';
import { ConfigureDashboardDto } from './dto/configureDashboard.dto';
import { UpdateConfigureDashboardDto } from './dto/updateDashConfig.dto';
import { RefreshFcmDto } from './dto/refreshFcm.dto';
import { AdminGuard } from './guards/admin.guard';
import { PlatformConfigDto } from './dto/platformConfig.dto';
import { SignupAuthDto } from './dto/signup-auth.dto';
import { PersonDetailDto } from './dto/personalDetail.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { UserTypes } from 'src/enums/auth.enums';
import { JwtGuard2 } from './guards2/jwt2.guard';
import { ResetPasswordGuard } from './guards2/resetPassword.guard';
import { VerifyMailGuard } from './guards2/mailVerify.guard';
import { RateLimitGuard } from './guards/rateLimiter.guard';
import { CacheInterceptor } from '@nestjs/cache-manager';

@UseInterceptors(CacheInterceptor)
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('upload/photo')
  @UseGuards(UserGuard)
  @UseInterceptors(FileInterceptor('photo'))
  async uploadPhoto(
    @Res() res: Response,
    @UploadedFile() photo: Express.Multer.File,
    @TokenDecoder() user: DecodedUser,
  ) {
    const result = await this.authService.uploadPhoto(user, photo);
    if (result.success) {
      return res.status(HttpStatus.OK).json({
        message: result.message,
        url: result.image,
      });
    } else {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: result.message,
      });
    }
  }

  @Post('signup')
  async create(
    @Req() req: Request,
    @Res() res: Response,
    @Body() createAuthDto: CreateAuthDto,
  ) {
    const userAgent = req.headers['user-agent'];
    const ip = req.ip;
    const result = await this.authService.create(createAuthDto, userAgent, ip);
    if (result.success) {
      return res.status(HttpStatus.CREATED).json({
        message: result.message,
        user: result.user,
        fcmExists: result.fcmExists,
      });
    } else {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: result.message,
      });
    }
  }
  @Post('signupOTP')
  async signupOTP(
    @Req() req: Request,
    @Res() res: Response,
    @Body() createAuthDto: SignupAuthDto,
  ) {
    const userAgent = req.headers['user-agent'];
    const ip = req.ip;
    const result = await this.authService.signupOTP(
      createAuthDto,
      userAgent,
      ip,
    );
    if (result.success) {
      return res.status(HttpStatus.CREATED).json({
        message: result.message,
        user: result.user,
        fcmExists: result.fcmExists,
      });
    } else {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: result.message,
      });
    }
  }
  @Post('updateContactDetails/:id')
  async contactDetails(
    @Req() req: Request,
    @Res() res: Response,
    @Body() createAuthDto: UpdateAuthDto,
    @Param('id') id: string,
  ) {
    const userAgent = req.headers['user-agent'];
    const ip = req.ip;
    const result = await this.authService.updateContactDetails(
      createAuthDto,
      id,
      userAgent,
      ip,
    );
    if (result.success) {
      return res.status(HttpStatus.ACCEPTED).json({
        message: result.message,
        // user: result.user,
      });
    } else {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: result.message,
      });
    }
  }

  @Post('verifyContactDetails')
  async verifyContactDetails(@Res() res: Response, @Body() body: VerifyOtpDto) {
    const result = await this.authService.verifyContactDetails(body);
    if (result.success) {
      return res.status(HttpStatus.OK).json({
        message: result.message,
        // user: result.user,
      });
    } else {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: result.message,
      });
    }
  }
  @Post('updatePersonalDetails/:id')
  async updatePersonalDetails(
    @Req() req: Request,
    @Res() res: Response,
    @Body() personalDetailDTO: PersonDetailDto,
    @Param('id') id: string,
  ) {
    const userAgent = req.headers['user-agent'];
    const ip = req.ip;
    const result = await this.authService.updatePersonalDetails(
      personalDetailDTO,
      id,
      userAgent,
      ip,
    );
    if (result.success) {
      return res.status(HttpStatus.ACCEPTED).json({
        message: result.message,
        // user: result.user,
        // fcmExists: result.fcmExists,
      });
    } else {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: result.message,
      });
    }
  }

  @Post('google')
  async loginWithGoogle(
    @Req() req: Request,
    @Res() res: Response,
    @Body() body: OAuth2Dto,
  ) {
    const userAgent = req.headers['user-agent'];
    const ip = req.ip;
    const result = await this.authService.loginWithGoogle(body, userAgent, ip);
    if (result.success) {
      return res.status(HttpStatus.OK).json({
        message: result.message,
        user: result.user,
        token: result.token,
      });
    } else {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: result.message,
      });
    }
  }

  // @Get('apple')
  // @UseGuards(AuthGuard('apple'))
  // async loginWithApple(@Res() res: Response) {
  //   return HttpStatus.OK;
  // }

  @Post('apple')
  // @UseGuards(AuthGuard('apple'))
  async appleCallback(
    @Req() req: Request,
    @Res() res: Response,
    @Body() body: OAuth2Dto,
  ) {
    const userAgent = req.headers['user-agent'];
    const ip = req.ip;
    const result = await this.authService.loginWithApple(body, userAgent, ip);
    if (result.success) {
      return res.status(HttpStatus.OK).json({
        message: result.message,
        user: result.user,
        token: result.token,
      });
    } else {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: result.message,
      });
    }
  }
  @Post('login')
  async login(@Res() res: Response, @Body() loginDto: LoginDto) {
    const result = await this.authService.login(loginDto);
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

  @Post('loginOTP')
  async loginOTP(
    @Req() req: Request,
    @Res() res: Response,
    @Body() loginDto: SignupAuthDto,
  ) {
    const userAgent = req.headers['user-agent'];
    const ip = req.ip;
    const result = await this.authService.loginOTP(loginDto, userAgent, ip);
    if (result.success) {
      return res.status(HttpStatus.OK).json({
        message: result.message,
        user: result.user,
        // token: result.token,
        // fcmExists: result.fcmExists,
      });
    } else {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: result.message,
      });
    }
  }

  @Post('admin/login')
  async adminLogin(@Res() res: Response, @Body() loginDto: LoginDto) {
    const result = await this.authService.adminLogin(loginDto);
    if (result.success) {
      return res.status(HttpStatus.OK).json({
        message: result.message,
        user: result.user,
        token: result.token,
      });
    } else {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: result.message,
      });
    }
  }

  @Post('admin/login-v2')
  async adminLoginV2(@Res() res: Response, @Body() loginDto: LoginDto) {
    const result = await this.authService.adminLoginV2(loginDto);
    if (result.success) {
      return res.status(HttpStatus.OK).json({
        message: result.message,
        user: result.user,
        token: result.token,
      });
    } else {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: result.message,
      });
    }
  }

  @Post('dashboard/config/add')
  @UseGuards(AdminGuard)
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
    const result = await this.authService.addDashboardConfiguration(body);
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
  @UseGuards(AdminGuard)
  async getDashboardConfig(@Res() res: Response) {
    const result = await this.authService.getDashboardConfig();
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
  @Get('dashboard/getAllConfigs')
  @UseGuards(JwtGuard2)
  async getDashboardAllConfigs(@Res() res: Response) {
    const result = await this.authService.getDashboardAllConfigs();
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
  @UseGuards(AdminGuard)
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
    const result = await this.authService.updateDashboardConfiguration(
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
  @UseGuards(AdminGuard)
  async deleteDashboardConfig(@Res() res: Response, @Param('id') id: string) {
    if (!mongoose.isValidObjectId(id)) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: 'Invalid id',
      });
    }
    const result = await this.authService.deleteDashboardConfiguration(id);
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
  @UseGuards(AdminGuard)
  async getDashboardWeight(@Res() res: Response) {
    const result = await this.authService.getDashboardWeight();
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
  @UseGuards(AdminGuard)
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
    const result = await this.authService.editDashboardWeight(body);
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

  @Post('guest/login')
  async guestLogin(@Res() res: Response, @Body() body: GuestLoginDto) {
    const result = await this.authService.guestLogin(body);
    if (result.success) {
      return res.status(HttpStatus.OK).json({
        message: result.message,
        user: result.user,
        token: result.token,
      });
    } else {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: result.message,
      });
    }
  }

  @Post('continueWithFacebook')
  async facebookAuth(@Body() body: ContinueWithFacebookDto) {
    return this.authService.continueWithFacebook(body);
  }

  @Post('verify/otp')
  async verifyEmail(@Res() res: Response, @Body() body: VerifyOtpDto) {
    const result = await this.authService.verifyOtp(body);
    if (result.success) {
      return res.status(HttpStatus.OK).json({
        message: result.message,
        user: result.user,
        token: result.token,
      });
    } else {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: result.message,
      });
    }
  }

  @Post('resend/otp')
  async resendOtp(@Res() res: Response, @Body() body: ResendOtpDto) {
    const { success, message } = await this.authService.resendOtp(body);
    const status = success ? HttpStatus.OK : HttpStatus.BAD_REQUEST;
    return res.status(status).json({
      message,
    });
  }

  @Post('forgotPassword')
  async forgotPassword(@Res() res: Response, @Body() body: { email: string }) {
    const result = await this.authService.forgotPassword(body.email);
    if (result.success) {
      const { id, message } = result;
      return res.status(HttpStatus.OK).json({
        id,
        message,
      });
    } else {
      const { message } = result;
      return res.status(HttpStatus.BAD_REQUEST).json({
        message,
      });
    }
  }

  @Post('resetPassword')
  async resetPassword(@Res() res: Response, @Body() body: ResetPaswordDto) {
    const { success, message } = await this.authService.resetPassword(body);
    const status = success ? HttpStatus.OK : HttpStatus.BAD_REQUEST;
    return res.status(status).json({
      message,
    });
  }

  @Get('refresh/token')
  @UseGuards(JwtGuard2)
  async refreshToken(@Res() res: Response, @TokenDecoder() user: DecodedUser) {
    const result = await this.authService.refreshToken(user);
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

  @Post('refresh/token/fcm')
  @UseGuards(RefreshGuard)
  async refreshFcmToken(
    @Res() res: Response,
    @TokenDecoder() user: DecodedUser,
    @Body() body: RefreshFcmDto,
  ) {
    const result = await this.authService.refreshFcmToken(user.id, body);
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

  @Get('fcm/report')
  @UseGuards(RateLimitGuard)
  async fcmReport(@Res() res: Response) {
    await this.authService.fcmReport();
    return res.status(HttpStatus.OK).json({
      message: 'Report sent',
    });
  }

  @Post('dashboard')
  @UseGuards(JwtGuard)
  async dashboard(
    @Res() res: Response,
    @Body() body: GetDashboardDto,
    @Query('search') search: string,
    @Query('distance') distance: string,
    @TokenDecoder() user: DecodedUser,
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
    if (distance) {
      if (isNaN(parseInt(distance))) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          message: 'Please provide a valid distance value.',
        });
      }
    }
    const result = await this.authService.getDashboard(
      user,
      parseFloat(body.latitude),
      parseFloat(body.longitude),
      distance ? parseInt(distance) : 1000000000000,
      search ? search : '',
      body.categories ? body.categories : [],
      body.startDate ? new Date(body.startDate) : null,
      body.endDate ? new Date(body.endDate) : null,
    );
    if (result.success) {
      return res.status(HttpStatus.OK).json({
        message: result.message,
        // events: result.events,
        // freeEvents: result.freeEvents,
        // privateEvents: result.privateEvents,
        // offers: result.offers,
        // data: result.data,
        ...result.data,
      });
    } else {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: result.message,
      });
    }
  }

  @Post('dashboard/v2')
  @UseGuards(JwtGuard)
  async dashboardV2(
    @Res() res: Response,
    @Body() body: GetDashboardDto,
    @Query('search') search: string,
    @Query('distance') distance: string,
    @TokenDecoder() user: DecodedUser,
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
    if (distance) {
      if (isNaN(parseInt(distance))) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          message: 'Please provide a valid distance value.',
        });
      }
    }
    const result = await this.authService.getDashboardV2(
      user,
      parseFloat(body.latitude),
      parseFloat(body.longitude),
      distance ? parseInt(distance) : 1000000000000,
      search ? search : '',
      body.categories ? body.categories : [],
      body.startDate ? new Date(body.startDate) : null,
      body.endDate ? new Date(body.endDate) : null,
    );
    if (result.success) {
      return res.status(HttpStatus.OK).json({
        message: result.message,
        // events: result.events,
        // freeEvents: result.freeEvents,
        // privateEvents: result.privateEvents,
        // offers: result.offers,
        // data: result.data,
        ...result.data,
      });
    } else {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: result.message,
      });
    }
  }

  @Post('fixedCarouselEvents')
  @UseGuards(JwtGuard2)
  async dashboardFixedCarouselEvents(
    @Res() res: Response,
    @Body() body: GetDashboardDto,
    @Query('search') search: string,
    @Query('distance') distance: string,
    @TokenDecoder() user: DecodedUser,
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
    if (distance) {
      if (isNaN(parseInt(distance))) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          message: 'Please provide a valid distance value.',
        });
      }
    }
    const result = await this.authService.dashboardFixedCarouselEvents(
      user,
      parseFloat(body.latitude),
      parseFloat(body.longitude),
      distance ? parseInt(distance) : 1000000000000,
      search ? search : '',
      body.categories ? body.categories : [],
      body.startDate ? new Date(body.startDate) : null,
      body.endDate ? new Date(body.endDate) : null,
    );
    if (result.success) {
      return res.status(HttpStatus.OK).json({
        message: result.message,
        // events: result.events,
        // freeEvents: result.freeEvents,
        // privateEvents: result.privateEvents,
        // offers: result.offers,
        // data: result.data,
        ...result.data,
      });
    } else {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: result.message,
      });
    }
  }
  @Post('getDashboardCarouselEvent/:id')
  @UseGuards(JwtGuard2)
  async getDashboardCarouselEvent2(
    // @Res() res: Response,
    @Body() body: GetDashboardDto,
    @Param('id') id: string,
    @Query('search') search: string,
    @Query('distance') distance: string,
    @Query('timeZone') timeZone: string,
    @TokenDecoder() user: DecodedUser,
  ) {
    if (user.userType !== UserTypes.USER && user.userType !== UserTypes.GUEST) {
      // return res.status(HttpStatus.BAD_REQUEST).json({
      //   message: 'Not a valid User',
      // });
      throw new BadRequestException('Not a valid User');
    }
    if (body.categories && body.categories.length) {
      body.categories.forEach((cat) => {
        if (!mongoose.Types.ObjectId.isValid(cat)) {
          throw new BadRequestException(`${cat} is not a valid category id.`);
          // return res.status(HttpStatus.BAD_REQUEST).json({
          //   message: `${cat} is not a valid category id.`,
          // });
        }
      });
    }
    if (distance) {
      if (isNaN(parseInt(distance))) {
        throw new BadRequestException('Please provide a valid distance value.');

        // return res.status(HttpStatus.BAD_REQUEST).json({
        //   message: 'Please provide a valid distance value.',
        // });
      }
    }
    const result = await this.authService.getDashboardCarouselEvent2(
      user,
      id,
      parseFloat(body.latitude),
      parseFloat(body.longitude),
      distance ? parseInt(distance) : 1000000000000,
      search ? search : '',
      timeZone ? timeZone : 'America/Chicago',
      body.categories ? body.categories : [],
      body.startDate ? new Date(body.startDate) : null,
      body.endDate ? new Date(body.endDate) : null,
    );
    if (result.success) {
      // return res.status(HttpStatus.OK).json({
      return {
        message: result.message,
        ...result.data,
      };
    } else {
      // return res.status(HttpStatus.BAD_REQUEST).json({
      //   message: result.message,
      // });
      throw new BadRequestException(result.message);
    }
  }

  @Post('dashboard/map-view')
  @UseGuards(JwtGuard)
  async dashboardMapView(
    @Res() res: Response,
    @Body() body: GetDashboardDto,
    @Query('search') search: string,
    @Query('limit') limit: string,
    @Query('page') page: string,
    @Query('type') type: string,
    @TokenDecoder() user: DecodedUser,
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
    const result = await this.authService.getDashboardMapView(
      user,
      parseFloat(body.latitude),
      parseFloat(body.longitude),
      100000,
      search ? search : '',
      limit ? parseInt(limit) : 15,
      page ? parseInt(page) : 1,
      type ? type.toLowerCase() : '',
      body.categories ? body.categories : [],
      body.startDate ? new Date(body.startDate) : null,
      body.endDate ? new Date(body.endDate) : null,
    );
    if (result.success) {
      return res.status(HttpStatus.OK).json({
        message: result.message,
        events: result.events,
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

  @Get('dashboard/:id')
  @UseGuards(JwtGuard2)
  async getEventDetails(
    @Res() res: Response,
    @TokenDecoder() user: DecodedUser,
    @Param('id') id: string,
    @Body() body: GetDashboardDto,
  ) {
    if (!mongoose.isValidObjectId(id)) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: 'Invalid event id',
      });
    }
    const result = await this.authService.getEventDetails(id, user, body);
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

  @Get('switch/profile')
  @UseGuards(BusinessProfileGuard)
  async switchToUserProfile(
    @Res() res: Response,
    @TokenDecoder() user: DecodedUser,
  ) {
    const result = await this.authService.switchToUserProfile(user.id);
    if (result.success) {
      return res.status(HttpStatus.OK).json({
        message: result.message,
        user: result.user,
        token: result.token,
      });
    } else {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: result.message,
      });
    }
  }

  @Post('logout')
  @UseGuards(UserGuard)
  async logout(
    @Req() req,
    @Res() res,
    @Query('fcm') fcm: string,
    @TokenDecoder() user: DecodedUser,
  ) {
    const token = req.headers.authorization.split(' ')[1];
    const result = await this.authService.logout(user, token, fcm ? fcm : '');
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

  @Delete('delete')
  @UseGuards(UserGuard)
  async deleteAccount(@Res() res: Response, @TokenDecoder() user: DecodedUser) {
    const result = await this.authService.deleteAccount(user);
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
  @Get('preSignedURL')
  @UseGuards(JwtGuard2)
  async getPresignedUrl(@Res() res: Response, @Query('url') url: string) {
    const result = await this.authService.getPreSignedUrl(url);
    if (result.success) {
      return res.status(HttpStatus.OK).json({
        message: result.message,
        preSignedUrl: result.url,
      });
    } else {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: result.message,
      });
    }
  }
  @Post('verify-email')
  @UseGuards(VerifyMailGuard)
  async verifyEmailviaLink(
    @Req() req: Request,
    @Res() res: Response,
    @TokenDecoder() user: DecodedUser,
    // @Query('token') token: string,
  ) {
    const tokenId = req['tokenId'];
    const result = await this.authService.verifyEmailviaLink(user, tokenId);
    if (result.success) {
      return res.status(HttpStatus.OK).json({
        message: result.message,
        // token: result.token,
      });
    } else {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: result.message,
      });
    }
  }
  //forgot password API
  @Post('password-reset-link')
  async passwordResetLink(
    @Req() req: Request,
    @Res() res: Response,
    @Body('email') email: string,

    @Body('userType') userType: string,
  ) {
    const result = await this.authService.passwordResetLink(email, userType);
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
  // forgot password Verify API
  @Post('verify-pass-reset')
  @UseGuards(ResetPasswordGuard)
  async verifyPassReset(
    @Req() req: Request,
    @Res() res: Response,
    @TokenDecoder() user: DecodedUser,
    @Body('password') password: string,
  ) {
    const tokenId = req['tokenId'];

    const result = await this.authService.verifyPassReset(
      user,
      password,
      tokenId,
    );
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

  @Post('resendVerificationLink/:id')
  async resendVerificationLink(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id') id: string,
    @Query('userType') userType: string,
  ) {
    if (!isValidObjectId(id)) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: 'Invalid ObjectId',
      });
    }
    const result = await this.authService.resendVerificationLink(id, userType);
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

  @Get('getProfile')
  @UseGuards(JwtGuard2)
  async getProfile(@Res() res: Response, @TokenDecoder() user: DecodedUser) {
    const result = await this.authService.getProfile(user.id, user.userType);
    if (result.success) {
      return res.status(HttpStatus.OK).json({
        message: result.message,
        user: result.user,
      });
    } else {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: result.message,
      });
    }
  }
}
