import {
  CanActivate,
  ExecutionContext,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Request } from 'express';
import { Model } from 'mongoose';
import { User, UserDocument } from 'src/user/models/user.model';
import { JwtPayload } from '../interfaces/tokenPayload.interface';
import {
  BusinessProfile,
  BusinessProfileDocument,
} from 'src/business-profile/models/businessProfile.model';
import { Roles } from 'src/roles/enums/roles.enum';

@Injectable()
export class RefreshGuard implements CanActivate {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(BusinessProfile.name)
    private readonly businessProfileModel: Model<BusinessProfileDocument>,
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
    console.log('payloadghgjgjfdkmd:---', payload);
    if (!payload.role) {
      return response.status(HttpStatus.UNAUTHORIZED).json({
        message: 'Invalid token. Please login again.',
      });
    } else {
      const user = JSON.parse(
        JSON.stringify(
          await this.userModel.findById(payload.id).populate('role').exec(),
        ),
      );
      if (!user) {
        return response.status(HttpStatus.UNAUTHORIZED).json({
          message: 'Invalid Token. User not found',
        });
      } else {
        if (payload.role == Roles.BUSINESS_PROFILE) {
          const businessProfile = await this.businessProfileModel.findById(
            payload.businessProfile,
          );
          delete user.isBusiness;
          request['user'] = user;
          request['isBusiness'] = true;
          request['businessProfile'] = businessProfile.id;
        } else {
          delete user.isBusiness;
          request['user'] = user;
          request['isBusiness'] = false;
        }
      }
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
