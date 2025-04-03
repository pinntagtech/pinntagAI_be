import { Injectable } from '@nestjs/common';
import mongoose, { Model } from 'mongoose';
import { Role, RoleDocument } from './models/roles.model';
import { InjectModel } from '@nestjs/mongoose';
import { Admin, AdminDocument } from 'src/admin/models/admin.model';
import { User, UserDocument } from 'src/user/models/user.model';
import { Resource, ResourceDocument } from './models/resource.model';
import { Privilege, PrivilegeDocument } from './models/privilage.model';
import { Action, ActionDocument } from './models/actions.model';
import { CreateRoleDto } from './dto/createRole.dto';
import { UserTypes } from 'src/enums/auth.enums';
import { MapPrivilegeDto } from './dto/mapPrivilege.dto';
import { UpdateRoleDto } from './dto/updateRole.dto';
import { RoleBelonging, RoleCreatorType } from './enums/roles.enum';
import {
  BusinessUser,
  BusinessUserDocument,
} from 'src/business/model/businessUser.model';

@Injectable()
export class RolesService {
  constructor(
    @InjectModel(Role.name) private readonly roleModel: Model<RoleDocument>,
    @InjectModel(Admin.name) private readonly adminModel: Model<AdminDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Resource.name)
    private readonly resourceModel: Model<ResourceDocument>,
    @InjectModel(Privilege.name)
    private readonly privilegeModel: Model<PrivilegeDocument>,
    @InjectModel(Action.name)
    private readonly actionModel: Model<ActionDocument>,
    @InjectModel(BusinessUser.name)
    private readonly businessUserModel: Model<BusinessUserDocument>,
  ) {}
  async createRole(user: any, createRoleDto: CreateRoleDto) {
    try {
      const isAdmin = user.userType === UserTypes.ADMIN;
      const isBusiness = user.userType === UserTypes.BUSINESS;
      const [admin, business] = await Promise.all([
        this.adminModel.findOne({ _id: user.id }),
        this.businessUserModel.findOne({ _id: user.id }),
      ]);
      const { name, description } = createRoleDto;
      const roleData = {
        name,
        description,
        creator: new mongoose.Types.ObjectId(user.id),
        creatorType: isAdmin ? RoleCreatorType.ADMIN : RoleCreatorType.BUSINESS,
        belongsTo: isAdmin ? RoleBelonging.SYSTEM : RoleBelonging.BUSINESS,
        // business:
      };

      const existingRole = await this.roleModel.findOne({
        creator: new mongoose.Types.ObjectId(user.id),
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

  async createPrivilege(roleId: string, mapPrivilegeDto: MapPrivilegeDto) {
    try {
      const role = await this.roleModel.findById(roleId);
      if (!role) {
        return { success: false, message: 'Role not found' };
      }
      await this.privilegeModel.deleteMany({ role: role._id });
      let failureCount = 0;
      const failureCases = [];
      for (const privilege of mapPrivilegeDto.data) {
        const resource = await this.resourceModel.findById(privilege.resource);
        if (resource) {
          for (const action of privilege.actions) {
            const actionObj = await this.actionModel.findById(action);
            if (actionObj) {
              await this.privilegeModel.create({
                role: role._id,
                resource: resource.title,
                action: actionObj.title,
              });
            } else {
              failureCount++;
              failureCases.push(`Action with id ${action} not found`);
            }
          }
        } else {
          failureCount++;
          failureCases.push(`Resource with id ${privilege.resource} not found`);
        }
      }
      const updatedRole = await this.roleModel.findById(role._id);
      return {
        success: true,
        message: 'Privileges Mapped Successfully!',
        data: {
          role: updatedRole,
          failureCount,
          failureCases,
        },
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
    id: string,
    creatorType: string,
    firstTime: boolean,
    collectedIds: string[] = [],
  ): Promise<string[]> {
    if (!firstTime) collectedIds.push(id);
    const children = await this.roleModel
      .find({ creator: new mongoose.Types.ObjectId(id), creatorType })
      .select('_id');
    const childrenIds = children.map((child) => child._id.toString());
    if (!childrenIds.length) {
      return collectedIds;
    }
    for (const childId of childrenIds) {
      await this.getAllChildAdminIds(childId, creatorType, false, collectedIds);
    }
    return collectedIds;
  }

  async fetchRoles(id: string, userType: string) {
    try {
      let allAdminIds = await this.getAllChildAdminIds(id, userType, true, []);
      let ownerRole = null;
      if (userType === UserTypes.ADMIN) {
        const findAdminUser = await this.adminModel.findById(id);
        if (!findAdminUser) {
          return {
            success: false,
            message: 'User not found',
          };
        }
        ownerRole = findAdminUser.role;
      } else if (userType === UserTypes.BUSINESS) {
        const findBusinessUser = await this.businessUserModel.findById(id);
        if (!findBusinessUser) {
          return {
            success: false,
            message: 'Business User not found',
          };
        }
        ownerRole = findBusinessUser.role[0];
      }
      console.log('allAdminIds:', allAdminIds);
      const roles = await this.roleModel.find({
        _id: { $in: allAdminIds, $ne: ownerRole },
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

  async fetchRole(roleId: string) {
    try {
      const role = await this.roleModel.findById(roleId);
      if (!role) {
        return { success: false, message: 'Role not found' };
      }
      const privileges = await this.privilegeModel.aggregate([
        {
          $match: {
            role: new mongoose.Types.ObjectId(roleId),
          },
        },
        {
          $group: {
            _id: '$resource',
            actions: {
              $push: '$action',
            },
          },
        },
        {
          $project: {
            name: '$_id',
            actions: 1,
            _id: 0,
          },
        },
      ]);
      return {
        success: true,
        message: 'Role Fetched Successfully!',
        data: {
          role,
          privileges,
        },
      };
    } catch (error) {
      console.error('Error:', error);
      return {
        success: false,
        message: 'Error while fetching role',
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
  async actionsList() {
    try {
      const actions = await this.actionModel.find();
      return {
        success: true,
        message: 'Resources Fetched Successfully!',
        data: actions,
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
          { $set: updateRoleObj },
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

  async assignRole(id: string, userType: string, roleId: string) {
    try {
      let assignedTo = null;
      if (userType === UserTypes.ADMIN) {
        assignedTo = await this.adminModel
          .findByIdAndUpdate(
            { _id: id },
            { $set: { role: new mongoose.Types.ObjectId(roleId) } },
            { new: true },
          )
          .populate('role', 'name');
      } else if (userType === UserTypes.BUSINESS) {
        assignedTo = await this.businessUserModel
          .findByIdAndUpdate(
            { _id: id },
            { $set: { role: new mongoose.Types.ObjectId(roleId) } },
            { new: true },
          )
          .populate('role', 'name');
      }
      return {
        success: true,
        message: 'Resources Fetched Successfully!',
        data: assignedTo,
      };
    } catch (error) {
      console.error('Error:', error);
      return {
        success: false,
        message: 'Error while fetching resources',
      };
    }
  }
}
