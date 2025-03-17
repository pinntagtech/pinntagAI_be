import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';

import { Role, RoleDocument } from './models/roles.model';
import { Privilege } from './privilege.decorator';
import { PrivilegeDocument } from './models/privilage.model';
import { Admin, AdminDocument } from 'src/admin/models/admin.model';
import {
  BusinessProfile,
  BusinessProfileDocument,
} from 'src/business-profile/models/businessProfile.model';

@Injectable()
export class PrivilegeService {
  constructor(
    @InjectModel(Privilege.name)
    private readonly privilegeModel: Model<PrivilegeDocument>,
    @InjectModel(Admin.name) private readonly adminModel: Model<AdminDocument>,
    @InjectModel(BusinessProfile.name)
    private readonly businessProfileModel: Model<BusinessProfileDocument>,
  ) {}

  async hasPrivilege(
    role: string,
    resource: string,
    action: string,
  ): Promise<boolean> {
    const privilege = await this.privilegeModel.findOne({
      role,
      resource,
      action,
    });
    return !!privilege;
  }
}
