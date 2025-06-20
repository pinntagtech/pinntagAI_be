import {
  CanActivate,
  ExecutionContext,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Request } from 'express';
import { Model } from 'mongoose';
import { User, UserDocument } from 'src/user/models/user.model';
import { JwtPayload } from '../interfaces/tokenPayload.interface';
// import {
//   BusinessProfile,
//   BusinessProfileDocument,
// } from 'src/business-profile/models/businessProfile.model';
import { Roles } from 'src/roles/enums/roles.enum';
import { UserTypes } from 'src/enums/auth.enums';
import { Business, BusinessDocument } from 'src/business/model/business.model';
import {
  BusinessUser,
  BusinessUserDocument,
} from 'src/business/model/businessUser.model';
import { Admin, AdminDocument } from 'src/admin/models/admin.model';

@Injectable()
export class RefreshGuard implements CanActivate {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    // @InjectModel(BusinessProfile.name)
    // private readonly businessProfileModel: Model<BusinessProfileDocument>,
    @InjectModel(Business.name)
    private readonly businessModel: Model<BusinessDocument>,
    @InjectModel(BusinessUser.name) private readonly businessUserModel: Model<BusinessUserDocument>,
    @InjectModel(Admin.name) private readonly adminModel: Model<AdminDocument>,

    private jwtService: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      return response.status(HttpStatus.UNAUTHORIZED).json({
        message: 'Unauthorised. Please provide a token.',
      });
    }
    // try {
    const payload: JwtPayload = await this.jwtService.verifyAsync(token, {
      secret: process.env.JWT_SECRET,
      ignoreExpiration: true,
    });
    console.log('payload:---', payload);
    if (!payload.userType) {
      throw new UnauthorizedException('Unauthorised. Invalid Token.');
    }
    if (payload.userType === UserTypes.ADMIN) {
      const admin = await this.adminModel.findById(payload.id);
      if (!admin) {
        throw new UnauthorizedException('Unauthorised. User does not exist.');
      }
      // const role = await this.roleModel.findOne({
      //   _id: new mongoose.Types.ObjectId(payload.role),
      //   belongsTo: RoleBelonging.SYSTEM,
      // });

      request['isGuest'] = false;
      request['isBusiness'] = false;
      request['isAdmin'] = true;
      request['user'] = admin;
      return true;
    } else if (payload.userType === UserTypes.BUSINESS) {
      const businessUser = await this.businessUserModel.findById(payload.id);
      if (!businessUser) {
        throw new UnauthorizedException(
          'Unauthorised. Business User does not exist.',
        );
      }
      // const role = await this.roleModel.findOne({
      //   _id: new mongoose.Types.ObjectId(payload.role),
      // });
      const business = await this.businessModel.findById(
        payload.businessProfile,
      );

      request['isGuest'] = false;
      request['isBusiness'] = true;
      request['isAdmin'] = false;
      request['user'] = businessUser;
      request['business'] = business;
      if (business && business.id) {
        request['businessProfile'] = payload.businessProfile;
      }
      request['businessUser'] = businessUser.id;
      request['token'] = token;
      return true;
    } else if (payload.userType === UserTypes.USER) {
      console.log('Payload id:', payload.id);
      const user = await this.userModel.findById(payload.id);
      if (!user) {
        throw new UnauthorizedException('Unauthorised. User does not exist.');
      }
      request['isGuest'] = false;
      request['isBusiness'] = false;
      request['isAdmin'] = false;
      request['user'] = user;
      return true;
    } else if (payload.userType === UserTypes.GUEST) {
      return true;
    }

    return true;
  }
  // }
  //     catch (error) {
  //       console.log('error message:---', error);
  //       if (error.name == 'TokenExpiredError') {
  //         return response.status(HttpStatus.UNAUTHORIZED).json({
  //           message: 'Token expired',
  //         });
  //       } else if (error.name == 'UnauthorizedException') {
  //         return response.status(HttpStatus.UNAUTHORIZED).json({
  //           message: error.message,
  //         });
  //       }
  //     }
  //     return true;
  //   }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
