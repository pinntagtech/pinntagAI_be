import { Injectable } from '@nestjs/common';
import mongoose, { Model } from 'mongoose';
import { Role, RoleDocument } from './models/roles.model';
import { InjectModel } from '@nestjs/mongoose';
import { Admin, AdminDocument } from 'src/admin/models/admin.model';
import {
  BusinessProfile,
  BusinessProfileDocument,
} from 'src/business-profile/models/businessProfile.model';
import { User, UserDocument } from 'src/user/models/user.model';
import { Resource, ResourceDocument } from './models/resource.model';
import { Privilege, PrivilegeDocument } from './models/privilage.model';
import { Action, ActionDocument } from './models/actions.model';
import { CreateRoleDto } from './dto/createRole.dto';
import { UserTypes } from 'src/enums/auth.enums';
import { MapPrivilegeDto } from './dto/mapPrivilege.dto';
import { UpdateRoleDto } from './dto/updateRole.dto';

@Injectable()
export class RolesService {
  constructor(
    @InjectModel(Role.name) private readonly roleModel: Model<RoleDocument>,
    @InjectModel(Admin.name) private readonly adminModel: Model<AdminDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Resource.name) private readonly resourceModel: Model<ResourceDocument>,
    @InjectModel(Privilege.name) private readonly privilegeModel: Model<PrivilegeDocument>,
    @InjectModel(Action.name) private readonly actionModel: Model<ActionDocument>,
  ) {}
  async createRole(user: any, createRoleDto: CreateRoleDto) {
    try {
      const isAdmin = user.userType === UserTypes.ADMIN;
      const isUser = user.userType === UserTypes.USER;
      const { name, description } = createRoleDto;
      const roleData = {
        name,
        description,
        creator: user.id,
        creatorType: isAdmin ? UserTypes.ADMIN : UserTypes.USER,
        belongsToBusiness: isUser,
        belongsToSystem: isAdmin,
        isPrimaryAdmin: isUser,
      };
      const existingRole = await this.roleModel.findOne({
        name: createRoleDto.name,
      });
      if (existingRole) {
        return {
          success: false,
          message: 'Role with this name already exists',
        };
      }
      const createdRole = await this.roleModel.create(roleData);
      return {
        success: true,
        message: 'Role Created Successfully!',
        data: createdRole,
      };
    } catch (error) {
      console.error('Error:', error);
      return {
        success: false,
        message: 'Error while creating role',
      };
    }
  }

  async mapPrivilege(mapPrivilegeDto: MapPrivilegeDto) {
    try {
      const { roleId, actionId, resourceId } = mapPrivilegeDto;
      const [role, action, resource] = await Promise.all([
        this.roleModel.findById(roleId),
        this.actionModel.findById(actionId),
        this.resourceModel.findById(resourceId),
      ]);
      if (!role) {
        return { success: false, message: 'Role not found' };
      }
      if (!action) {
        return { success: false, message: 'Action not found' };
      }
      if (!role) {
        return { success: false, message: 'Role not found' };
      }
      await this.privilegeModel.create({
        role: role._id,
        action: action.title,
        resource: resource.title,
      });
      return {
        success: true,
        message: 'Privileges Mapped Successfully!',
      };
    } catch (error) {
      console.error('Error:', error);
      return {
        success: false,
        message: 'Error while mapping privileges',
      };
    }
  }

  private async getAllChildAdminIds(
    adminId: string,
    collectedIds: string[] = [],
  ): Promise<string[]> {
    collectedIds.push(adminId);
    const childAdmins = await this.roleModel
      .find({ creator: adminId, creatorType: 'Admin' })
      .select('_id');
    const childAdminIds = childAdmins.map((admin) => admin._id.toString());
    if (!childAdminIds.length) {
      return collectedIds;
    }
    for (const childId of childAdminIds) {
      await this.getAllChildAdminIds(childId, collectedIds);
    }
    return collectedIds;
  }

  async fetchRoles(adminId: string, userType: string) {
    try {
      const allAdminIds = await this.getAllChildAdminIds(adminId);
      const roles = await this.roleModel.find({
        creator: { $in: allAdminIds },
        creatorType: userType,
      });

      return {
        success: true,
        message: 'Roles Fetched Successfully!',
        data: roles,
      };
    } catch (error) {
      console.error('Error:', error);
      return {
        success: false,
        message: 'Error while fetching roles',
      };
    }
  }

  async resourcesList() {
    try {
      const resources = await this.resourceModel.find();
      return {
        success: true,
        message: 'Resources Fetched Successfully!',
        data: resources,
      };
    } catch (error) {
      console.error('Error:', error);
      return {
        success: false,
        message: 'Error while fetching resources',
      };
    }
  }

  async updateRole(updateRoleDto: UpdateRoleDto) {
    try {
      const { roleId, name, description } = updateRoleDto;
      const role = await this.roleModel.findById(roleId);
      if (!role) {
        return { success: false, message: 'Role not found' };
      }
      let updateRoleObj = {};
      if (name) {
        updateRoleObj['name'] = name;
      }
      if (description) {
        updateRoleObj['description'] = description;
      }
      if (Object.keys(updateRoleObj).length > 0) {
        await this.roleModel.updateOne(
          { _id: new mongoose.Types.ObjectId(roleId) },
          { $set: { updateRoleObj } },
        );
      }
      const updatedRole = await this.roleModel.findById(roleId);
      return {
        success: true,
        message: 'Role updated successfully',
        data: updatedRole,
      };
    } catch (error) {
      console.error('Error:', error);
      return {
        success: false,
        message: 'Error while updating role',
      };
    }
  }

  async deletePrivilege(privilegeId: string) {
    try {
      const privilege = await this.privilegeModel.findById(privilegeId);
      if (!privilege) {
        return { success: false, message: 'Privilege not found' };
      }
      await this.privilegeModel.deleteOne({
        _id: new mongoose.Types.ObjectId(privilegeId),
      });
      return { success: true, message: 'Privilege deleted successfully' };
    } catch (error) {
      console.error('Error:', error);
      return {
        success: false,
        message: 'Error while deleting privilege',
      };
    }
  }

  async deleteRole(roleId: string, backupRoleId: string, userType: string) {
    try {
      const role = await this.roleModel.findById(roleId);
      if (!role) {
        return { success: false, message: 'Role not found' };
      }
      const backupRole = await this.roleModel.findById(backupRoleId);
      if (!backupRole) {
        return {
          success: false,
          message: 'Backup Role is Required to delete a Role!',
        };
      }
      await this.roleModel.deleteOne({ _id: roleId });
      const privileges = await this.privilegeModel.updateMany(
        { role: new mongoose.Types.ObjectId(roleId) },
        { $set: { role: new mongoose.Types.ObjectId(backupRoleId) } },
      );
      if (userType == UserTypes.ADMIN) {
        await this.adminModel.updateMany(
          {
            role: new mongoose.Types.ObjectId(roleId),
          },
          { $set: { role: new mongoose.Types.ObjectId(backupRoleId) } },
        );
      } else if (userType == UserTypes.USER) {
        await this.userModel.updateMany(
          {
            role: new mongoose.Types.ObjectId(roleId),
          },
          { $set: { role: new mongoose.Types.ObjectId(backupRoleId) } },
        );
      }
      return { success: true, message: 'Role deleted successfully' };
    } catch (error) {
      console.error('Error:', error);
      return {
        success: false,
        message: 'Error while deleting role',
      };
    }
  }
}

