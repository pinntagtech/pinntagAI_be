import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Token } from 'aws-sdk';
import { Request } from 'express';
import mongoose, { Model } from 'mongoose';
import { Admin, AdminDocument } from 'src/admin/models/admin.model';
import {
  Role,
  RoleDocument,
} from 'src/roles/models/roles.model';
import { TokenDocument } from '../models/token.model';
import { TokenTypes, UserTypes } from 'src/enums/auth.enums';
import { RoleBelonging } from 'src/roles/enums/roles.enum';

@Injectable()
export class AdminGuard2 implements CanActivate {
  constructor(
    private jwtService: JwtService,
    @InjectModel(Role.name) private readonly roleModel: Model<RoleDocument>,
    @InjectModel(Admin.name) private readonly adminModel: Model<AdminDocument>,
    @InjectModel(Token.name) private readonly tokenModel: Model<TokenDocument>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
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
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
      });
      if (!payload.userType) {
        throw new UnauthorizedException('Unauthorised. Invalid Token.');
      }
      if (payload.userType != UserTypes.ADMIN) {
        throw new UnauthorizedException(
          'Unauthorised. Service accessible for admins only.',
        );
      }
      const admin = await this.adminModel.findById(payload.id);
      if (!admin) {
        throw new UnauthorizedException('Unauthorised. User does not exist.');
      }
      const role = await this.roleModel.findOne({
        _id: new mongoose.Types.ObjectId(payload.role),
        belongsTo: RoleBelonging.SYSTEM,
      });
      if (!role) {
        throw new UnauthorizedException(
          'Unauthorised. Service accessible for admins only.',
        );
      }
      if (admin.role != payload.role.toString()) {
        throw new UnauthorizedException(
          'Unauthorised. Invalid Token provided.',
        );
      }
      request['isGuest'] = false;
      request['isBusiness'] = false;
      request['isAdmin'] = true;
      request['user'] = admin;
      return true;
    } catch (error) {
      console.log('error message:---', error.name);
      if (error.name == 'TokenExpiredError') {
        throw new UnauthorizedException('Token expired');
      }
      throw new UnauthorizedException('Invalid token. Please login again.');
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
