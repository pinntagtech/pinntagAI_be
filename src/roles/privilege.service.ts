import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Role, RoleDocument } from './models/roles.model';
import { Privilege } from './privilege.decorator';
import { PrivilegeDocument } from './models/privilage.model';

@Injectable()
export class PrivilegeService {
  constructor(
    @InjectModel(Role.name) private roleModel: Model<RoleDocument>,
    @InjectModel(Privilege.name) private privilegeModel: Model<PrivilegeDocument>,
) {}

  async hasPrivilege(
    role: string,
    resource: string,
    action: string,
  ): Promise<boolean> {
    const privilege = await this.privilegeModel.findOne({ role, resource, action });
    return !!privilege;
  }
}
