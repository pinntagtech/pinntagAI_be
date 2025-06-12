import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Request } from 'express';
import mongoose, { Model } from 'mongoose';
import { Role, RoleDocument } from 'src/roles/models/roles.model';
import { User, UserDocument } from 'src/user/models/user.model';
import {
  GuestSession,
  GuestSessionDocument,
} from '../models/guestSession.model';
import { JwtPayload } from '../interfaces/tokenPayload.interface';
import { Token, TokenDocument } from '../models/token.model';
import {
  TokenTypes,
  UserTypes,
  allowedRoutesForGuest,
} from 'src/enums/auth.enums';
// import {
//   BusinessProfile,
//   BusinessProfileDocument,
// } from 'src/business-profile/models/businessProfile.model';
import { Admin, AdminDocument } from 'src/admin/models/admin.model';
import { RoleBelonging, Roles } from 'src/roles/enums/roles.enum';
import {
  BusinessUser,
  BusinessUserDocument,
} from 'src/business/model/businessUser.model';
import { Business, BusinessDocument } from 'src/business/model/business.model';

@Injectable()
export class JwtGuard2 implements CanActivate {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    // @InjectModel(BusinessProfile.name)
    // private readonly businessProfileModel: Model<BusinessProfileDocument>,
    @InjectModel(Role.name) private readonly roleModel: Model<RoleDocument>,
    @InjectModel(GuestSession.name)
    private readonly guestSessionModel: Model<GuestSessionDocument>,
    @InjectModel(Token.name) private readonly tokenModel: Model<TokenDocument>,
    @InjectModel(Admin.name) private readonly adminModel: Model<AdminDocument>,
    @InjectModel(BusinessUser.name)
    private readonly businessUserModel: Model<BusinessUserDocument>,
    @InjectModel(Business.name)
    private readonly businessModel: Model<BusinessDocument>,
    private jwtService: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException('Unauthorised. Please provide a token.');
    }
    try {
      const tokenDoc = await this.tokenModel.findOne({
        token,
        type: TokenTypes.ACCESS,
      });
      if (!tokenDoc) {
        throw new UnauthorizedException('Unauthorised. Token expired.');
      }

      const payload: JwtPayload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
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
    } catch (error) {
      console.log('error message:---', error);
      if (error.name == 'TokenExpiredError') {
        // return response.status(HttpStatus.UNAUTHORIZED).json({
        //   message: 'Token expired',
        // });
        throw new UnauthorizedException('Token expired');
      } else if (error.name == 'UnauthorizedException') {
        // return response.status(HttpStatus.UNAUTHORIZED).json({
        //   message: error.message,
        // });
        throw new UnauthorizedException('UnauthorizedException');
      }
      // return response.status(HttpStatus.UNAUTHORIZED).json({
      //   message: 'Invalid token. Please login again.',
      // });
      throw new UnauthorizedException('Invalid token. Please login again.');
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
