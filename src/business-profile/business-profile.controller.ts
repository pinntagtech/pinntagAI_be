import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { BusinessProfileService } from './business-profile.service';
import { UserGuard } from 'src/auth/guards/user.guard';
import { Request, Response } from 'express';
import { createBusinessProfileDto } from './dto/createBusinessProfile.dto';
import { ProfileTypes } from 'src/enums/user.enum';
import { UserService } from 'src/user/user.service';
import { FollowDto } from 'src/user/dto/follow.dto';
import { BusinessProfile } from './models/businessProfile.model';
import { TokenDecoder } from 'src/decorators/tokenDecoder.decorator';
import { DecodedUser } from 'src/auth/interfaces/decodedUser.interface';
import { BusinessProfileGuard } from 'src/auth/guards/business.guard';
import { CreateStaffDto } from './dto/createStaff.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { UpdateBusinessProfileDto } from './dto/updateBusinessProfile.dto';
import { UpdateLocationDto } from './dto/updateLocation.dto';
import { JwtGuard } from 'src/auth/guards/jwt.guard';
import { ConnectFacebookDto } from './dto/connect-facebook.dto';
import mongoose from 'mongoose';
import { CreateSubscriptionDto } from 'src/user/dto/create-subscription.dto';

@Controller('v1/business-profile')
export class BusinessProfileController {
  constructor(
    private readonly businessProfileService: BusinessProfileService,
    private readonly userService: UserService,
  ) {}

  @Post('create')
  @UseGuards(UserGuard)
  async createBusinessProfile(
    @Req() req: Request,
    @Res() res: Response,
    @Body() body: createBusinessProfileDto,
  ) {
    const result = await this.businessProfileService.createBusinessProfile(
      body,
      req.user['_id'],
    );
    if (result.success) {
      return res.status(HttpStatus.CREATED).json({
        message: result.message,
        businessProfile: result.businessProfile,
      });
    } else {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: result.message,
      });
    }
  }

  @Post('update/photo')
  @UseGuards(BusinessProfileGuard)
  @UseInterceptors(
    FileInterceptor(
      'profilePhoto',
      // ,{
      //   dest: './uploads',
      //   fileFilter: imageFileFilter,
      //   storage: diskStorage({
      //     destination: './uploads',
      //     filename: editFileName,
      //   }),
      // }
    ),
  )
  async updateBusinessProfilePhoto(
    @Req() req: Request,
    @Res() res: Response,
    @TokenDecoder() user: DecodedUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const result = await this.businessProfileService.updateProfilePhoto(
      user.businessProfile,
      req.file,
    );
    if (result.success) {
      return res.status(HttpStatus.OK).json({
        message: result.message,
        businessProfile: result.businessProfile,
      });
    } else {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: result.message,
      });
    }
  }

  @Post('update')
  @UseGuards(BusinessProfileGuard)
  async updateBusinessProfile(
    @Res() res: Response,
    @TokenDecoder() user: DecodedUser,
    @Body() body: UpdateBusinessProfileDto,
  ) {
    const result = await this.businessProfileService.updateBusinessProfile(
      user,
      body,
    );
    if (result.success) {
      return res.status(HttpStatus.OK).json({
        message: result.message,
        businessProfile: result.businessProfile,
      });
    } else {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: result.message,
      });
    }
  }

  @Post('add/prorate')
  @UseGuards(BusinessProfileGuard)
  async addLocationsToBusiness(
    @Res() res: Response,
    @TokenDecoder() user: DecodedUser,
    @Body() body: CreateSubscriptionDto,
  ) {
    const result = await this.businessProfileService.addProrateSubscription(
      user.id,
      user.businessProfile,
      body,
    );
    if (result.success) {
      return res.status(HttpStatus.OK).json({
        message: result.message,
        subscription: result.data,
      });
    } else {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: result.message,
      });
    }
  }

  @Get('social/services')
  @UseGuards(BusinessProfileGuard)
  async getActiveSocialServices(
    @Res() res: Response,
    @TokenDecoder() user: DecodedUser,
  ) {
    const result = await this.businessProfileService.getActiveSocialServices(
      user.businessProfile,
    );
    if (result.success) {
      return res.status(HttpStatus.OK).json({
        message: result.message,
        socialServices: result.socialServices,
      });
    } else {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: result.message,
      });
    }
  }

  @Get('locations')
  @UseGuards(BusinessProfileGuard)
  async getLocations(
    @Res() res: Response,
    @TokenDecoder() user: DecodedUser,
    @Param('id') id: string,
  ) {
    const result =
      await this.businessProfileService.getLocationsOfBusinessProfile(
        user.businessProfile,
      );
    if (result.success) {
      return res.status(HttpStatus.OK).json({
        message: result.message,
        locations: result.locations,
      });
    } else {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: result.message,
      });
    }
  }

  @Delete('location/delete/:id')
  @UseGuards(BusinessProfileGuard)
  async deleteBusinessProfileLocation(
    @Res() res: Response,
    @Param('id') id: string,
    @TokenDecoder() user: DecodedUser,
  ) {
    const result =
      await this.businessProfileService.deleteBusinessProfileLocation(
        id,
        user.businessProfile,
      );
    if (result.success) {
      return res.status(HttpStatus.OK).json({
        message: result.message,
        businessProfile: result.updatedProfile,
      });
    } else {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: result.message,
      });
    }
  }

  @Patch('location/update/:id')
  @UseGuards(BusinessProfileGuard)
  async updateLocation(
    @Res() res: Response,
    @Param('id') id: string,
    @TokenDecoder() user: DecodedUser,
    @Body() body: UpdateLocationDto,
  ) {
    const result =
      await this.businessProfileService.updateBusinessProfileLocation(
        id,
        user.businessProfile,
        body,
      );
    if (result.success) {
      return res.status(HttpStatus.OK).json({
        message: result.message,
        location: result.updatedLocation,
      });
    } else {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: result.message,
      });
    }
  }

  @Get('all')
  @UseGuards(UserGuard)
  async getBusinessProfiles(
    @Req() req: Request,
    @Res() res: Response,
    @TokenDecoder() user: DecodedUser,
  ) {
    const result = await this.businessProfileService.getBusinessProfiles(
      user.id,
    );
    if (result.success) {
      return res.status(HttpStatus.OK).json({
        message: result.message,
        businessProfiles: result.businessProfiles,
      });
    } else {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: result.message,
      });
    }
  }

  @Get('switch/:id')
  @UseGuards(UserGuard)
  async switchBusinessProfile(
    @Res() res: Response,
    @Param('id') id: string,
    @TokenDecoder() user: DecodedUser,
  ) {
    const result = await this.businessProfileService.switchToBusinessProfile(
      id,
      user.id,
    );
    if (result.success) {
      return res.status(HttpStatus.OK).json({
        message: result.message,
        businessProfile: result.businessProfile,
        token: result.token,
      });
    } else {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: result.message,
      });
    }
  }

  @Post('connect/facebook')
  @UseGuards(BusinessProfileGuard)
  async connectFacebook(
    @Res() res: Response,
    @TokenDecoder() user: DecodedUser,
    @Body() body: ConnectFacebookDto,
  ) {
    const result = await this.businessProfileService.connectFacebook(
      body.accessToken,
      user,
    );
    if (result.success) {
      return res.status(HttpStatus.OK).json({
        message: result.message,
        businessProfile: result.businessProfile,
      });
    } else {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: result.message,
      });
    }
  }

  @Post('disconnect/facebook')
  @UseGuards(BusinessProfileGuard)
  async disconnectFacebook(
    @Res() res: Response,
    @TokenDecoder() user: DecodedUser,
  ) {
    const result = await this.businessProfileService.disconnectFacebook(user);
    if (result.success) {
      return res.status(HttpStatus.OK).json({
        message: result.message,
        businessProfile: result.businessProfile,
      });
    } else {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: result.message,
      });
    }
  }

  @Get(':id')
  @UseGuards(JwtGuard)
  async getBusinessProfile(
    @Res() res: Response,
    @Param('id') id: string,
    @TokenDecoder() user: DecodedUser,
  ) {
    if (!mongoose.isValidObjectId(id)) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: 'Invalid business profile id',
      });
    }
    const result = await this.businessProfileService.getBusinessProfile(
      id,
      user.id,
    );
    if (result.success) {
      return res.status(HttpStatus.OK).json({
        message: result.message,
        businessProfile: result.businessProfile,
      });
    } else {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: result.message,
      });
    }
  }

  @Patch('follow')
  @UseGuards(BusinessProfileGuard)
  async follow(
    @Res() res: Response,
    @Body() body: FollowDto,
    @TokenDecoder() user: DecodedUser,
  ) {
    const { id, profileType } = body;
    if (!ProfileTypes.includes(profileType)) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: 'Invalid profile type',
      });
    } else {
      const result = await this.userService.followUser(
        id,
        profileType,
        user.id,
        BusinessProfile.name,
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
  @UseGuards(BusinessProfileGuard)
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
  @UseGuards(BusinessProfileGuard)
  async getFollowers(
    @Req() req: Request,
    @Res() res: Response,
    @TokenDecoder() user: DecodedUser,
  ) {
    const result = await this.userService.getFollowers(user.businessProfile);
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
  @UseGuards(BusinessProfileGuard)
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
  @UseGuards(BusinessProfileGuard)
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

  @Post('create/staff/member')
  @UseGuards(BusinessProfileGuard)
  async createStaffMember(
    @Res() res: Response,
    @Body() body: CreateStaffDto,
    @TokenDecoder() user: DecodedUser,
  ) {
    if (body.alreadyExists && !body.id) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: 'Please provide staff member id',
      });
    }
    if (body.id) {
      if (!body.alreadyExists) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          message: 'Please provide alreadyExists as true',
        });
      }
      if (!mongoose.isValidObjectId(body.id)) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          message: 'Invalid staff member id',
        });
      }
    }
    const result = await this.businessProfileService.createStaffMember(
      user.businessProfile,
      body,
    );
    if (result.success) {
      return res.status(HttpStatus.OK).json({
        message: result.message,
        staffMember: result.staffMember,
      });
    } else {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: result.message,
      });
    }
  }

  @Get('staff/members')
  @UseGuards(BusinessProfileGuard)
  async getStaffMembers(
    @Res() res: Response,
    @TokenDecoder() user: DecodedUser,
  ) {
    const result = await this.businessProfileService.getStaffMembers(
      user.businessProfile,
    );
    if (result.success) {
      return res.status(HttpStatus.OK).json({
        message: result.message,
        owner: result.owner,
        staffMembers: result.staffMembers,
      });
    } else {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: result.message,
      });
    }
  }

  @Delete('staff/delete/:id')
  @UseGuards(BusinessProfileGuard)
  async deleteStaffMember(
    @Res() res: Response,
    @Param('id') id: string,
    @TokenDecoder() user: DecodedUser,
  ) {
    const result = await this.businessProfileService.deleteStaffMember(
      id,
      user.businessProfile,
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

  @Get('gallery/data')
  @UseGuards(BusinessProfileGuard)
  async getBusinessGallery(
    @Res() res: Response,
    @TokenDecoder() user: DecodedUser,
  ) {
    const result = await this.businessProfileService.getGallery(
      user.businessProfile,
    );
    if (result.success) {
      return res.status(HttpStatus.OK).json({
        message: result.message,
        gallery: result.gallery,
      });
    } else {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: result.message,
      });
    }
  }

  @Post('gallery/upload')
  @UseGuards(BusinessProfileGuard)
  @UseInterceptors(
    FileInterceptor(
      'image',
      // , {
      //   dest: './uploads',
      //   fileFilter: imageFileFilter,
      //   storage: diskStorage({
      //     destination: './uploads',
      //     filename: editFileName,
      //   }),
      // }
    ),
  )
  async uploadGalleryImage(
    @Res() res: Response,
    @TokenDecoder() user: DecodedUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const result = await this.businessProfileService.uploadGalleryImage(
      user.businessProfile,
      file,
    );
    if (result.success) {
      return res.status(HttpStatus.OK).json({
        message: result.message,
        gallery: result.gallery,
      });
    } else {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: result.message,
      });
    }
  }

  @Delete('gallery/delete/:id')
  @UseGuards(BusinessProfileGuard)
  async deleteGalleryImage(
    @Res() res: Response,
    @Param('id') id: string,
    @TokenDecoder() user: DecodedUser,
  ) {
    const result = await this.businessProfileService.deleteGalleryImage(
      user.businessProfile,
      id,
    );
    if (result.success) {
      return res.status(HttpStatus.OK).json({
        message: result.message,
        gallery: result.gallery,
      });
    } else {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: result.message,
      });
    }
  }

  @Get('transactions/all')
  @UseGuards(BusinessProfileGuard)
  async getTransactions(
    @Res() res: Response,
    @TokenDecoder() user: DecodedUser,
  ) {
    const result = await this.businessProfileService.getTransactions(
      user.businessProfile,
    );
    return res.status(HttpStatus.OK).json({
      message: result.message,
      transactions: result.transactions,
    });
  }

  @Delete('delete/profile')
  @UseGuards(BusinessProfileGuard)
  async deleteBusinessProfile(
    @Res() res: Response,
    @TokenDecoder() user: DecodedUser,
  ) {
    const result = await this.businessProfileService.deleteBusinessProfile(
      user.id,
      user.businessProfile,
    );
    if (result.success) {
      return res.status(HttpStatus.OK).json({
        message: result.message,
        businessProfile: result.businessProfile,
      });
    }
    return res.status(HttpStatus.BAD_REQUEST).json({
      message: result.message,
    });
  }

  @Patch('cancel/delete/profile')
  @UseGuards(BusinessProfileGuard)
  async cancelDeleteBusinessProfile(
    @Res() res: Response,
    @TokenDecoder() user: DecodedUser,
  ) {
    const result =
      await this.businessProfileService.cancelDeleteBusinessProfile(
        user.id,
        user.businessProfile,
      );
    if (result.success) {
      return res.status(HttpStatus.OK).json({
        message: result.message,
        businessProfile: result.businessProfile,
      });
    }
    return res.status(HttpStatus.BAD_REQUEST).json({
      message: result.message,
    });
  }

  @Delete('delete/profile/:id')
  @UseGuards(UserGuard)
  async deleteBusinessProfileById(
    @Res() res: Response,
    @Param('id') id: string,
    @TokenDecoder() user: DecodedUser,
  ) {
    if (!mongoose.isValidObjectId(id)) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: 'Invalid business profile id',
      });
    }
    const result = await this.businessProfileService.deleteBusinessProfile(
      user.id,
      id,
    );
    if (result.success) {
      return res.status(HttpStatus.OK).json({
        message: result.message,
        businessProfile: result.businessProfile,
      });
    }
    return res.status(HttpStatus.BAD_REQUEST).json({
      message: result.message,
    });
  }

  @Patch('cancel/delete/profile/:id')
  @UseGuards(UserGuard)
  async cancelDeleteBusinessProfileById(
    @Res() res: Response,
    @Param('id') id: string,
    @TokenDecoder() user: DecodedUser,
  ) {
    if (!mongoose.isValidObjectId(id)) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: 'Invalid business profile id',
      });
    }
    const result =
      await this.businessProfileService.cancelDeleteBusinessProfile(
        user.id,
        id,
      );
    if (result.success) {
      return res.status(HttpStatus.OK).json({
        message: result.message,
        businessProfile: result.businessProfile,
      });
    }
    return res.status(HttpStatus.BAD_REQUEST).json({
      message: result.message,
    });
  }
}
