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
import { Roles } from 'src/roles/enums/roles.enum';

@Injectable()
export class UserGuard implements CanActivate {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Role.name) private readonly roleModel: Model<RoleDocument>,
    @InjectModel(GuestSession.name)
    private readonly guestSessionModel: Model<GuestSessionDocument>,
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
      if (payload.role && payload.role == Roles.GUEST) {
        if (!allowedRoutesForGuest.includes(request.route.path)) {
          return response.status(403).json({
            message: 'The service is only accesible for users',
          });
        } else {
          const foundSession = await this.guestSessionModel.findOne({
            _id: new mongoose.Types.ObjectId(payload.id),
          });
          if (!foundSession) {
            return response.status(HttpStatus.UNAUTHORIZED).json({
              message: 'The login session has been expired. Please login again',
            });
          } else if (foundSession.isBlocked) {
            return response.status(HttpStatus.UNAUTHORIZED).json({
              message: 'Sorry. You are blocked by admin',
            });
          } else {
            const foundTokenDoc = await this.tokenModel.findOne({
              token,
              type: TokenTypes.GUEST_USER,
              isBlacklisted: false,
            });
            if (!foundTokenDoc) {
              return response.status(HttpStatus.UNAUTHORIZED).json({
                message: 'Token expired please login again',
              });
            } else {
              request['isGuest'] = true;
              request['sessionId'] = foundSession.id;
              return true;
            }
          }
        }
      }
      if (!payload.role) {
        return response.status(HttpStatus.UNAUTHORIZED).json({
          message: 'Invalid token. Please login again.',
        });
      } else {
        // if (payload.role == Roles.USER) {
        const roleId = (await this.roleModel.findOne({ name: Roles.USER }))._id;
        const user = JSON.parse(
          JSON.stringify(
            await this.userModel.findById(payload.id).populate('role').exec(),
          ),
        );
        if (user) {
          const tokenDoc = await this.tokenModel.findOne({
            token,
            user: new mongoose.Types.ObjectId(payload.id),
            type: TokenTypes.ACCESS,
            isBlacklisted: false,
          });
          if (!tokenDoc) {
            return response.status(HttpStatus.UNAUTHORIZED).json({
              message: 'Token expired please login again',
            });
          }
          // if (roleId != user.role._id) {
          //   return response.status(403).json({
          //     message: 'The service is only accesible for users',
          //   });
          // } else {
          request['user'] = user;
          // }
        } else {
          return response.status(HttpStatus.UNAUTHORIZED).json({
            message: 'Invalid Token. User not found',
          });
        }
        // } else {
        //   return response.status(403).json({
        //     message: 'The service is only accesible for users',
        //   });
        // }
      }
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
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
