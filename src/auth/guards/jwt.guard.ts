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
import { TokenTypes, allowedRoutesForGuest } from 'src/enums/auth.enums';
import {
  BusinessProfile,
  BusinessProfileDocument,
} from 'src/business-profile/models/businessProfile.model';
import { Admin, AdminDocument } from 'src/admin/models/admin.model';
import { Roles } from 'src/roles/enums/roles.enum';

@Injectable()
export class JwtGuard implements CanActivate {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(BusinessProfile.name)
    private readonly businessProfileModel: Model<BusinessProfileDocument>,
    @InjectModel(Role.name) private readonly roleModel: Model<RoleDocument>,
    @InjectModel(GuestSession.name)
    private readonly guestSessionModel: Model<GuestSessionDocument>,
    @InjectModel(Token.name) private readonly tokenModel: Model<TokenDocument>,
    @InjectModel(Admin.name) private readonly adminModel: Model<AdminDocument>,
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
      const payload: JwtPayload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
      });
      // console.log('payload:---', payload);

      if (payload.role && payload.role == Roles.GUEST) {
        let path = request.route.path;
        const ifDashboardById = path.split('/v1/auth/dashboard/');
        if (ifDashboardById.length > 1 && ifDashboardById[1] !== 'map-view') {
          path = '/v1/auth/dashboard';
        }
        if (!allowedRoutesForGuest.includes(path)) {
          // return response.status(403).json({
          //   message: 'The service is not accessible for guests',
          // });
          throw new ForbiddenException(
            'The service is not accessible for guests',
          );
        } else {
          const foundSession = await this.guestSessionModel.findOne({
            _id: new mongoose.Types.ObjectId(payload.id),
          });
          if (!foundSession) {
            // return response.status(HttpStatus.UNAUTHORIZED).json({
            //   message:
            //     'The login session has been expired. Please login again',
            // });
            throw new ForbiddenException(
              'The login session has been expired. Please login again',
            );
          } else if (foundSession.isBlocked) {
            // return response.status(HttpStatus.UNAUTHORIZED).json({
            //   message: 'Sorry. You are blocked by admin',
            // });
            throw new UnauthorizedException('Sorry. You are blocked by admin');
          } else {
            const foundTokenDoc = await this.tokenModel.findOne({
              token,
              type: TokenTypes.GUEST_USER,
              isBlacklisted: false,
            });
            if (!foundTokenDoc) {
              throw new UnauthorizedException(
                'Token expired please login again',
              );
              // return response.status(HttpStatus.UNAUTHORIZED).json({
              //   message: 'Token expired please login again',
              // });
            } else {
              request['isGuest'] = true;
              request['sessionId'] = foundSession.id;
              return true;
            }
          }
        }
      }
      if (!payload.role) {
        // return response.status(HttpStatus.UNAUTHORIZED).json({
        //   message: 'Invalid token. Please login again.',
        // });
        throw new UnauthorizedException('Invalid token. Please login again.');
      } else {
        const user = JSON.parse(
          JSON.stringify(
            await this.userModel.findById(payload.id).populate('role').exec(),
          ),
        );
        const admin = JSON.parse(
          JSON.stringify(
            await this.adminModel.findById(payload.id, { _id: 1, email: 1 }),
          ),
        );
        if (user) {
          const tokenDoc = await this.tokenModel.findOne({
            token,
            userId: new mongoose.Types.ObjectId(payload.id),
            type: TokenTypes.ACCESS,
            isBlacklisted: false,
          });
          if (!tokenDoc) {
            throw new UnauthorizedException('Token expired please login again');
          }
          // console.log('user in guard:---', user);
          if (payload.role == Roles.BUSINESS_PROFILE) {
            const businessProfile = await this.businessProfileModel.findById(
              // payload.businessProfile,
              payload.id,
            );
            delete user.isBusiness;
            request['isBusiness'] = true;
            request['user'] = user;
            request['businessProfile'] = businessProfile.id;
          } else {
            delete user.isBusiness;
            request['user'] = user;
            request['isBusiness'] = false;
          }
        } else if (admin) {
          request['user'] = admin;
          request['isAdmin'] = true;
          // return response.status(HttpStatus.UNAUTHORIZED).json({
          // message: 'Invalid Token. User not found',
          // });
          // throw new UnauthorizedException('Invalid Token. User not found');
        } else {
          // return response.status(HttpStatus.UNAUTHORIZED).json({
          // message: 'Invalid Token. User not found',
          // });
          // throw new UnauthorizedException('Invalid Token. User not found');
        }
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
