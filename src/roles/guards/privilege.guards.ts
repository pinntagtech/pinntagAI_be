import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { PRIVILEGE_KEY } from '../privilege.decorator';
import { Reflector } from '@nestjs/core';
import { PrivilegeService } from '../privilege.service';
import mongoose from 'mongoose';

@Injectable()
export class PrivilegeGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private privilegeService: PrivilegeService,
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
    const findRole = await this.privilegeService.findRole(user.role);
    
    if(findRole.isSuperAdmin){
      return true;
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
