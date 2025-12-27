import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
  Patch,
  UseInterceptors,
  UploadedFile,
  Delete,
  Query,
  BadRequestException,
  Put,
} from '@nestjs/common';
import { UserService } from './user.service';
import { Request } from 'express';
import { UserGuard } from 'src/auth/guards/user.guard';
import { TokenDecoder } from 'src/decorators/tokenDecoder.decorator';
import { DecodedUser } from 'src/auth/interfaces/decodedUser.interface';
import { ChangePasswordDto } from './dto/changePassword.dto';
import { FileInterceptor } from '@nestjs/platform-express/multer';
import { UpdateProfileDto } from './dto/updateProfile.dto';
import { MuteDuration, ProfileTypes } from 'src/enums/user.enum';
import { FollowDto } from './dto/follow.dto';
import { JwtGuard } from 'src/auth/guards/jwt.guard';
import { ContactUsDto } from './dto/contact-us.dto';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { JwtGuard2 } from 'src/auth/guards2/jwt2.guard';
import { User } from './models/user.model';
import { UserTypes } from 'src/enums/auth.enums';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // @Get('my/refferal')
  // @UseGuards(UserGuard)
  // async getMyRefferalCode(@TokenDecoder() user: DecodedUser) {
  //   const result = await this.userService.getMyRefferalCode(user.id);
  //   if (result.success) {
  //     return {
  //       message: result.message,
  //       data: result.data,
  //     };
  //   } else {
  //     throw new BadRequestException(result.message);
  //   }
  // }

  // @Get('payment-methods')
  // @UseGuards(UserGuard)
  // async getPaymentMethods(@TokenDecoder() user: DecodedUser) {
  //   const result = await this.userService.getPaymentMethods(user.id);
  //   if (result.success) {
  //     return {
  //       message: result.message,
  //       data: result.data,
  //     };
  //   } else {
  //     throw new BadRequestException(result.message);
  //   }
  // }

  // @Get('subscription-products')
  // @UseGuards(UserGuard)
  // async getSubscriptionProducts() {
  //   const result = await this.userService.getSubscriptionProducts();
  //   if (result.success) {
  //     return {
  //       message: result.message,
  //       data: result.data,
  //     };
  //   } else {
  //     throw new BadRequestException(result.message);
  //   }
  // }

  // @Post('subscription')
  // @UseGuards(UserGuard)
  // async createSubscription(
  //   @Body() body: CreateSubscriptionDto,
  //   @TokenDecoder() user: DecodedUser,
  // ) {
  //   const result = await this.userService.createSubscription(user.id, body);
  //   if (result.success) {
  //     return {
  //       message: result.message,
  //       data: result.data,
  //     };
  //   } else {
  //     throw new BadRequestException(result.message);
  //   }
  // }

  // @Post('cancel-subscription/:id')
  // @UseGuards(UserGuard)
  // async cancelSubscription(
  //   @Param('id') id: string,
  //   @TokenDecoder() user: DecodedUser,
  // ) {
  //   const result = await this.userService.cancelSubscription(user.id, id);
  //   if (result.success) {
  //     return {
  //       message: result.message,
  //     };
  //   } else {
  //     throw new BadRequestException(result.message);
  //   }
  // }

  // @Get('refferal/:code')
  // @UseGuards(UserGuard)
  // async UseRefferalCode(
  //   @Param('code') code: string,
  //   @TokenDecoder() user: DecodedUser,
  // ) {
  //   const result = await this.userService.useRefferalCode(code, user.id);
  //   if (result.success) {
  //     return {
  //       message: result.message,
  //       data: result.data,
  //     };
  //   } else {
  //     throw new BadRequestException(result.message);
  //   }
  // }

  @Get('profile')
  @UseGuards(JwtGuard2)
  async getProfile(@Req() req: Request, @TokenDecoder() user: DecodedUser) {
    const result = await this.userService.getProfile(user.id);
    if (result.success) {
      return {
        message: result.message,
        user: result.user,
      };
    } else {
      throw new BadRequestException(result.message);
    }
  }

  // @Patch('change/password')
  // @UseGuards(UserGuard)
  // async changePassword(
  //   @Req() req: Request,
  //   @Body() body: ChangePasswordDto,
  //   @TokenDecoder() user: DecodedUser,
  // ) {
  //   const result = await this.userService.changePassword(body, user.id);
  //   if (result.success) {
  //     return {
  //       message: result.message,
  //       user: result.user,
  //     };
  //   } else {
  //     throw new BadRequestException(result.message);
  //   }
  // }

  @Post('update/profilePhoto')
  @UseGuards(JwtGuard2)
  @UseInterceptors(FileInterceptor('profilePhoto'))
  async updateProfilePhoto(
    @Req() req: Request,
    @UploadedFile() file: Express.Multer.File,
    @TokenDecoder() user: DecodedUser,
  ) {
    if (!file) {
      throw new BadRequestException('Please provide a file to upload.');
    }
    const result = await this.userService.updateProfilePhoto(user.id, file);
    if (result.success) {
      return {
        message: result.message,
        user: result.user,
      };
    } else {
      throw new BadRequestException(result.message);
    }
  }

  @Post('remove/profilePhoto')
  @UseGuards(JwtGuard2)
  async removeProfilePhoto(
    @Req() req: Request,
    @TokenDecoder() user: DecodedUser,
  ) {
    const result = await this.userService.removeProfilePhoto(user.id);
    if (result.success) {
      return {
        message: result.message,
        user: result.user,
      };
    } else {
      throw new BadRequestException(result.message);
    }
  }

  @Post('update/profile')
  @UseGuards(UserGuard)
  async updateProfile(
    @Body() body: UpdateProfileDto,
    @TokenDecoder() user: DecodedUser,
  ) {
    const isBodyEmpty = Object.keys(body).length === 0;
    if (isBodyEmpty) {
      throw new BadRequestException('Please provide data to update.');
    }
    const result = await this.userService.updateProfile(user.id, body);
    if (result.success) {
      return {
        message: result.message,
        user: result.user,
      };
    } else {
      throw new BadRequestException(result.message);
    }
  }

  // @Get('search/:query')
  // @UseGuards(JwtGuard)
  // async searchUser(
  //   @Param('query') query: string,
  //   @Query('emailOnly') emailOnly: string,
  //   @TokenDecoder() user: DecodedUser,
  // ) {
  //   const onlyByEmail = emailOnly === 'true';
  //   const result = await this.userService.searchUser(
  //     query,
  //     user.id.toString(),
  //     onlyByEmail,
  //   );
  //   if (result.success) {
  //     return {
  //       message: result.message,
  //       users: result.users,
  //     };
  //   } else {
  //     throw new BadRequestException(result.message);
  //   }
  // }

  @Patch('follow')
  @UseGuards(JwtGuard2)
  async follow(@Req() req: Request, @Body() body: FollowDto) {
    console.log('Follow request body:', body);
    const { profileType, id } = body;
    if (!ProfileTypes.includes(profileType)) {
      throw new BadRequestException('Invalid profile type');
    }
    const result = await this.userService.followUser(
      id,
      profileType,
      req.user['_id'],
      User.name,
    );
    if (result.success) {
      return {
        message: result.message,
      };
    } else {
      throw new BadRequestException(result.message);
    }
  }

  @Patch('unfollow/:id')
  @UseGuards(JwtGuard2)
  async unfollow(@Req() req: Request, @Param('id') id: string) {
    const result = await this.userService.unfollowUser(id, req.user['_id']);
    if (result.success) {
      return {
        message: result.message,
      };
    } else {
      throw new BadRequestException(result.message);
    }
  }

  @Get('get/followers')
  @UseGuards(JwtGuard2)
  async getFollowers(@Req() req: Request, @TokenDecoder() user: DecodedUser) {
    let userId = user.id;
    if (user.userType === UserTypes.BUSINESS) {
      userId = user.businessProfile;
    }
    const result = await this.userService.getFollowers(userId);
    if (result.success) {
      return {
        message: result.message,
        count: result.count,
        followers: result.followers,
      };
    } else {
      throw new BadRequestException(result.message);
    }
  }

  @Get('get/following')
  @UseGuards(JwtGuard2)
  async getFollowing(@Req() req: Request) {
    const result = await this.userService.getFollowing(req.user['_id']);
    if (result.success) {
      return {
        message: result.message,
        count: result.count,
        following: result.following,
      };
    } else {
      throw new BadRequestException(result.message);
    }
  }

  // @Patch('block/:id')
  // @UseGuards(UserGuard)
  // async blockUser(@Req() req: Request, @Param('id') id: string) {
  //   const result = await this.userService.blockUser(id, req.user['_id']);
  //   if (result.success) {
  //     return {
  //       message: result.message,
  //       user: result.user,
  //     };
  //   } else {
  //     throw new BadRequestException(result.message);
  //   }
  // }

  // @Get('transactions')
  // @UseGuards(UserGuard)
  // async getTransactions(
  //   @Req() req: Request,
  //   @TokenDecoder() user: DecodedUser,
  // ) {
  //   const result = await this.userService.getTransactions(user.id);
  //   return {
  //     message: result.message,
  //     transactions: result.transactions,
  //   };
  // }

  @Post('contact-us')
  @UseGuards(UserGuard)
  async contactUs(
    @Body() body: ContactUsDto,
    @TokenDecoder() user: DecodedUser,
  ) {
    const result = await this.userService.contactUs(user.id, body);
    if (result.success) {
      return {
        message: result.message,
      };
    } else {
      throw new BadRequestException(result.message);
    }
  }

  @Delete('delete/account')
  @UseGuards(UserGuard)
  async deleteAccount(@Req() req: Request) {
    const result = await this.userService.deleteAccount(req.user['_id']);
    if (result.success) {
      return {
        message: result.message,
      };
    } else {
      throw new BadRequestException(result.message);
    }
  }

  @Post('toggle/mute/notifications/:id')
  @UseGuards(JwtGuard2)
  async muteNotifications(
    @TokenDecoder() user: DecodedUser,
    @Param('id') businessId: string,
    @Query('duration') duration: MuteDuration,
  ) {
    const result = await this.userService.muteNotifications(
      user.id,
      businessId,
      duration,
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

  @Put('toggle/checkin-detection')
  @UseGuards(JwtGuard2)
  async toggleCheckInDetection(@TokenDecoder() user: DecodedUser) {
    const result = await this.userService.toggleCheckInDetection(user.id);
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
