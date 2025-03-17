import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { PRIVILEGE_KEY } from '../privilege.decorator';
import { Reflector } from '@nestjs/core';
import { RoleBelonging } from '../models/roles.model';
import { DecodedUser } from 'src/auth/interfaces/decodedUser.interface';
import { UserTypes } from 'src/enums/auth.enums';
import { RolesService } from '../roles.service';

@Injectable()
export class 
PrivilegeGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly roleService: RolesService
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
    let roleId = '';
    if(user.userType == UserTypes.USER){
      const foundUser = 
    }
    const foundRole = await this.roleService.findRole(user.role);

    // if(findRole.isSuperAdmin){
    //   return true;
    // }
    if(foundRole.belongsTo == RoleBelonging.BUSINESS){
      if(user.)
    } else {
  }


    const hasPrivilege = await this.roleService.hasPrivilege(
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
