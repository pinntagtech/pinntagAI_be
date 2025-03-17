import { Injectable } from '@nestjs/common';
import mongoose, { Model } from 'mongoose';
import { Role, RoleDocument } from './models/roles.model';
import { InjectModel } from '@nestjs/mongoose';
import { Admin } from 'typeorm';
import { AdminDocument } from 'src/admin/models/admin.model';
import {
  BusinessProfile,
  BusinessProfileDocument,
} from 'src/business-profile/models/businessProfile.model';

@Injectable()
export class RolesService {
  constructor(
    @InjectModel(Role.name) private readonly roleModel: Model<RoleDocument>,
    @InjectModel(Admin.name) private readonly adminModel: Model<AdminDocument>,
    @InjectModel(BusinessProfile.name)
    private readonly businessProfileModel: Model<BusinessProfileDocument>,
  ) {}
  async findRole(id: string) {
    return await this.roleModel.findById(id);
  }

  async createRole(
    userId: string,
    userType: string,
    createRoleDto: Partial<RoleDocument>,
  ) {
    try {
      const [adminDetails, businessDetails] = await Promise.all([
        this.adminModel.findById(userId),
        this.businessProfileModel.findById(userId),
      ]);
      let isSuperAdmin = false;
      let isPrimaryAdmin = false;
      if (adminDetails) {
      }
      let roleObject = {
        name: createRoleDto.name,
        description: createRoleDto.description,
        creator: new mongoose.Types.ObjectId(userId),
        creatorType: userType,
      };
      let createdRole = await this.roleModel.create(roleObject);
      return {
        success: true,
        message: 'Role Created Successfully!',
        data: createdRole,
      };
    } catch (error) {
      console.error('Error:', error);
      return {
        success: false,
        message: `Internal Server Error:${error}`,
      };
    }
  }
}
