import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  Delete,
  UseInterceptors,
  UploadedFile,
  Query,
  Param,
  BadRequestException,
  Put,
  Inject,
  ExecutionContext,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Request } from 'express';
import { ContinueWithFacebookDto } from './dto/continueWithFb.dto';
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
import { RefreshFcmDto } from './dto/refreshFcm.dto';
import { SignupAuthDto } from './dto/signup-auth.dto';
import { PersonDetailDto } from './dto/personalDetail.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { REDIS_TTL, UserTypes } from 'src/enums/auth.enums';
import { JwtGuard2 } from './guards2/jwt2.guard';
import { ResetPasswordGuard } from './guards2/resetPassword.guard';
import { VerifyMailGuard } from './guards2/mailVerify.guard';
import { RateLimitGuard } from './guards/rateLimiter.guard';
import { DashboardSearchDto } from './dto/dashboardSearch.dto';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  @Post('upload/photo')
  @UseGuards(UserGuard)
  @UseInterceptors(FileInterceptor('photo'))
  @HttpCode(HttpStatus.OK)
  async uploadPhoto(
    @UploadedFile() photo: Express.Multer.File,
    @TokenDecoder() user: DecodedUser,
  ) {
    const result = await this.authService.uploadPhoto(user, photo);
    if (!result.success) {
      throw new BadRequestException(result.message);
    }
    return {
      message: result.message,
      url: result.image,
    };
  }

  @Post('signupOTP')
  @HttpCode(HttpStatus.CREATED)
  async signupOTP(@Req() req: Request, @Body() createAuthDto: SignupAuthDto) {
    const userAgent = req.headers['user-agent'];
    const ip = req.ip;
    const result = await this.authService.signupOTP(
      createAuthDto,
      userAgent,
      ip,
    );
    if (!result.success) {
      throw new BadRequestException(result.message);
    }
    return {
      message: result.message,
      user: result.user,
      fcmExists: result.fcmExists,
    };
  }

  @Post('updateContactDetails/:id')
  @HttpCode(HttpStatus.ACCEPTED)
  async contactDetails(
    @Req() req: Request,
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
    if (!result.success) {
      throw new BadRequestException(result.message);
    }
    return {
      message: result.message,
    };
  }

  @Post('verifyContactDetails')
  @HttpCode(HttpStatus.OK)
  async verifyContactDetails(@Body() body: VerifyOtpDto) {
    const result = await this.authService.verifyContactDetails(body);
    if (!result.success) {
      throw new BadRequestException(result.message);
    }
    return {
      message: result.message,
    };
  }

  // @Put('updateUserConsent')
  // @UseGuards(JwtGuard2)
  // @HttpCode(HttpStatus.OK)
  // async updateUserConsent(
  //   @Req() req: Request,
  //   @Body('privacyConsent') privacyConsent: boolean,
  //   @TokenDecoder() user: DecodedUser,
  // ) {
  //   const userAgent = req.headers['user-agent'];
  //   const ip = req.ip;
  //   const result = await this.authService.updateUserConsent(
  //     user.id,
  //     privacyConsent,
  //   );
  //   if (!result.success) {
  //     throw new BadRequestException(result.message);
  //   }
  //   return {
  //     message: result.message,
  //   };
  // }

  @Post('updatePersonalDetails/:id')
  @HttpCode(HttpStatus.ACCEPTED)
  @UseGuards(JwtGuard2)
  async updatePersonalDetails(
    @Req() req: Request,
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
    if (!result.success) {
      throw new BadRequestException(result.message);
    }
    return {
      message: result.message,
    };
  }

  @Post('google')
  @HttpCode(HttpStatus.OK)
  async loginWithGoogle(@Req() req: Request, @Body() body: OAuth2Dto) {
    const userAgent = req.headers['user-agent'];
    const ip = req.ip;
    const result = await this.authService.loginWithGoogle(body, userAgent, ip);
    if (!result.success) {
      throw new BadRequestException(result.message);
    }
    return {
      message: result.message,
      user: result.user,
      token: result.token,
    };
  }

  @Post('apple')
  @HttpCode(HttpStatus.OK)
  async appleCallback(@Req() req: Request, @Body() body: OAuth2Dto) {
    const userAgent = req.headers['user-agent'];
    const ip = req.ip;
    const result = await this.authService.loginWithApple(body, userAgent, ip);
    if (!result.success) {
      throw new BadRequestException(result.message);
    }
    return {
      message: result.message,
      user: result.user,
      token: result.token,
    };
  }

  @Post('loginOTP')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RateLimitGuard)
  async loginOTP(@Req() req: Request, @Body() loginDto: SignupAuthDto) {
    const userAgent = req.headers['user-agent'];
    const ip = req.ip;
    const result = await this.authService.unifiedOTP(loginDto, userAgent, ip);
    if (!result.success) {
      throw new BadRequestException(result.message);
    }
    return {
      message: result.message,
      user: result.user,
    };
  }

  @Post('guest/login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RateLimitGuard)
  async guestLogin(@Body() body: GuestLoginDto) {
    const result = await this.authService.guestLogin(body);
    if (!result.success) {
      throw new BadRequestException(result.message);
    }
    return {
      message: result.message,
      user: result.user,
      token: result.token,
    };
  }

  // @Post('continueWithFacebook')
  // async facebookAuth(@Body() body: ContinueWithFacebookDto) {
  //   return this.authService.continueWithFacebook(body);
  // }

  @Post('verify/otp')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RateLimitGuard)
  async verifyEmail(@Body() body: VerifyOtpDto) {
    const result = await this.authService.verifyOtp(body);
    if (!result.success) {
      throw new BadRequestException(result.message);
    }
    return {
      message: result.message,
      user: result.user,
      token: result.token,
    };
  }

  @Post('resend/otp')
  @HttpCode(HttpStatus.OK)
  async resendOtp(@Body() body: ResendOtpDto) {
    const { success, message } = await this.authService.resendOtp(body);
    if (!success) {
      throw new BadRequestException(message);
    }
    return { message };
  }

  // @Post('forgotPassword')
  // @HttpCode(HttpStatus.OK)
  // @UseGuards(RateLimitGuard)
  // async forgotPassword(@Body() body: { email: string }) {
  //   const result = await this.authService.forgotPassword(body.email);
  //   if (!result.success) {
  //     throw new BadRequestException(result.message);
  //   }
  //   const { id, message } = result;
  //   return { id, message };
  // }

  @Post('resetPassword')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RateLimitGuard)
  async resetPassword(@Body() body: ResetPaswordDto) {
    const { success, message } = await this.authService.resetPassword(body);
    if (!success) {
      throw new BadRequestException(message);
    }
    return { message };
  }

  @Get('refresh/token')
  @UseGuards(RefreshGuard)
  async refreshToken(@TokenDecoder() user: DecodedUser) {
    const result = await this.authService.refreshToken(user);
    if (!result.success) {
      throw new BadRequestException(result.message);
    }
    return {
      message: result.message,
      token: result.token,
    };
  }

  @Post('refresh/token/fcm')
  @UseGuards(RefreshGuard)
  @HttpCode(HttpStatus.OK)
  async refreshFcmToken(
    @TokenDecoder() user: DecodedUser,
    @Body() body: RefreshFcmDto,
  ) {
    const result = await this.authService.refreshFcmToken(user.id, body);
    if (!result.success) {
      throw new BadRequestException(result.message);
    }
    return {
      message: result.message,
      token: result.token,
    };
  }

  @Get('dashboard/getAllConfigs')
  @UseGuards(JwtGuard2)
  async getDashboardAllConfigs(
    @Query('carouselType') carouselType: string,
    @Req() request: Request,
  ) {
    if (!carouselType) {
      throw new BadRequestException('Carousel type is required');
    }
    const key = request.originalUrl;
    console.log('Cache Key:', key);
    const cached = await this.cacheManager.get(key);
    if (cached) {
      console.log('✅ Returning getAllConfigs from Redis');
      return cached;
    }

    const result = await this.authService.getDashboardAllConfigs(carouselType);
    await this.cacheManager.set(key, result, REDIS_TTL.ONEDAY);
    if (!result.success) {
      throw new BadRequestException(result.message);
    }
    return {
      message: result.message,
      data: result.data,
    };
  }

  // @Get('fcm/report')
  // @UseGuards(RateLimitGuard)
  // async fcmReport() {
  //   await this.authService.fcmReport();
  //   return { message: 'Report sent' };
  // }

  // @Post('dashboard')
  // @UseGuards(JwtGuard)
  // @HttpCode(HttpStatus.OK)
  // async dashboard(
  //   @Body() body: GetDashboardDto,
  //   @Query('search') search: string,
  //   @Query('distance') distance: string,
  //   @TokenDecoder() user: DecodedUser,
  // ) {
  //   if (body.categories && body.categories.length) {
  //     for (const cat of body.categories) {
  //       if (!mongoose.Types.ObjectId.isValid(cat)) {
  //         throw new BadRequestException(`${cat} is not a valid category id.`);
  //       }
  //     }
  //   }
  //   if (distance) {
  //     if (isNaN(parseInt(distance))) {
  //       throw new BadRequestException('Please provide a valid distance value.');
  //     }
  //   }
  //   const result = await this.authService.getDashboard(
  //     user,
  //     parseFloat(body.latitude),
  //     parseFloat(body.longitude),
  //     distance ? parseInt(distance) : 1000000000000,
  //     search ? search : '',
  //     body.categories ? body.categories : [],
  //     body.startDate ? new Date(body.startDate) : null,
  //     body.endDate ? new Date(body.endDate) : null,
  //   );
  //   if (!result.success) {
  //     throw new BadRequestException(result.message);
  //   }
  //   return {
  //     message: result.message,
  //     ...result.data,
  //   };
  // }

  // @Post('dashboard/v2')
  // @UseGuards(JwtGuard)
  // @HttpCode(HttpStatus.OK)
  // async dashboardV2(
  //   @Body() body: GetDashboardDto,
  //   @Query('search') search: string,
  //   @Query('distance') distance: string,
  //   @TokenDecoder() user: DecodedUser,
  // ) {
  //   if (body.categories && body.categories.length) {
  //     for (const cat of body.categories) {
  //       if (!mongoose.Types.ObjectId.isValid(cat)) {
  //         throw new BadRequestException(`${cat} is not a valid category id.`);
  //       }
  //     }
  //   }
  //   if (distance) {
  //     if (isNaN(parseInt(distance))) {
  //       throw new BadRequestException('Please provide a valid distance value.');
  //     }
  //   }
  //   const result = await this.authService.getDashboardV2(
  //     user,
  //     parseFloat(body.latitude),
  //     parseFloat(body.longitude),
  //     distance ? parseInt(distance) : 1000000000000,
  //     search ? search : '',
  //     body.categories ? body.categories : [],
  //     body.startDate ? new Date(body.startDate) : null,
  //     body.endDate ? new Date(body.endDate) : null,
  //   );
  //   if (!result.success) {
  //     throw new BadRequestException(result.message);
  //   }
  //   return {
  //     message: result.message,
  //     ...result.data,
  //   };
  // }

  // @Post('fixedCarouselEvents')
  // @UseGuards(JwtGuard2)
  // @HttpCode(HttpStatus.OK)
  // async dashboardFixedCarouselEvents(
  //   @Body() body: GetDashboardDto,
  //   @Query('search') search: string,
  //   @Query('distance') distance: string,
  //   @TokenDecoder() user: DecodedUser,
  // ) {
  //   if (body.categories && body.categories.length) {
  //     for (const cat of body.categories) {
  //       if (!mongoose.Types.ObjectId.isValid(cat)) {
  //         throw new BadRequestException(`${cat} is not a valid category id.`);
  //       }
  //     }
  //   }
  //   if (distance) {
  //     if (isNaN(parseInt(distance))) {
  //       throw new BadRequestException('Please provide a valid distance value.');
  //     }
  //   }
  //   const result = await this.authService.dashboardFixedCarouselEvents(
  //     user,
  //     parseFloat(body.latitude),
  //     parseFloat(body.longitude),
  //     distance ? parseInt(distance) : 1000000000000,
  //     search ? search : '',
  //     body.categories ? body.categories : [],
  //     body.startDate ? new Date(body.startDate) : null,
  //     body.endDate ? new Date(body.endDate) : null,
  //   );
  //   if (!result.success) {
  //     throw new BadRequestException(result.message);
  //   }
  //   return {
  //     message: result.message,
  //     ...result.data,
  //   };
  // }

  @Post('getDashboardCarouselEvent/:id')
  @UseGuards(JwtGuard2)
  @HttpCode(HttpStatus.OK)
  async getDashboardCarouselEvent2(
    @Body() body: GetDashboardDto,
    @Param('id') id: string,
    @Query('search') search: string,
    @Query('distance') distance: string,
    @Query('timeZone') timeZone: string,
    @TokenDecoder() user: DecodedUser,
  ) {
    console.log('LATITUDE AND LONGITUDE::::', body.latitude, body.longitude);
    console.log('Body:::', body);
    if (user.userType !== UserTypes.USER && user.userType !== UserTypes.GUEST) {
      throw new BadRequestException('Not a valid User');
    }
    if (body.categories && body.categories.length) {
      for (const cat of body.categories) {
        if (!mongoose.Types.ObjectId.isValid(cat)) {
          throw new BadRequestException(`${cat} is not a valid category id.`);
        }
      }
    }
    if (distance) {
      if (isNaN(parseInt(distance))) {
        throw new BadRequestException('Please provide a valid distance value.');
      }
    }
    console.log('Distance in controller:', distance);

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
      body.industries ? body.industries : [],
      body.isFollowedByMe ? body.isFollowedByMe : null,
      body.dealType ? body.dealType : null,
    );

    if (!result.success) {
      throw new BadRequestException(result.message);
    }
    return {
      message: result.message,
      ...result.data,
      // eventsResult: result.data,
    };
  }

  @Post('dashboard/map-view/:id')
  @UseGuards(JwtGuard2)
  @HttpCode(HttpStatus.OK)
  async dashboardMapView(
    @Body() body: GetDashboardDto,
    @Param('id') id: string,
    @Query('search') search: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('distance') distance: string,
    @Query('timeZone') timeZone: string,
    // @Query('type') type: string,
    @TokenDecoder() user: DecodedUser,
  ) {
    if (body.categories && body.categories.length) {
      for (const cat of body.categories) {
        if (!mongoose.Types.ObjectId.isValid(cat)) {
          throw new BadRequestException(`${cat} is not a valid category id.`);
        }
      }
    }
    const result = await this.authService.getDashboardMapView(
      user,
      id,
      parseFloat(body.latitude),
      parseFloat(body.longitude),
      distance ? parseInt(distance) : 1000000000000,
      search ? search : '',
      timeZone ? timeZone : 'America/Chicago',
      limit ? parseInt(limit) : 15,
      page ? parseInt(page) : 1,
      // type ? type.toLowerCase() : '',
      body.categories ? body.categories : [],
      body.startDate ? new Date(body.startDate) : null,
      body.endDate ? new Date(body.endDate) : null,
    );
    if (!result.success) {
      throw new BadRequestException(result.message);
    }
    return {
      message: result.message,
      events: result.events,
      page: result.page,
      limit: result.limit,
      total: result.totalCount,
      pages: result.pages,
    };
  }
  @Post('dashboard/map')
  @UseGuards(JwtGuard2)
  @HttpCode(HttpStatus.OK)
  async dashboardMap(
    @Body() body: GetDashboardDto,
    @Param('id') id: string,
    @Query('search') search: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('distance') distance: string,
    @Query('timeZone') timeZone: string,
    @Query('carouselType') carouselType: string,

    @TokenDecoder() user: DecodedUser,
  ) {
    if (body.categories && body.categories.length) {
      for (const cat of body.categories) {
        if (!mongoose.Types.ObjectId.isValid(cat)) {
          throw new BadRequestException(`${cat} is not a valid category id.`);
        }
      }
    }
    const result = await this.authService.getDashboardMap(
      user,
      parseFloat(body.latitude),
      parseFloat(body.longitude),
      carouselType ? carouselType : 'event',
      distance ? parseInt(distance) : 1000000000000,
      search ? search : '',
      timeZone ? timeZone : 'America/Chicago',
      limit ? parseInt(limit) : 15,
      page ? parseInt(page) : 1,
      // type ? type.toLowerCase() : '',
      body.categories ? body.categories : [],
      body.startDate ? new Date(body.startDate) : null,
      body.endDate ? new Date(body.endDate) : null,
      body.dealType ? body.dealType : null,
    );
    if (!result.success) {
      throw new BadRequestException(result.message);
    }
    return {
      message: result.message,
      eventsResult: result.events,
      page: result.page,
      limit: result.limit,
      total: result.totalCount,
      pages: result.pages,
    };
  }
  @Post('dashboard/listings/map')
  @UseGuards(JwtGuard2)
  @HttpCode(HttpStatus.OK)
  async dashboardListingMap(
    @Body() body: GetDashboardDto,
    @Param('id') id: string,
    @Query('search') search: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('distance') distance: string,
    @TokenDecoder() user: DecodedUser,
  ) {
    if (body.industries && body.industries.length) {
      for (const cat of body.industries) {
        if (!mongoose.Types.ObjectId.isValid(cat)) {
          throw new BadRequestException(`${cat} is not a valid industry id.`);
        }
      }
    }
    const result = await this.authService.dashboardListingMap(
      user,
      parseFloat(body.latitude),
      parseFloat(body.longitude),
      distance ? parseInt(distance) : 1000000000000,
      search ? search : '',
      limit ? parseInt(limit) : 15,
      page ? parseInt(page) : 1,
      // type ? type.toLowerCase() : '',
      body.industries ? body.industries : [],
      body.startDate ? new Date(body.startDate) : null,
      body.endDate ? new Date(body.endDate) : null,
      body.isFollowedByMe?body.isFollowedByMe:null,
    );
    if (!result.success) {
      throw new BadRequestException(result.message);
    }
    return {
      message: result.message,
      data: result.data,
      total: result.total,
      page: result.page,
      limit: result.limit,
      pages: result.pages,
    };
  }

  @Get('dashboard/:id')
  @UseGuards(JwtGuard2)
  async getEventDetails(
    @TokenDecoder() user: DecodedUser,
    @Param('id') id: string,
    @Body() body: GetDashboardDto,
  ) {
    if (!mongoose.isValidObjectId(id)) {
      throw new BadRequestException('Invalid event id');
    }
    const result = await this.authService.getEventCardView(id, user, body);
    // const result = await this.authService.getEventDetails(id, user, body);
    if (!result.success) {
      throw new BadRequestException(result.message);
    }
    return {
      message: result.message,
      event: result.event,
    };
  }

  // @Get('switch/profile')
  // @UseGuards(BusinessProfileGuard)
  // async switchToUserProfile(@TokenDecoder() user: DecodedUser) {
  //   const result = await this.authService.switchToUserProfile(user.id);
  //   if (!result.success) {
  //     throw new BadRequestException(result.message);
  //   }
  //   return {
  //     message: result.message,
  //     user: result.user,
  //     token: result.token,
  //   };
  // }

  @Post('logout')
  @UseGuards(JwtGuard2)
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() req,
    @Query('fcm') fcm: string,
    @TokenDecoder() user: DecodedUser,
  ) {
    const token = req.headers.authorization.split(' ')[1];
    const result = await this.authService.logout(user, token, fcm ? fcm : '');
    if (!result.success) {
      throw new BadRequestException(result.message);
    }
    return {
      message: result.message,
    };
  }

  @Delete('delete')
  @UseGuards(JwtGuard2)
  async deleteAccount(@TokenDecoder() user: DecodedUser) {
    const result = await this.authService.deleteAccount(user);
    if (!result.success) {
      throw new BadRequestException(result.message);
    }
    return {
      message: result.message,
    };
  }

  @Get('preSignedURL')
  @UseGuards(JwtGuard2)
  async getPresignedUrl(@Query('url') url: string) {
    const result = await this.authService.getPreSignedUrl(url);
    if (!result.success) {
      throw new BadRequestException(result.message);
    }
    return {
      message: result.message,
      preSignedUrl: result.url,
    };
  }

  @Post('verify-email')
  @UseGuards(VerifyMailGuard)
  async verifyEmailviaLink(
    @Req() req: Request,
    @TokenDecoder() user: DecodedUser,
  ) {
    const tokenId = req['tokenId'];
    const result = await this.authService.verifyEmailviaLink(user, tokenId);
    if (!result.success) {
      throw new BadRequestException(result.message);
    }
    return {
      message: result.message,
    };
  }

  @Post('password-reset-link')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RateLimitGuard)
  async passwordResetLink(
    @Req() req: Request,
    @Body('email') email: string,
    @Body('userType') userType: string,
  ) {
    const result = await this.authService.passwordResetLink(email, userType);
    if (!result.success) {
      throw new BadRequestException(result.message);
    }
    return { message: result.message };
  }

  @Post('verify-pass-reset')
  @UseGuards(ResetPasswordGuard)
  @HttpCode(HttpStatus.OK)
  async verifyPassReset(
    @Req() req: Request,
    @TokenDecoder() user: DecodedUser,
    @Body('password') password: string,
  ) {
    const tokenId = req['tokenId'];
    const result = await this.authService.verifyPassReset(
      user,
      password,
      tokenId,
    );
    if (!result.success) {
      throw new BadRequestException(result.message);
    }
    return {
      message: result.message,
    };
  }

  @Post('resendVerificationLink/:id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RateLimitGuard)
  async resendVerificationLink(
    @Req() req: Request,
    @Param('id') id: string,
    @Query('userType') userType: string,
  ) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid ObjectId');
    }
    const result = await this.authService.resendVerificationLink(id, userType);
    if (!result.success) {
      throw new BadRequestException(result.message);
    }
    return { message: result.message };
  }

  @Get('getProfile')
  @UseGuards(JwtGuard2)
  async getProfile(@TokenDecoder() user: DecodedUser) {
    console.log('Entered Controllerrrr!!!');
    const result = await this.authService.getProfile(user.id, user.userType);
    if (!result.success) {
      throw new BadRequestException(result.message);
    }
    return {
      message: result.message,
      user: result.user,
      resourceAndPrivileges: result.resourceAndPrivileges,
    };
  }

  @Get('autoGeneratePassword')
  @UseGuards(JwtGuard2)
  async autoGeneratePassword() {
    return this.authService.autoGeneratePassword();
  }

  @Post('dashboardSearch')
  @UseGuards(JwtGuard2)
  @HttpCode(HttpStatus.OK)
  async dashboardSearch(
    @Body() data: DashboardSearchDto,
    @TokenDecoder() user: DecodedUser,
  ) {
    let result = null;
    if (data.type === 'all') {
      result = await this.authService.dashboardAllSearch(user, data);
    } else {
      result = await this.authService.dashboardSearch(user, data);
    }

    if (!result.success) {
      throw new BadRequestException(result.message);
    }
    return {
      message: result.message,
      data: result.data,
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }
}
