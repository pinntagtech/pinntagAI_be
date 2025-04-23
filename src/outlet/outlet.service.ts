import { Injectable } from '@nestjs/common';
import mongoose, { get, Model } from 'mongoose';
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
import { OutletCategoryList, VehicleType } from './outlet.enum';
import { Business, BusinessDocument } from 'src/business/model/business.model';

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
    @InjectModel(Business.name)
    private readonly businessModel: Model<BusinessDocument>,
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
  async getCategories(page: number, limit: number) {
    try {
      const categories = await this.outletCategoryModel
        .find()
        .skip((page - 1) * limit)
        .limit(limit);
      const total = await this.outletCategoryModel.countDocuments();
      return {
        success: true,
        message: 'Categories fetched successfully',
        data: categories,
        total: total,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
  async getTypes(id: string, page: number, limit: number) {
    try {
      const types = await this.outletTypeModel
        .find({
          category: new mongoose.Types.ObjectId(id),
        })
        .skip((page - 1) * limit)
        .limit(limit);
      const total = await this.outletTypeModel.countDocuments();
      return {
        success: true,
        message: 'Types fetched successfully',
        data: types,
        total: total,
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
      allUserIds.map((id) =>
        mongoUserIds.push(new mongoose.Types.ObjectId(id)),
      );
      console.log('allUserIds', mongoUserIds);
      const usersResult = await this.businessUserModel.aggregate([
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
          $facet: {
            data: [
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
                    _id: '$role._id',
                    name: '$role.name',
                  },
                  business: '$businessId',
                  outlets: 1,
                },
              },
              { $skip: (page - 1) * limit },
              { $limit: limit },
            ],
            totalCount: [{ $count: 'count' }],
          },
        },
      ]);
      const users = usersResult[0].data;
      const totalCount =
        usersResult[0].totalCount.length > 0
          ? usersResult[0].totalCount[0].count
          : 0;

      return {
        success: true,
        message: 'Business User fetched Successfully!',
        data: users,
        total: totalCount,
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
      // const foundCategory = await this.outletCategoryModel.findById(
      //   data.category,
      // );
      // if (!foundCategory) {
      //   return {
      //     success: false,
      //     message: 'Category not found!',
      //   };
      // }
      // const foundType = await this.outletTypeModel.findById(data.type);
      // if (!foundType) {
      //   return {
      //     success: false,
      //     message: 'Type not found!',
      //   };
      // }
      let {
        category,
        // type,
        refId,
        name,
        manager,
        city,
        state,
        country,
        zip,
        countryCode,
        phone,
        email,
        whatsappNumber,
        website,
        facebook,
        instagram,
        twitter,
        googleMyBusinessId,
        address1,
        address2,
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

      const business = await this.businessModel.findById(businessUser.business);
      if (!business) {
        return {
          success: false,
          message: 'Business not found!',
        };
      }
      const foundOutlet = await this.outletModel.findOne({
        refId: refId,
        business: business._id,
      });
      console.log('foundOutlet', foundOutlet);
      if (foundOutlet) {
        return {
          success: false,
          message: 'Outlet already exists with given reference Id!',
        };
      }

      let createObj: any = {};
      Object.keys(data).forEach((key) => {
        if (data[key] !== undefined) {
          createObj[key] = data[key];
        }
      });
      // if (createObj.manager && createObj.manager !== '') {
      //   const foundManager = await this.businessUserModel.findOne({
      //     _id: new mongoose.Types.ObjectId(manager),
      //   });
      //   if (!foundManager) {
      //     return {
      //       success: false,
      //       message: 'Manager not found in the database!',
      //     };
      //   }
      //   createObj['manager'] = new mongoose.Types.ObjectId(manager);
      // }

      if (createObj.category === OutletCategoryList.PHYSICAL) {
        console.log('address1:', address1);
        console.log('posSystemId:', posSystemId, typeof posSystemId);
        if (!address1 || !posSystemId) {
          console.log('it should enter this block');
          return {
            success: false,
            message: 'Address Line 1 or POS System ID is required.',
          };
        }
      } else if (createObj.category === OutletCategoryList.MOBILE) {
        if (!vehicleRegistrationNumber || !vehicleType || !gpsTrackerEnabled) {
          return {
            success: false,
            message:
              'Vehicle Registration Number or Vehicle Type or GPS Status is required.',
          };
        }
      } 
      // else if (foundCategory.title === OutletCategoryList.TEMPORARY) {
      //   if (!eventName || !startDate || !endDate || !boothNumber) {
      //     return {
      //       success: false,
      //       message:
      //         'Event Name or Start Date or End Date or Booth Number is required.',
      //     };
      //   }
      // } else if (foundCategory.title === OutletCategoryList.ONLINE) {
      // } else if (foundCategory.title === OutletCategoryList.SPECIALTY) {
      //   if (!insidePremise || !premiseName) {
      //     return {
      //       success: false,
      //       message: 'Inside Premise or Premise Name is required.',
      //     };
      //   }
      // } 
      else {
        return {
          success: false,
          message: 'Invalid category.',
        };
      }

      // createObj['category'] = new mongoose.Types.ObjectId(category);
      // createObj['type'] = new mongoose.Types.ObjectId(type);
      createObj['creator'] = new mongoose.Types.ObjectId(user.id);
      createObj['business'] = new mongoose.Types.ObjectId(business.id);

      const outlet = await this.outletModel.create(createObj);
      console.log('Business User Id:', businessUser.id);

      if (createObj.manager) {
        const isUserUpdated = await this.businessUserModel.updateOne(
          { _id: createObj.manager },
          { $push: { outlets: outlet.id } },
        );
      }

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
      if (data.manager) {
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
        await this.businessUserModel.updateOne(
          { _id: updateObj.manager },
          { $addToSet: { outlets: new mongoose.Types.ObjectId(id) } },
        );
      }
      if (data.category) {
        updateObj['category'] = new mongoose.Types.ObjectId(data.category);
      }
      if (data.type) {
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
  async getOutlets(user: any, page: number, limit: number) {
    try {
      const userDetails = await this.businessUserModel.findById(user.id);
      if (!userDetails) {
        return {
          success: false,
          message: 'User not found!',
        };
      }
      console.log('UserDetails:', userDetails);
      let outletIds = [];
      outletIds = outletIds.concat(userDetails.outlets);

      let mongoUserIds = [];
      outletIds.map((id) => mongoUserIds.push(new mongoose.Types.ObjectId(id)));
      console.log('allUserIds', mongoUserIds);

      const userRole = await this.roleModel.findById(userDetails.role);
      console.log('outlet IDS 1:', outletIds);
      let getOutletObj = {};
      if (userRole.isBusinessOwner) {
        // const getAllManagers = await this.managerList(userDetails.id, 1, 1000);
        // console.log('getAllManagers', getAllManagers);
        // if (getAllManagers.success) {
        //   getAllManagers.data.forEach((manager) => {
        //     outletIds = outletIds.concat(manager.outlets);
        //   });
        // }
        getOutletObj['business'] = userDetails.business;
      } else {
        getOutletObj['_id'] = { $in: mongoUserIds };
      }
      console.log('getOutletObj', getOutletObj);

      const outlets = await this.outletModel
        .find(getOutletObj)
        .populate('category')
        .populate('type')
        .populate({
          path: 'manager',
          select: 'name email phone countryCode profilePhoto',
          match: { manager: { $ne: '' } }
        })
        // .populate({
        //   path: 'creator',
        //   select: 'name email phone countryCode profilePhoto',
        //   match: { _id: { $ne: '' } } 
        // })
        .populate('business', 'name email phone countryCode logo')
        .skip((page - 1) * limit)
        .limit(limit)

        console.log('outlets:', outlets); 

      const total = await this.outletModel.countDocuments({
        ...getOutletObj,
      });
      console.log('outlets:', outlets);
      return {
        success: true,
        message: 'Outlets fetched successfully.',
        data: outlets,
        total: total,
      };
    } catch (error) {
      return {
        success: false,
        message: error,
      };
    }
  }
  async getVehicleTypes(page: number, limit: number) {
    try {
      const vehicleTypes: string[] = Object.values(VehicleType);
      const paginated = vehicleTypes.slice((page - 1) * limit, page * limit);
      const total = Object.keys(VehicleType).length;
      return {
        success: true,
        message: 'Vehicle Types fetched successfully',
        data: paginated,
        total: total,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
}
