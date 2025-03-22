import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { PRIVILEGE_KEY } from '../privilege.decorator';
import { Reflector } from '@nestjs/core';
import { DecodedUser } from 'src/auth/interfaces/decodedUser.interface';
import { UserTypes } from 'src/enums/auth.enums';
import { RolesService } from '../roles.service';
import { PrivilegeService } from '../privilege.service';
import { RoleBelonging } from '../enums/roles.enum';
import { InjectModel } from '@nestjs/mongoose';
import { Admin, AdminDocument } from 'src/admin/models/admin.model';
import { Model } from 'mongoose';
import { Role, RoleDocument } from '../models/roles.model';
import { Business } from 'src/business/model/business.model';
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
    private readonly roleService: RolesService,
    private readonly privilegeService: PrivilegeService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPrivilege = this.reflector.get<{
      resource: string;
      action: string;
    }>(PRIVILEGE_KEY, context.getHandler());

    if (!requiredPrivilege) return true; // No privilege required

    const request = context.switchToHttp().getRequest();
    const user = request.user as DecodedUser; // Assume user is attached by AuthGuard
    if (!user || !user.role) {
      throw new UnauthorizedException('User role not found');
    }
    console.log('user is:---', user);
    console.log('usertype is:---', user.userType);
    if (user.userType == UserTypes.ADMIN) {
      const admin = await this.adminModel.findById(user.id);
      const role = admin.role;
      const roleModel = await this.roleModel.findById(role);
      console.log('roleModel is:---', roleModel);
      if (
        roleModel.belongsTo == RoleBelonging.SYSTEM &&
        roleModel.isSuperAdmin
      ) {
        return true;
      }
    } else if (user.userType == UserTypes.BUSINESS) {
      const businessUser = await this.businessUserModel.findById(user.id);
      const role = businessUser.role;
      const roleModel = await this.roleModel.findById(role);
      if (
        roleModel.belongsTo == RoleBelonging.BUSINESS &&
        roleModel.isPrimaryAdmin
      ) {
        return true;
      }
    }
    const hasPrivilege = await this.privilegeService.hasPrivilege(
      user.role,
      requiredPrivilege.resource,
      requiredPrivilege.action,
    );
    if (!hasPrivilege) {
      throw new UnauthorizedException('Insufficient privileges');
    }

    return true;
  }
}
