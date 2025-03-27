import { Injectable } from '@nestjs/common';
import mongoose, { Model } from 'mongoose';
import { BusinessUserCreatorType } from 'src/business/enums/business.enum';
import { DefaultBusinessRoles } from 'src/business/resourceInits/template-roles';
import { Category } from 'src/models/category.model';
import { CreateOutletDto } from './dto/create-outlet.dto';
import { JwtPayload } from 'src/auth/interfaces/tokenPayload.interface';
import { InjectModel } from '@nestjs/mongoose';
import { BusinessUser, BusinessUserDocument } from 'src/business/model/businessUser.model';
import { OutletCategory, OutletCategoryDocument } from './model/outletCategory.model';
import { OutletType, OutletTypeDocument } from './model/outletType.model';
import { Outlet, OutletDocument } from './model/outlet.model';
import { UpdateOutletDto } from './dto/update-outlet.dto';
import { SubscriptionContextImpl } from 'twilio/lib/rest/events/v1/subscription';
import { Role, RoleDocument } from 'src/roles/models/roles.model';

@Injectable()
export class OutletService {
  constructor(
    @InjectModel(BusinessUser.name) private readonly businessUserModel: Model<BusinessUserDocument>,
    @InjectModel(OutletCategory.name) private readonly outletCategoryModel: Model<OutletCategoryDocument>,
    @InjectModel(OutletType.name) private readonly outletTypeModel: Model<OutletTypeDocument>,
    @InjectModel(Outlet.name) private readonly outletModel: Model<OutletDocument>,
    @InjectModel(Role.name) private readonly roleModel: Model<RoleDocument>,
  ) {}
  private async getAllChildUsersIds(
    userId: string,
    collectedIds: string[] = [],
    isFirstCall = true, // Track initial call
  ): Promise<string[]> {
    if (!isFirstCall) {
      collectedIds.push(userId);
    }
    const childUsers = await this.businessUserModel
      .find({
        creator: new mongoose.Types.ObjectId(userId),
        creatorType: BusinessUserCreatorType.BUSINESS,
      })
      .select('_id');
    const childIds = childUsers.map((user) => user._id.toString());
    if (!childIds.length) {
      return collectedIds;
    }
    for (const childId of childIds) {
      await this.getAllChildUsersIds(childId, collectedIds, false);
    }
    return collectedIds;
  }
  async getCategories() {
    try {
      const categories = await this.outletCategoryModel.find();
      return {
        success: true,
        message: 'Categories fetched successfully',
        data: categories,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
  async getTypes(id: string) {
    try {
      const types = await this.outletTypeModel.find({
        category: new mongoose.Types.ObjectId(id),
      });
      return {
        success: true,
        message: 'Types fetched successfully',
        data: types,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
  async managerList(id: string, page: number, limit: number) {
    try {
      const user = await this.businessUserModel.findById(id);
      if (!user) {
        return {
          success: false,
          message: 'Business User not found!',
        };
      }
      const allUserIds = await this.getAllChildUsersIds(user.id);
      const users = await this.businessUserModel.aggregate([
        {
          $match: {
            _id: { $in: allUserIds },
          },
        },
        {
          $lookup: {
            from: 'roles',
            localField: 'role',
            foreignField: '_id',
            as: 'role',
          },
        },
        {
          $unwind: '$role',
        },
        {
          $match: {
            'role.name': DefaultBusinessRoles.Store_Manager.name,
          },
        },
        {
          $sort: { createdAt: -1 },
        },
        {
          $project: {
            _id: 1,
            name: 1,
            isActive: 1,
            email: 1,
            phone: 1,
            countryCode: 1,
            profilePhoto: 1,
            isEmailVerified: 1,
            password: 0,
            role: {
              _id: 1,
              name: 1,
            },
            business: 'businessId',
          },
        },
        {
          $skip: (page - 1) * limit,
        },
        {
          $limit: limit,
        },
      ]);

      return {
        success: true,
        message: 'Business User fetched Successfully!',
        data: users,
      };
    } catch (error) {
      return {
        success: false,
        message: error,
      };
    }
  }
  async createOutlet(data: CreateOutletDto, user: any) {
    try {
        const businessUser = await this.businessUserModel.findById(user.id);
        if (!businessUser) {
          return {
            success: false,
            message: 'Business User not found!',
          };
        }
        const findOutlet = await this.outletTypeModel.find
        let updateObj:any = {};
        Object.keys(data).forEach((key)=>{
            if(data[key] !== undefined){
                updateObj[key] = data[key];
            }
        }) 
        const outlet = new this.businessUserModel({
          ...data,
        }); 
        await businessUser.updateOne({_id:businessUser.id},{$push:{outlets:outlet.id}});


        return {
            success:true,
            message:"Outlet created successfully.",
            data: outlet
        }
    } catch (error) {
      return {
        success: false,
        message: error,
      };
    }
  }
  async updateOutlet(data: UpdateOutletDto, user: any, id: string) {
    try {
        const businessUser = await this.businessUserModel.findById(user.id);
        if (!businessUser) {
          return {
            success: false,
            message: 'Business User not found!',
          };
        }
        const outlet = await this.outletModel.findById(id);
        if (!outlet) {
          return {
            success: false,
            message: 'Outlet not found!',
          };
        }
        let updateObj:any = {};
        Object.keys(data).forEach((key)=>{
            if(data[key] !== undefined){
                updateObj[key] = data[key];
            }
        }) 
        const updatedOutlet = await this.outletModel.findByIdAndUpdate(id, updateObj, {new:true});
        return {
            success:true,
            message:"Outlet updated successfully.",
            data: updatedOutlet
        }
    } catch (error) {
      return {
        success: false,
        message: error,
      };
    }
  }
  async getOutlets(user:any,page,limit){
    try{
        const userDetails = await this.businessUserModel.findById(user.id);
        if(!userDetails){
            return {
                success:false,
                message:"User not found!"
            }
        }
        let outletIds = [];
        outletIds.push(userDetails.outlets);
        const userRole = await this.roleModel.findById(userDetails.role);
        if(userRole.isPrimaryAdmin){
            const getAllManagers = await this.managerList(userDetails.id,1,1000);
            if(getAllManagers.success){
                getAllManagers.data.forEach((manager)=>{
                    outletIds.push(manager.outlets);
                })
            }
        }
        const outlets = await this.outletModel.find({_id:{$in:outletIds}}).skip((page-1)*limit).limit(limit);
        return {
            success:true,
            message:"Outlets fetched successfully.",
            data: outlets
        }
    }catch(error){
        return {
            success: false,
            message: error,
        };
    }
  }
}
