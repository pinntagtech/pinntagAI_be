import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Res,
  UseGuards,
  Req,
  HttpStatus,
  Patch,
  UseInterceptors,
  UploadedFile,
  Delete,
  Query,
} from '@nestjs/common';
import { UserService } from './user.service';
import { Request, Response } from 'express';
import { UserGuard } from 'src/auth/guards/user.guard';
import { TokenDecoder } from 'src/decorators/tokenDecoder.decorator';
import { DecodedUser } from 'src/auth/interfaces/decodedUser.interface';
import { ChangePasswordDto } from './dto/changePassword.dto';
import { FileInterceptor } from '@nestjs/platform-express/multer';
import { UpdateProfileDto } from './dto/updateProfile.dto';
import { ProfileTypes } from 'src/enums/user.enum';
import { User } from './models/user.model';
import { FollowDto } from './dto/follow.dto';
import { JwtGuard } from 'src/auth/guards/jwt.guard';
import { ContactUsDto } from './dto/contact-us.dto';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { AdminGuard } from 'src/auth/guards/admin.guard';

@Controller('v1/user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('list')
  @UseGuards(AdminGuard)
  async getUsers(@Res() res: Response) {
    const result = await this.userService.getUsers();
    return res.status(HttpStatus.OK).json({
      message: 'Users fetched successfully',
      users: result,
    });
  }

  @Get('my/refferal')
  @UseGuards(UserGuard)
  async getMyRefferalCode(
    @Res() res: Response,
    @TokenDecoder() user: DecodedUser,
  ) {
    const result = await this.userService.getMyRefferalCode(user.id);
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

  @Get('payment-methods')
  @UseGuards(UserGuard)
  async getPaymentMethods(
    @Res() res: Response,
    @TokenDecoder() user: DecodedUser,
  ) {
    const result = await this.userService.getPaymentMethods(user.id);
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

  @Get('subscription-products')
  @UseGuards(UserGuard)
  async getSubscriptionProducts(@Res() res: Response) {
    const result = await this.userService.getSubscriptionProducts();
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

  @Post('subscription')
  @UseGuards(UserGuard)
  async createSubscription(
    @Res() res: Response,
    @Body() body: CreateSubscriptionDto,
    @TokenDecoder() user: DecodedUser,
  ) {
    const result = await this.userService.createSubscription(user.id, body);
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

  @Post('cancel-subscription/:id')
  @UseGuards(UserGuard)
  async cancelSubscription(
    @Res() res: Response,
    @Param('id') id: string,
    @TokenDecoder() user: DecodedUser,
  ) {
    const result = await this.userService.cancelSubscription(user.id, id);
    const status = result.success ? HttpStatus.OK : HttpStatus.BAD_REQUEST;
    return res.status(status).json({
      message: result.message,
    });
  }

  @Get('refferal/:code')
  @UseGuards(UserGuard)
  async UseRefferalCode(
    @Res() res: Response,
    @Param('code') code: string,
    @TokenDecoder() user: DecodedUser,
  ) {
    const result = await this.userService.useRefferalCode(code, user.id);
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

  @Get('profile')
  @UseGuards(UserGuard)
  async getProfile(
    @Req() req: Request,
    @Res() res: Response,
    @TokenDecoder() user: DecodedUser,
  ) {
    const result = await this.userService.getProfile(user.id);
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

  @Patch('change/password')
  @UseGuards(UserGuard)
  async changePassword(
    @Req() req: Request,
    @Res() res: Response,
    @Body() body: ChangePasswordDto,
    @TokenDecoder() user: DecodedUser,
  ) {
    const result = await this.userService.changePassword(body, user.id);
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

  @Post('update/profilePhoto')
  @UseGuards(UserGuard)
  @UseInterceptors(
    FileInterceptor(
      'profilePhoto',
      // , {
      //   dest: './uploads',
      //   fileFilter: imageFileFilter,
      //   storage: diskStorage({
      //     destination: './uploads',
      //     filename: editFileName,
      //   }),
      //   //Setting file size limit to 1 MB
      //   limits: { fileSize: 1000000 },
      // }
    ),
  )
  @UseGuards(UserGuard)
  async updateProfilePhoto(
    @Req() req: Request,
    @Res() res: Response,
    @UploadedFile() file: Express.Multer.File,
    @TokenDecoder() user: DecodedUser,
  ) {
    try {
      if (req['invalidFile']) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          message: 'Only images are allowed.',
        });
      }
      if (!file) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          message: 'Please provide a file to upload.',
        });
      } else {
        // const path = `${req.protocol}://${req.hostname}:${process.env.PORT}/${file.path}`;
        const result = await this.userService.updateProfilePhoto(user.id, file);
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
    } catch (error) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: error.message,
      });
    }
  }

  @Post('update/profile')
  @UseGuards(UserGuard)
  async updateProfile(
    @Res() res: Response,
    @Body() body: UpdateProfileDto,
    @TokenDecoder() user: DecodedUser,
  ) {
    const isBodyEmpty = Object.keys(body).length === 0;
    if (isBodyEmpty) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: 'Please provide data to update.',
      });
    }
    const result = await this.userService.updateProfile(user.id, body);
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

  @Get('search/:query')
  @UseGuards(JwtGuard)
  async searchUser(
    @Res() res: Response,
    @Param('query') query: string,
    @Query('emailOnly') emailOnly: string,
    @TokenDecoder() user: DecodedUser,
  ) {
    let onlyByEmail = false;
    if (emailOnly === 'true') {
      onlyByEmail = true;
    } else if (emailOnly === 'false') {
      onlyByEmail = false;
    }
    const result = await this.userService.searchUser(
      query,
      user.id.toString(),
      onlyByEmail,
    );
    if (result.success) {
      return res.status(HttpStatus.OK).json({
        message: result.message,
        users: result.users,
      });
    } else {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: result.message,
      });
    }
  }

  @Patch('follow')
  @UseGuards(UserGuard)
  async follow(
    @Req() req: Request,
    @Res() res: Response,
    @Body() body: FollowDto,
  ) {
    const { profileType, id } = body;
    if (!ProfileTypes.includes(profileType)) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: 'Invalid profile type',
      });
    } else {
      const result = await this.userService.followUser(
        id,
        profileType,
        req.user['_id'],
        User.name,
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
  }

  @Patch('unfollow/:id')
  @UseGuards(UserGuard)
  async unfollow(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id') id: string,
  ) {
    const result = await this.userService.unfollowUser(id, req.user['_id']);
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

  @Get('get/followers')
  @UseGuards(UserGuard)
  async getFollowers(@Req() req: Request, @Res() res: Response) {
    const result = await this.userService.getFollowers(req.user['_id']);
    if (result.success) {
      return res.status(HttpStatus.OK).json({
        message: result.message,
        count: result.count,
        followers: result.followers,
      });
    } else {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: result.message,
      });
    }
  }

  @Get('get/following')
  @UseGuards(UserGuard)
  async getFollowing(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id') id: string,
  ) {
    const result = await this.userService.getFollowing(req.user['_id']);
    if (result.success) {
      return res.status(HttpStatus.OK).json({
        message: result.message,
        count: result.count,
        following: result.following,
      });
    } else {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: result.message,
      });
    }
  }

  @Patch('block/:id')
  @UseGuards(UserGuard)
  async blockUser(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id') id: string,
  ) {
    const result = await this.userService.blockUser(id, req.user['_id']);
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

  @Get('transactions')
  @UseGuards(UserGuard)
  async getTransactions(
    @Req() req: Request,
    @Res() res: Response,
    @TokenDecoder() user: DecodedUser,
  ) {
    const result = await this.userService.getTransactions(user.id);
    return res.status(HttpStatus.OK).json({
      message: result.message,
      transactions: result.transactions,
    });
  }

  @Post('contact-us')
  @UseGuards(UserGuard)
  async contactUs(
    @Res() res: Response,
    @Body() body: ContactUsDto,
    @TokenDecoder() user: DecodedUser,
  ) {
    const result = await this.userService.contactUs(user.id, body);
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

  @Delete('delete/account')
  @UseGuards(UserGuard)
  async deleteAccount(@Req() req: Request, @Res() res: Response) {
    const result = await this.userService.deleteAccount(req.user['_id']);
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
}
