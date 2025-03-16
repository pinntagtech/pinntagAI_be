import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';

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
  async findRole(role:string){
    const roleDetails = await this.roleModel.findOne({_id:new mongoose.Types.ObjectId(role)});
    return roleDetails;
  }
  async createRole(userId:string,userType:string,createRoleDto:Partial<RoleDocument>){
    try{
      let roleObject = {
        name: createRoleDto.name,
        description: createRoleDto.description,
        creator: new mongoose.Types.ObjectId(userId),
        creatorType: userType, 
      }
      let createdRole = await this.roleModel.create(roleObject);
      return {
        success:true,
        message:"Role Created Successfully!",
        data: createdRole
      }
    }catch(error){
      console.error("Error:",error);
      return {
        success:false,
        message:`Internal Server Error:${error}`
      }
    }
  }
}
