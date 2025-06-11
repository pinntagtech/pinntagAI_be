import {
  CanActivate,
  ExecutionContext,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { JwtPayload } from '../interfaces/tokenPayload.interface';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { User, UserDocument } from 'src/user/models/user.model';
// import {
//   BusinessProfile,
//   BusinessProfileDocument,
// } from 'src/business-profile/models/businessProfile.model';
import { Token, TokenDocument } from '../models/token.model';
import { TokenTypes } from 'src/enums/auth.enums';
import { Business, BusinessDocument } from 'src/business/model/business.model';

@Injectable()
export class BusinessProfileGuard implements CanActivate {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Business.name) private readonly businessModel: Model<BusinessDocument>,
    @InjectModel(Token.name) private readonly tokenModel: Model<TokenDocument>,
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
    try {
      const payload: JwtPayload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
      });
      // console.log('payloaddd', payload);

      if (!payload) {
        return response.status(HttpStatus.UNAUTHORIZED).json({
          message: 'Invalid token',
        });
      }
      // if (!payload.businessProfile || payload.businessProfile == '') {
      //   return response.status(403).json({
      //     message: 'The service is only accesible for business profiles',
      //   });
      // }
      // if (!payload.role || payload.role != Roles.BUSINESS_PROFILE) {
      //   return response.status(403).json({
      //     message: 'The service is only accesible for business profiles',
      //   });
      // } else {
      const user = JSON.parse(
        JSON.stringify(
          await this.userModel.findById(payload.id).populate('role').exec(),
        ),
      );
      if (!user) {
        return response.status(HttpStatus.UNAUTHORIZED).json({
          message: 'User not found',
        });
      } else {
        const businessProfile = await this.businessModel.findById(
          // payload.businessProfile,
          payload.id,
        );
        if (!businessProfile) {
          return response.status(HttpStatus.UNAUTHORIZED).json({
            message: 'Business profile not found',
          });
        }
        // else if (
        //   businessProfile.authorisedUser.toString() != user._id.toString()
        // ) {
        //   return response.status(HttpStatus.UNAUTHORIZED).json({
        //     message: 'You are not authorised to access this business profile',
        //   });
        // } else {
        const tokenDoc = await this.tokenModel.findOne({
          token,
          userId: new mongoose.Types.ObjectId(payload.id),
          type: TokenTypes.ACCESS,
          isBlacklisted: false,
        });
        if (!tokenDoc) {
          return response.status(HttpStatus.UNAUTHORIZED).json({
            message: 'Token expired please login again',
          });
        } else {
          request['user'] = user;
          request['isBusiness'] = true;
          request['businessProfile'] = businessProfile.id;
          return true;
        }
        // }
      }
      // }
    } catch (error) {
      console.log('error message:---', error);
      if (error.name == 'TokenExpiredError') {
        return response.status(HttpStatus.UNAUTHORIZED).json({
          message: 'Token expired',
        });
      } else if (error.name == 'UnauthorizedException') {
        return response.status(HttpStatus.UNAUTHORIZED).json({
          message: error.message,
        });
      }
      return response.status(HttpStatus.UNAUTHORIZED).json({
        message: 'Invalid token. Please login again.',
      });
    }
  }
  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
