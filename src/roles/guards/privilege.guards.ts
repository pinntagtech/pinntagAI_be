import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { PRIVILEGE_KEY } from '../privilege.decorator';
import { Reflector } from '@nestjs/core';
import { UserTypes } from 'src/enums/auth.enums';
import { RolesService } from '../roles.service';
import { PrivilegeService } from '../privilege.service';
import { RoleBelonging } from '../enums/roles.enum';
import { InjectModel } from '@nestjs/mongoose';
import { Admin, AdminDocument } from 'src/admin/models/admin.model';
import { Model } from 'mongoose';
import { Role, RoleDocument } from '../models/roles.model';
import {
  BusinessUser,
  BusinessUserDocument,
} from 'src/business/model/businessUser.model';

@Injectable()
export class PrivilegeGuard implements CanActivate {
  constructor(
    @InjectModel(Admin.name) private readonly adminModel: Model<AdminDocument>,
    @InjectModel(BusinessUser.name)
    private readonly businessUserModel: Model<BusinessUserDocument>,
    @InjectModel(Role.name) private readonly roleModel: Model<RoleDocument>,
    private reflector: Reflector,
    private readonly privilegeService: PrivilegeService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPrivilege = this.reflector.get<{
      resource: string;
      action: string;
    }>(PRIVILEGE_KEY, context.getHandler());

    if (!requiredPrivilege) return true; // No privilege required

    const request = context.switchToHttp().getRequest();
    const user = request.user; // Assume user is attached by AuthGuard
    if (!user || !user.role) {
      throw new UnauthorizedException('User role not found');
    }
    const userJson = JSON.parse(JSON.stringify(user));
    // console.log(userJson);
    if (request['isAdmin']) {
      const admin = await this.adminModel.findById(userJson._id);
      const role = admin.role;
      const roleModel = await this.roleModel.findById(role);
      if (
        roleModel.belongsTo == RoleBelonging.SYSTEM &&
        roleModel.isSuperAdmin
      ) {
        return true;
      }
    } else if (request['isBusiness']) {
      const businessUser = await this.businessUserModel.findById(userJson._id);
      const role = businessUser.role;
      const roleModel = await this.roleModel.findById(role);
      if (
        roleModel.belongsTo == RoleBelonging.BUSINESS &&
        roleModel.isBusinessOwner
      ) {
        return true;
      }
    }
    const hasPrivilege = await this.privilegeService.hasPrivilege(
      userJson.role,
      requiredPrivilege.resource,
      requiredPrivilege.action,
    );
    if (!hasPrivilege) {
      throw new UnauthorizedException('Insufficient privileges');
    }

    return true;
  }
}
