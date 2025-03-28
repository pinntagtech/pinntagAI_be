import { Injectable } from '@nestjs/common';
import mongoose, { Model } from 'mongoose';
import { BusinessUserCreatorType } from 'src/business/enums/business.enum';
import { DefaultBusinessRoles } from 'src/business/resourceInits/template-roles';
import { Category } from 'src/models/category.model';
import { CreateOutletDto } from './dto/create-outlet.dto';
import { JwtPayload } from 'src/auth/interfaces/tokenPayload.interface';
import { InjectModel } from '@nestjs/mongoose';
import {
  BusinessUser,
  BusinessUserDocument,
} from 'src/business/model/businessUser.model';
import {
  OutletCategory,
  OutletCategoryDocument,
} from './model/outletCategory.model';
import { OutletType, OutletTypeDocument } from './model/outletType.model';
import { Outlet, OutletDocument } from './model/outlet.model';
import { UpdateOutletDto } from './dto/update-outlet.dto';
import { SubscriptionContextImpl } from 'twilio/lib/rest/events/v1/subscription';
import { Role, RoleDocument } from 'src/roles/models/roles.model';
import { OutletCategoryList } from './outlet.enum';

@Injectable()
export class OutletService {
  constructor(
    @InjectModel(BusinessUser.name)
    private readonly businessUserModel: Model<BusinessUserDocument>,
    @InjectModel(OutletCategory.name)
    private readonly outletCategoryModel: Model<OutletCategoryDocument>,
    @InjectModel(OutletType.name)
    private readonly outletTypeModel: Model<OutletTypeDocument>,
    @InjectModel(Outlet.name)
    private readonly outletModel: Model<OutletDocument>,
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
      let allUserIds = await this.getAllChildUsersIds(user.id);
      let mongoUserIds = [];
      allUserIds.map((id) => mongoUserIds.push(new mongoose.Types.ObjectId(id)));
      console.log("allUserIds", mongoUserIds);
      
      const users = await this.businessUserModel.aggregate([
        {
          $match: {
            _id: { $in: mongoUserIds },
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
            role: {
              _id: 1,
              name: 1,
            },
            business: 'businessId',
            outlets:1,
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
      const foundCategory = await this.outletCategoryModel.findById(
        data.category,
      );
      if (!foundCategory) {
        return {
          success: false,
          message: 'Category not found!',
        };
      }
      const foundType = await this.outletTypeModel.findById(data.type);
      if (!foundType) {
        return {
          success: false,
          message: 'Type not found!',
        };
      }
      const {
        category,
        type,
        refId,
        name,
        manager,
        city,
        state,
        country,
        postalCode,
        countryCode,
        phone,
        email,
        whatsappNumber,
        website,
        facebook,
        instagram,
        twitter,
        googleMyBusinessId,
        addressLine1,
        addressLine2,
        posSystemId,
        vehicleRegistrationNumber,
        vehicleType,
        gpsTrackerEnabled,
        eventName,
        startDate,
        endDate,
        boothNumber,
        partneredDeliveryServices,
        insidePremise,
        premiseName,
      } = data;
      const foundOutlet = await this.outletModel.findOne({ refId: refId });
      console.log('foundOutlet', foundOutlet);
      if (foundOutlet) {
        return {
          success: false,
          message: 'Outlet already exists with given reference Id!',
        };
      }
      const foundManager = await this.businessUserModel.findOne({
        _id: new mongoose.Types.ObjectId(manager),
      });
      if (!foundManager) {
        return {
          success: false,
          message: 'Manager not found in the database!',
        };
      }
      if (foundCategory.title === OutletCategoryList.PHYSICAL) {
        console.log('addressLine1:', addressLine1);
        console.log('posSystemId:', posSystemId, typeof posSystemId);
        if (!addressLine1 || !posSystemId) {
          console.log('it should enter this block');
          return {
            success: false,
            message: 'Address Line 1 or POS System ID is required.',
          };
        }
      } else if (foundCategory.title === OutletCategoryList.MOBILE) {
        if (!vehicleRegistrationNumber || !vehicleType || !gpsTrackerEnabled) {
          return {
            success: false,
            message:
              'Vehicle Registration Number or Vehicle Type or GPS Status is required.',
          };
        }
      } else if (foundCategory.title === OutletCategoryList.TEMPORARY) {
        if (!eventName || !startDate || !endDate || !boothNumber) {
          return {
            success: false,
            message:
              'Event Name or Start Date or End Date or Booth Number is required.',
          };
        }
      } else if (foundCategory.title === OutletCategoryList.ONLINE) {
        if (!insidePremise || !premiseName) {
          return {
            success: false,
            message: 'Inside Premise or Premise Name is required.',
          };
        }
      } else if (foundCategory.title === OutletCategoryList.SPECIALTY) {
      } else {
        return {
          success: false,
          message: 'Invalid category.',
        };
      }

      let updateObj: any = {};
      Object.keys(data).forEach((key) => {
        if (data[key] !== undefined) {
          updateObj[key] = data[key];
        }
      });
      const outlet = await this.outletModel.create({
        ...data,
        manager: foundManager._id,
        category: foundCategory._id,
        type: new mongoose.Types.ObjectId(type),
        creator:  businessUser._id,
      });
      console.log("Business User Id:", businessUser.id);
      const isUserUpdated = await this.businessUserModel.updateOne(
        { _id: foundManager.id },
        { $push: { outlets: outlet.id } },
      );
      console.log("Is User Updated", isUserUpdated);
      return {
        success: true,
        message: 'Outlet created successfully.',
        data: outlet,
      };
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
      let updateObj: any = {};
      Object.keys(data).forEach((key) => {
        if (data[key] !== undefined) {
          updateObj[key] = data[key];
        }
      });
      if(data.manager){
        const foundManager = await this.businessUserModel.findOne({
          _id: new mongoose.Types.ObjectId(data.manager),
        });
        if (!foundManager) {
          return {
            success: false,
            message: 'Manager not found in the database!',
          };
        }
        updateObj['manager'] = new mongoose.Types.ObjectId(data.manager);
      }
      if(data.category){
        updateObj['category'] = new mongoose.Types.ObjectId(data.category);
      }
      if(data.type){
        updateObj['type'] = new mongoose.Types.ObjectId(data.type);
      }
      const updatedOutlet = await this.outletModel.findByIdAndUpdate(
        id,
        updateObj,
        { new: true },
      );
      return {
        success: true,
        message: 'Outlet updated successfully.',
        data: updatedOutlet,
      };
    } catch (error) {
      return {
        success: false,
        message: error,
      };
    }
  }
  async getOutlets(user: any, page, limit) {
    try {
      const userDetails = await this.businessUserModel.findById(user.id);
      if (!userDetails) {
        return {
          success: false,
          message: 'User not found!',
        };
      }
      console.log("UserDetails:",userDetails)
      let outletIds = [];
      outletIds = outletIds.concat(userDetails.outlets);
      const userRole = await this.roleModel.findById(userDetails.role);
      console.log("outlet IDS 1:",outletIds)
      if (userRole.isPrimaryAdmin) {
        const getAllManagers = await this.managerList(userDetails.id, 1, 1000);
        console.log("getAllManagers", getAllManagers);
        if (getAllManagers.success) {
          getAllManagers.data.forEach((manager) => {
            outletIds = outletIds.concat(manager.outlets);
          });
        }
      }
      console.log("outletsIds", outletIds);
      let mongoUserIds = [];
      outletIds.map((id) => mongoUserIds.push(new mongoose.Types.ObjectId(id)));
      console.log("allUserIds", mongoUserIds);

      const outlets = await this.outletModel
        .find({ _id: { $in: mongoUserIds } })
        .skip((page - 1) * limit)
        .limit(limit);
      console.log("outlets:",outlets);
      return {
        success: true,
        message: 'Outlets fetched successfully.',
        data: outlets,
      };
    } catch (error) {
      return {
        success: false,
        message: error,
      };
    }
  }
}
